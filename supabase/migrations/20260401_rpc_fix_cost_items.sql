-- ============================================================
-- Migration: record_purchase_core RPC javítás + cost item support
-- Dátum: 2026-04-01
-- Kontextus: Phase 2 purchases refactor
--   - payment_method: 'cash' | 'bank_transfer' (régi: cash_daily, cash_petty, member_loan_cash)
--   - cost sorok: product_id + unit_id nullable, description mező
--   - termék sorok: változatlan logika (készlet + ár frissítés)
-- Futtatás: Supabase SQL Editor → idempotens, biztonságos újrafuttatásra
-- ============================================================

-- ------------------------------------------------------------
-- 1. purchase_line_items séma frissítés (idempotens)
-- ------------------------------------------------------------

-- Nullable product_id (cost soroknál NULL)
ALTER TABLE purchase_line_items ALTER COLUMN product_id DROP NOT NULL;

-- Nullable unit_id (cost soroknál NULL)
ALTER TABLE purchase_line_items ALTER COLUMN unit_id DROP NOT NULL;

-- description mező cost sorokhoz
ALTER TABLE purchase_line_items ADD COLUMN IF NOT EXISTS description TEXT;

-- ------------------------------------------------------------
-- 2. record_purchase_core RPC — teljes csere
--
-- Változások az eredeti verzióhoz képest:
--   - payment_method: 'cash' | 'bank_transfer' (nem cash_daily/petty stb.)
--   - v_is_product flag: product_id IS NOT NULL → termék sor, egyébként cost sor
--   - Termék sorok: product_id, unit_id, quantity, unit_price_net validáció + készlet/ár frissítés
--   - Cost sorok: description + unit_price_net validáció; nincs készlet/ár frissítés
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION record_purchase_core(
  p_date            DATE,
  p_supplier_name   TEXT,
  p_invoice_number  TEXT,       -- nullable; üres string → NULL
  p_payment_method  TEXT,
  p_total_net       BIGINT,     -- fillérben
  p_items           JSONB       -- [{product_id?, quantity?, unit_id?, unit_price_net, description?}]
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

  -- ==========================================================
  -- FÁZIS 1: Validáció — egyetlen INSERT sem fut le hibás adat esetén
  -- ==========================================================

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
      -- Termék sor validáció
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
      -- Költség sor validáció
      IF (v_item->>'description') IS NULL OR TRIM(v_item->>'description') = '' THEN
        RAISE EXCEPTION 'description megadása kötelező a(z) %-. költség tételnél', v_item_index;
      END IF;

      IF (v_item->>'unit_price_net') IS NULL OR (v_item->>'unit_price_net')::INTEGER <= 0 THEN
        RAISE EXCEPTION 'unit_price_net > 0 szükséges a(z) %-. tételnél (kapott: %)',
          v_item_index, COALESCE(v_item->>'unit_price_net', 'NULL');
      END IF;
    END IF;

    -- Computed total: termék soroknál qty × ár, cost soroknál quantity=1
    v_computed_total := v_computed_total
      + ROUND(
          COALESCE((v_item->>'quantity')::NUMERIC(10,4), 1)
          * (v_item->>'unit_price_net')::BIGINT
        )::BIGINT;
  END LOOP;

  IF v_computed_total != p_total_net THEN
    RAISE EXCEPTION
      'Végösszeg eltérés: paraméter = % fillér, tételekből számított = % fillér. Ellenőrizd a tételeket.',
      p_total_net, v_computed_total;
  END IF;

  -- ==========================================================
  -- FÁZIS 2: DB műveletek — implicit PostgreSQL tranzakcióban
  -- ==========================================================

  INSERT INTO purchases (date, supplier_name, invoice_number, payment_method, total_net)
  VALUES (
    p_date,
    TRIM(p_supplier_name),
    NULLIF(TRIM(COALESCE(p_invoice_number, '')), ''),
    p_payment_method,
    p_total_net
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
        purchase_id, product_id, quantity, unit_id,
        unit_price_net, line_total_net
      )
      VALUES (v_purchase_id, v_product_id, v_quantity, v_unit_id, v_unit_price_net, v_line_total);

      -- Atomikus készlet + ár frissítés
      UPDATE products
      SET
        current_stock      = COALESCE(current_stock, 0) + v_quantity,
        purchase_price_net = v_unit_price_net,
        updated_at         = NOW()
      WHERE id = v_product_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Termék nem található az adatbázisban: %', v_product_id;
      END IF;

    ELSE
      -- Költség sor: nincs termék, nincs készletfrissítés
      v_line_total := v_unit_price_net::BIGINT; -- quantity = 1

      INSERT INTO purchase_line_items (
        purchase_id, product_id, quantity, unit_id,
        unit_price_net, line_total_net, description
      )
      VALUES (
        v_purchase_id,
        NULL,
        1,
        NULL,
        v_unit_price_net,
        v_line_total,
        TRIM(v_item->>'description')
      );
    END IF;

  END LOOP;

  RETURN v_purchase_id;

END;
$$;
