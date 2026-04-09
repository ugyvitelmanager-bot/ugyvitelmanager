-- ============================================================
-- Migration: Beszerzés fejlesztések
-- Dátum: 2026-04-09
-- 1. is_settled mező — kiegyenlített jelölés
-- 2. record_purchase_header: negatív összeg engedélyezés (helyesbítő számlákhoz)
-- ============================================================

-- 1. is_settled mező
ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS is_settled BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. record_purchase_header — negatív összeg engedélyezése helyesbítő számlákhoz
--    Változás: p_net_amount / p_gross_amount ellenőrzés: > 0 → != 0 (NULL és 0 tiltott)
CREATE OR REPLACE FUNCTION record_purchase_header(
  p_date             DATE,
  p_supplier_name    TEXT,
  p_invoice_number   TEXT,
  p_payment_method   TEXT,
  p_net_amount       BIGINT,
  p_vat_amount       BIGINT,
  p_gross_amount     BIGINT,
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

  IF p_payment_method NOT IN ('cash', 'bank_transfer', 'card') THEN
    RAISE EXCEPTION
      'Érvénytelen payment_method: "%". Elfogadott értékek: cash, bank_transfer, card',
      p_payment_method;
  END IF;

  IF p_net_amount IS NULL OR p_net_amount = 0 THEN
    RAISE EXCEPTION 'net_amount nem lehet NULL vagy nulla (kapott: %)', COALESCE(p_net_amount::TEXT, 'NULL');
  END IF;

  IF p_gross_amount IS NULL OR p_gross_amount = 0 THEN
    RAISE EXCEPTION 'gross_amount nem lehet NULL vagy nulla (kapott: %)', COALESCE(p_gross_amount::TEXT, 'NULL');
  END IF;

  INSERT INTO purchases (
    date, supplier_name, invoice_number, payment_method,
    total_net, net_amount, vat_amount, gross_amount,
    performance_date, invoice_date, due_date
  ) VALUES (
    p_date,
    TRIM(p_supplier_name),
    NULLIF(TRIM(COALESCE(p_invoice_number, '')), ''),
    p_payment_method,
    p_net_amount,
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
