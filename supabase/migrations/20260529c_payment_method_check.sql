-- ============================================================
-- Migration: purchases.payment_method CHECK constraint
-- Dátum: 2026-05-29
-- Kontextus:
--   A purchases.payment_method eddig TEXT volt constraint nélkül,
--   így érvénytelen értékek kerülhetek be közvetlen DB íráskor (RLS megkerülése esetén).
--   Az RPCs-ek már validálják az értéket, ez a constraint DB-szintű biztosíték.
--
-- Értékek forrása (codebase + RPC validációk átvizsgálva):
--   'cash'          — készpénz (penztar/page.tsx, daily/lib/labels.ts)
--   'bank_transfer' — banki átutalás (penztar/page.tsx)
--   'card'          — bankkártya (20260409_add_card_payment.sql)
--
-- Futtatás: Supabase SQL Editor — idempotens (DROP IF EXISTS + ADD)
-- ============================================================

ALTER TABLE purchases
  DROP CONSTRAINT IF EXISTS purchases_payment_method_check;

ALTER TABLE purchases
  ADD CONSTRAINT purchases_payment_method_check
  CHECK (payment_method IN ('cash', 'bank_transfer', 'card'));
