-- record_purchase_core: p_invoice_number legyen DEFAULT NULL
-- Így a supabase gen types automatikusan "string | null"-t generál.
-- A függvénytörzs változatlan — COALESCE(p_invoice_number, '') már kezeli a NULL-t.
-- p_invoice_number a lista végére kerül (PostgreSQL: DEFAULT-os param után nem jöhet nem-DEFAULT-os).
-- A régi overload (p_invoice_number 3. pozícióban) törlendő, hogy ne legyen ambiguitás.

DROP FUNCTION IF EXISTS record_purchase_core(date, text, text, text, bigint, jsonb);

CREATE OR REPLACE FUNCTION record_purchase_core(
  p_date            DATE,
  p_supplier_name   TEXT,
  p_payment_method  TEXT,
  p_total_net       BIGINT,
  p_items           JSONB,
  p_invoice_number  TEXT DEFAULT NULL
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

  IF p_payment_method NOT IN ('cash', 'bank_transfer', 'card') THEN
    RAISE EXCEPTION
      'Érvénytelen payment_method: "%". Elfogadott értékek: cash, bank_transfer, card',
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

  INSERT INTO purchases (date, supplier_name, invoice_number, payment_method, total_net, net_amount)
  VALUES (
    p_date,
    TRIM(p_supplier_name),
    NULLIF(TRIM(COALESCE(p_invoice_number, '')), ''),
    p_payment_method,
    p_total_net,
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
