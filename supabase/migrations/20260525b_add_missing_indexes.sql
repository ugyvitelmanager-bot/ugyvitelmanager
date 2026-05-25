-- Hiányzó indexek a leggyakrabban szűrt oszlopokra.
-- Minden index idempotens (IF NOT EXISTS).

-- purchases.date: gte/lte szűrők mindenhol (bevétel riport, daily actions, dashboard)
CREATE INDEX IF NOT EXISTS idx_purchases_date
  ON purchases (date);

-- purchases.payment_method: .in() szűrők a KP mozgás számításokban
CREATE INDEX IF NOT EXISTS idx_purchases_payment_method
  ON purchases (payment_method);

-- purchases.is_settled: nyitott számlák lekérdezése
CREATE INDEX IF NOT EXISTS idx_purchases_is_settled
  ON purchases (is_settled);

-- cash_transactions.date: rendszeres dátum szűrők a pénztár modulban
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date
  ON cash_transactions (date);
