-- ============================================================
-- Migration: Purchase fejléc mezők + gyors rögzítés + idempotens tételsor RPC
-- Dátum: 2026-04-06
-- Kontextus:
--   A purchases táblán eddig csak a tételek összegéből számított total_net volt.
--   Most bevezetjük a fejléc szintű pénzügyi mezőket (net/vat/gross) és a
--   számviteli dátumokat, hogy tételsorok nélkül is rögzíthető legyen egy számla.
--
--   Két új RPC:
--   1. record_purchase_header  — csak fejléc, nincs tételsor, nincs készletmozgás
--   2. apply_purchase_line_items — idempotens tételsor írás meglévő purchase-hez:
--        régi tételek készlethatásának visszavonása → törlés → új tételek + készlet
--      NEM érinti a cash_transactions táblát (pénzmozgás csak egyszer, a fejlécnél)
--
--   record_purchase_core frissítés: az INSERT-be bekerül net_amount = p_total_net,
--   hogy az új tételes bejegyzéseknél is kitöltött legyen a fejléc összeg.
--
-- Futtatás: Supabase SQL Editor — idempotens (IF NOT EXISTS / CREATE OR REPLACE)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Új mezők a purchases táblán
-- ------------------------------------------------------------

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS net_amount       BIGINT,   -- fejléc nettó (fillér) — invoice stated amount
  ADD COLUMN IF NOT EXISTS vat_amount       BIGINT,   -- fejléc ÁFA (fillér)
  ADD COLUMN IF NOT EXISTS gross_amount     BIGINT,   -- fejléc bruttó (fillér)
  ADD COLUMN IF NOT EXISTS performance_date DATE,     -- teljesítés dátuma
  ADD COLUMN IF NOT EXISTS invoice_date     DATE,     -- kiállítás dátuma
  ADD COLUMN IF NOT EXISTS due_date         DATE;     -- fizetési határidő

-- Régi rekordok: NULL marad minden új mezőben — backward compatible.
-- A listában net_amount ?? total_net fallback-kel jelenítjük meg az összeget.

