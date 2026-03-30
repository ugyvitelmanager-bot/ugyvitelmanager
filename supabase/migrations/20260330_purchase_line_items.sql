-- ============================================================
-- Migration: purchase_line_items tábla + record_purchase_core RPC
-- Dátum: 2026-03-30
-- Kontextus: Az MVP purchases (4b) táblához tartozó tételsor tábla.
--   A meglévő purchase_items tábla a purchase_headers architektúrára
--   mutat (Phase 2). Ez az MVP változat a purchases.id-t használja FK-ként.
-- Futtatás: Supabase SQL Editor → egyszer futtatni, idempotens (IF NOT EXISTS)
-- ============================================================

-- ------------------------------------------------------------
-- 1. purchase_line_items tábla
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS purchase_line_items (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id      UUID    NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id       UUID    NOT NULL REFERENCES products(id)  ON DELETE RESTRICT,
  quantity         NUMERIC(10,4) NOT NULL,
  unit_id          UUID    NOT NULL REFERENCES units(id)     ON DELETE RESTRICT,
  unit_price_net   INTEGER NOT NULL,   -- fillér; illeszkedik products.purchase_price_net INTEGER
  line_total_net   BIGINT  NOT NULL,   -- fillér; illeszkedik purchases.total_net BIGINT
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. Indexek
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_purchase_line_items_purchase_id
  ON purchase_line_items (purchase_id);

CREATE INDEX IF NOT EXISTS idx_purchase_line_items_product_id
  ON purchase_line_items (product_id);

-- ------------------------------------------------------------
-- 3. RLS
-- ------------------------------------------------------------

ALTER TABLE purchase_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all"
  ON purchase_line_items FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can write"
  ON purchase_line_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------
-- 4. record_purchase_core RPC
--
-- Atomikusan kezeli:
--   S1: INSERT purchases (fej)
--   S2: INSERT purchase_line_items (tételek)
--   S3+S4: UPDATE products (current_stock + purchase_price_net egyszerre)
--
-- Visszaad: purchases.id UUID — a TS oldal cash_transactions purchase_id FK-hoz használja
-- SECURITY INVOKER: RLS szabályok érvényesek maradnak a hívó jogosultságával
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_purchase_core(
  p_date            DATE,
  p_supplier_name   TEXT,
  p_invoice_number  TEXT,       -- nullable; üres string → NULL
  p_payment_method  TEXT,
  p_total_net       BIGINT,     -- fillérben; a TS oldal végzi a konverziót
  p_items           JSONB       -- [{product_id, quantity, unit_id, unit_price_net}]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_purchase_id     UUID;
  v_item            JSONB;
  v_product_id      UUID;
  v_quantity        NUMERIC(10,4);
  v_unit_id         UUID;
  v_unit_price_net  INTEGER;      -- fillér egységár; INTEGER (max ~21M HUF/egység)
  v_line_total      BIGINT;       -- fillér sor-összeg; BIGINT
  v_computed_total  BIGINT := 0;
  v_item_index      INTEGER := 0;
BEGIN

  -- ==========================================================
  -- FÁZIS 1: Validáció — egyetlen INSERT sem fut le hibás adat esetén
  -- ==========================================================

  IF p_supplier_name IS NULL OR TRIM(p_supplier_name) = '' THEN
    RAISE EXCEPTION 'supplier_name nem lehet üres';
  END IF;

  IF p_payment_method NOT IN ('cash_daily', 'cash_petty', 'bank_transfer', 'member_loan_cash') THEN
    RAISE EXCEPTION
      'Érvénytelen payment_method: "%". Elfogadott értékek: cash_daily, cash_petty, bank_transfer, member_loan_cash',
      p_payment_method;
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'p_items nem lehet NULL vagy üres tömb';
  END IF;

  -- Tételenkénti validáció + computed total felhalmozás (első pass — INSERT nélkül)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_index := v_item_index + 1;

    IF (v_item->>'product_id') IS NULL THEN
      RAISE EXCEPTION 'product_id hiányzik a(z) %-. tételből', v_item_index;
    END IF;

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

    -- Explicit cast: NUMERIC(10,4) × BIGINT → ROUND → BIGINT
    v_computed_total := v_computed_total
      + ROUND(
          (v_item->>'quantity')::NUMERIC(10,4)
          * (v_item->>'unit_price_net')::BIGINT
        )::BIGINT;
  END LOOP;

  -- Végösszeg ellenőrzés: paraméter vs tételekből számított
  IF v_computed_total != p_total_net THEN
    RAISE EXCEPTION
      'Végösszeg eltérés: paraméter = % fillér, tételekből számított = % fillér. Ellenőrizd a tételeket.',
      p_total_net, v_computed_total;
  END IF;

  -- ==========================================================
  -- FÁZIS 2: Adatbázis műveletek — implicit PostgreSQL tranzakcióban
  -- Bármely hiba az összes előző INSERT-et visszagörgeti.
  -- ==========================================================

  -- S1: purchases header
  INSERT INTO purchases (
    date,
    supplier_name,
    invoice_number,
    payment_method,
    total_net
  )
  VALUES (
    p_date,
    TRIM(p_supplier_name),
    NULLIF(TRIM(COALESCE(p_invoice_number, '')), ''),
    p_payment_method,
    p_total_net
  )
  RETURNING id INTO v_purchase_id;

  -- S2–S4: Tételek feldolgozása (második pass — DB műveletek)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id     := (v_item->>'product_id')::UUID;
    v_quantity       := (v_item->>'quantity')::NUMERIC(10,4);
    v_unit_id        := (v_item->>'unit_id')::UUID;
    v_unit_price_net := (v_item->>'unit_price_net')::INTEGER;

    -- Explicit cast: NUMERIC(10,4) × BIGINT → ROUND → BIGINT
    v_line_total := ROUND(
      v_quantity * v_unit_price_net::BIGINT
    )::BIGINT;

    -- S2: purchase_line_items insert
    INSERT INTO purchase_line_items (
      purchase_id,
      product_id,
      quantity,
      unit_id,
      unit_price_net,
      line_total_net
    )
    VALUES (
      v_purchase_id,
      v_product_id,
      v_quantity,
      v_unit_id,
      v_unit_price_net,
      v_line_total
    );

    -- S3 + S4: Atomikus készlet + ár frissítés — egyetlen UPDATE
    -- Nincs race condition: PostgreSQL row-level lock a WHERE id = feltételnél
    UPDATE products
    SET
      current_stock      = COALESCE(current_stock, 0) + v_quantity,
      purchase_price_net = v_unit_price_net,           -- INTEGER → INTEGER, nincs cast
      updated_at         = NOW()
    WHERE id = v_product_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Termék nem található az adatbázisban: %', v_product_id;
    END IF;

  END LOOP;

  RETURN v_purchase_id;

END;
$$;