-- ------------------------------------------------------------
-- 2. record_purchase_core frissítés
--    Egyetlen változás: INSERT-be bekerül net_amount = p_total_net
--    A függvény szignatúrája változatlan — a meglévő TS kód nem törik.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_purchase_core(
  p_date            DATE,
  p_supplier_name   TEXT,
  p_invoice_number  TEXT,
  p_payment_method  TEXT,
  p_total_net       BIGINT,
  p_items           JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_purchase_id     UUID;
  v_item            JSONB;
  v_is_product      BOOLEAN;
  v_product_id      UUID;
  v_quantity        NUMERIC(10,4);
  v_unit_id         UUID;
  v_unit_price_net  INTEGER;
  v_line_total      BIGINT;
  v_computed_total  BIGINT := 0;
  v_item_index      INTEGER := 0;
BEGIN

  IF p_supplier_name IS NULL OR TRIM(p_supplier_name) = '' THEN
    RAISE EXCEPTION 'supplier_name nem lehet üres';
  END IF;

  IF p_payment_method NOT IN ('cash', 'bank_transfer') THEN
    RAISE EXCEPTION
      'Érvénytelen payment_method: "%". Elfogadott értékek: cash, bank_transfer',
      p_payment_method;
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'p_items nem lehet NULL vagy üres tömb';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_index := v_item_index + 1;
    v_is_product := (v_item->>'product_id') IS NOT NULL;

    IF v_is_product THEN
      IF (v_item->>'unit_id') IS NULL THEN
        RAISE EXCEPTION 'unit_id hiányzik a(z) %-. tételből', v_item_index;
      END IF;
      IF (v_item->>'quantity') IS NULL OR (v_item->>'quantity')::NUMERIC <= 0 THEN
        RAISE EXCEPTION 'quantity > 0 szükséges a(z) %-. tételnél (kapott: %)',
          v_item_index, COALESCE(v_item->>'quantity', 'NULL');
      END IF;
      IF (v_item->>'unit_price_net') IS NULL OR (v_item->>'unit_price_net')::INTEGER <= 0 THEN
        RAISE EXCEPTION 'unit_price_net > 0 szükséges a(z) %-. tételnél (kapott: %)',
          v_item_index, COALESCE(v_item->>'unit_price_net', 'NULL');
      END IF;
    ELSE
      IF (v_item->>'description') IS NULL OR TRIM(v_item->>'description') = '' THEN
        RAISE EXCEPTION 'description megadása kötelező a(z) %-. költség tételnél', v_item_index;
      END IF;
      IF (v_item->>'unit_price_net') IS NULL OR (v_item->>'unit_price_net')::INTEGER <= 0 THEN
        RAISE EXCEPTION 'unit_price_net > 0 szükséges a(z) %-. tételnél (kapott: %)',
          v_item_index, COALESCE(v_item->>'unit_price_net', 'NULL');
      END IF;
    END IF;

    v_computed_total := v_computed_total
      + ROUND(
          COALESCE((v_item->>'quantity')::NUMERIC(10,4), 1)
          * (v_item->>'unit_price_net')::BIGINT
        )::BIGINT;
  END LOOP;

  IF v_computed_total != p_total_net THEN
    RAISE EXCEPTION
      'Végösszeg eltérés: paraméter = % fillér, tételekből számított = % fillér.',
      p_total_net, v_computed_total;
  END IF;

  -- net_amount = p_total_net: fejléc összeg is kitöltött új tételes bejegyzéseknél
  INSERT INTO purchases (date, supplier_name, invoice_number, payment_method, total_net, net_amount)
  VALUES (
    p_date,
    TRIM(p_supplier_name),
    NULLIF(TRIM(COALESCE(p_invoice_number, '')), ''),
    p_payment_method,
    p_total_net,
    p_total_net   -- ← új: net_amount = p_total_net
  )
  RETURNING id INTO v_purchase_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_is_product     := (v_item->>'product_id') IS NOT NULL;
    v_unit_price_net := (v_item->>'unit_price_net')::INTEGER;

    IF v_is_product THEN
      v_product_id := (v_item->>'product_id')::UUID;
      v_quantity   := (v_item->>'quantity')::NUMERIC(10,4);
      v_unit_id    := (v_item->>'unit_id')::UUID;
      v_line_total := ROUND(v_quantity * v_unit_price_net::BIGINT)::BIGINT;

      INSERT INTO purchase_line_items (
        purchase_id, product_id, quantity, unit_id, unit_price_net, line_total_net
      ) VALUES (v_purchase_id, v_product_id, v_quantity, v_unit_id, v_unit_price_net, v_line_total);

      UPDATE products
      SET
        current_stock      = COALESCE(current_stock, 0) + v_quantity,
        purchase_price_net = v_unit_price_net,
        updated_at         = NOW()
      WHERE id = v_product_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Termék nem található: %', v_product_id;
      END IF;

    ELSE
      v_line_total := v_unit_price_net::BIGINT;

      INSERT INTO purchase_line_items (
        purchase_id, product_id, quantity, unit_id, unit_price_net, line_total_net, description
      ) VALUES (
        v_purchase_id, NULL, 1, NULL, v_unit_price_net, v_line_total,
        TRIM(v_item->>'description')
      );
    END IF;

  END LOOP;

  RETURN v_purchase_id;
END;
$$;

-- ------------------------------------------------------------
-- 3. record_purchase_header — gyors rögzítés, tételsor nélkül
--    A cash_transaction-t a TS oldalon hozzuk létre (mint record_purchase_core esetén).
--    Visszaad: purchases.id — TS oldalon a cash_transaction purchase_id FK-hoz kell.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_purchase_header(
  p_date             DATE,
  p_supplier_name    TEXT,
  p_invoice_number   TEXT,
  p_payment_method   TEXT,
  p_net_amount       BIGINT,        -- fillér; kötelező
  p_vat_amount       BIGINT,        -- fillér
  p_gross_amount     BIGINT,        -- fillér
  p_performance_date DATE DEFAULT NULL,
  p_invoice_date     DATE DEFAULT NULL,
  p_due_date         DATE DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_purchase_id UUID;
BEGIN

  IF p_supplier_name IS NULL OR TRIM(p_supplier_name) = '' THEN
    RAISE EXCEPTION 'supplier_name nem lehet üres';
  END IF;

  IF p_payment_method NOT IN ('cash', 'bank_transfer') THEN
    RAISE EXCEPTION
      'Érvénytelen payment_method: "%". Elfogadott értékek: cash, bank_transfer',
      p_payment_method;
  END IF;

  IF p_net_amount IS NULL OR p_net_amount <= 0 THEN
    RAISE EXCEPTION 'net_amount > 0 szükséges (kapott: %)', COALESCE(p_net_amount::TEXT, 'NULL');
  END IF;

  IF p_gross_amount IS NULL OR p_gross_amount <= 0 THEN
    RAISE EXCEPTION 'gross_amount > 0 szükséges (kapott: %)', COALESCE(p_gross_amount::TEXT, 'NULL');
  END IF;

  -- total_net = net_amount: a listában backward-compat fallback
  INSERT INTO purchases (
    date,
    supplier_name,
    invoice_number,
    payment_method,
    total_net,
    net_amount,
    vat_amount,
    gross_amount,
    performance_date,
    invoice_date,
    due_date
  ) VALUES (
    p_date,
    TRIM(p_supplier_name),
    NULLIF(TRIM(COALESCE(p_invoice_number, '')), ''),
    p_payment_method,
    p_net_amount,          -- total_net = net_amount (fejléc-only bejegyzésnél nincs tételsor összeg)
    p_net_amount,
    p_vat_amount,
    p_gross_amount,
    p_performance_date,
    p_invoice_date,
    p_due_date
  )
  RETURNING id INTO v_purchase_id;

  RETURN v_purchase_id;
END;
$$;

-- ------------------------------------------------------------
-- 4. apply_purchase_line_items — idempotens tételsor csere meglévő purchase-hez
--
--    Garantálja, hogy ugyanaz a purchase NE növelje többször a készletet:
--      FÁZIS 1: Validáció (nem módosul semmi hiba esetén)
--      FÁZIS 2: Régi termék sorok készlet-visszavonása (current_stock -= régi qty)
--      FÁZIS 3: Régi tételsorok törlése (ON DELETE CASCADE nem lép fel — explicit DELETE)
--      FÁZIS 4: Új tételsorok beillesztése + készlet/ár frissítés
--      FÁZIS 5: purchases.total_net frissítése az új tételek összegére
--
--    NEM érinti a cash_transactions táblát.
--    Meghívható akárhányszor ugyanazokkal az adatokkal — a végeredmény azonos.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION apply_purchase_line_items(
  p_purchase_id UUID,
  p_items       JSONB   -- [{product_id?, quantity?, unit_id?, unit_price_net, description?}]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_item         JSONB;
  v_old_item     RECORD;   -- régi tételsor visszavonáshoz (SQL sor, nem JSONB)
  v_item_index   INTEGER := 0;
  v_is_product   BOOLEAN;
  v_product_id   UUID;
  v_quantity     NUMERIC(10,4);
  v_unit_id      UUID;
  v_unit_price   INTEGER;
  v_line_total   BIGINT;
  v_new_total    BIGINT := 0;
BEGIN

  -- Purchase létezésének ellenőrzése
  IF NOT EXISTS (SELECT 1 FROM purchases WHERE id = p_purchase_id) THEN
    RAISE EXCEPTION 'Purchase nem található: %', p_purchase_id;
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'p_items nem lehet üres — tételsor törléshez a purchase törlést használd';
  END IF;

  -- ==========================================================
  -- FÁZIS 1: Validáció — semmi nem változik hiba esetén
  -- ==========================================================

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_index := v_item_index + 1;
    v_is_product := (v_item->>'product_id') IS NOT NULL;

    IF v_is_product THEN
      IF (v_item->>'unit_id') IS NULL THEN
        RAISE EXCEPTION 'unit_id hiányzik a(z) %-. tételből', v_item_index;
      END IF;
      IF (v_item->>'quantity') IS NULL OR (v_item->>'quantity')::NUMERIC <= 0 THEN
        RAISE EXCEPTION 'quantity > 0 szükséges a(z) %-. tételnél', v_item_index;
      END IF;
      IF (v_item->>'unit_price_net') IS NULL OR (v_item->>'unit_price_net')::INTEGER <= 0 THEN
        RAISE EXCEPTION 'unit_price_net > 0 szükséges a(z) %-. tételnél', v_item_index;
      END IF;
    ELSE
      IF (v_item->>'description') IS NULL OR TRIM(v_item->>'description') = '' THEN
        RAISE EXCEPTION 'description kötelező a(z) %-. költség tételnél', v_item_index;
      END IF;
      IF (v_item->>'unit_price_net') IS NULL OR (v_item->>'unit_price_net')::INTEGER <= 0 THEN
        RAISE EXCEPTION 'unit_price_net > 0 szükséges a(z) %-. tételnél', v_item_index;
      END IF;
    END IF;
  END LOOP;

  -- ==========================================================
  -- FÁZIS 2: Régi termék sorok készlethatásának visszavonása
  --   Csak product_id NOT NULL sorokat érint — cost soroknak nincs készlethatásuk.
  --   Ha még nem volt tételsor (gyors rögzítés), ez a loop nem fut le → helyes.
  -- ==========================================================

  FOR v_old_item IN
    SELECT pli.product_id, pli.quantity
    FROM purchase_line_items pli
    WHERE pli.purchase_id = p_purchase_id
      AND pli.product_id IS NOT NULL
  LOOP
    UPDATE products
    SET
      current_stock = COALESCE(current_stock, 0) - v_old_item.quantity,
      updated_at    = NOW()
    WHERE id = v_old_item.product_id;
  END LOOP;

  -- ==========================================================
  -- FÁZIS 3: Régi tételsorok törlése
  -- ==========================================================

  DELETE FROM purchase_line_items WHERE purchase_id = p_purchase_id;

  -- ==========================================================
  -- FÁZIS 4: Új tételsorok beillesztése + készlet/ár frissítés
  -- ==========================================================

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_is_product := (v_item->>'product_id') IS NOT NULL;
    v_unit_price := (v_item->>'unit_price_net')::INTEGER;

    IF v_is_product THEN
      v_product_id := (v_item->>'product_id')::UUID;
      v_quantity   := (v_item->>'quantity')::NUMERIC(10,4);
      v_unit_id    := (v_item->>'unit_id')::UUID;
      v_line_total := ROUND(v_quantity * v_unit_price::BIGINT)::BIGINT;

      INSERT INTO purchase_line_items (
        purchase_id, product_id, quantity, unit_id, unit_price_net, line_total_net
      ) VALUES (p_purchase_id, v_product_id, v_quantity, v_unit_id, v_unit_price, v_line_total);

      UPDATE products
      SET
        current_stock      = COALESCE(current_stock, 0) + v_quantity,
        purchase_price_net = v_unit_price,
        updated_at         = NOW()
      WHERE id = v_product_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Termék nem található: %', v_product_id;
      END IF;

    ELSE
      -- Költség sor: nincs készlet/ár hatás
      v_line_total := v_unit_price::BIGINT;

      INSERT INTO purchase_line_items (
        purchase_id, product_id, quantity, unit_id, unit_price_net, line_total_net, description
      ) VALUES (
        p_purchase_id, NULL, 1, NULL, v_unit_price, v_line_total,
        TRIM(v_item->>'description')
      );
    END IF;

    v_new_total := v_new_total + v_line_total;
  END LOOP;

  -- ==========================================================
  -- FÁZIS 5: purchases.total_net frissítése az új tételek alapján
  --   net_amount (fejléc összeg) marad az eredeti — ez az "elvárt" összeg.
  --   total_net = tételekből számított — ez jelzi az eltérést ha különböznek.
  -- ==========================================================

  UPDATE purchases
  SET total_net = v_new_total
  WHERE id = p_purchase_id;

END;
$$;
