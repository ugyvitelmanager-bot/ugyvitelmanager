-- Házipénztár záróállás mentése napi záráshoz
-- Lehetővé teszi az O(1) egyenleg-lekérdezést az O(N) lánc-számítás helyett.
-- Egység: fillér (1 Ft = 100 fillér), összhangban a többi monetáris oszloppal.
-- NULL: régi rekordok, ahol még nem volt kiszámolva.

ALTER TABLE daily_closings
  ADD COLUMN IF NOT EXISTS expected_cash_closing BIGINT;

COMMENT ON COLUMN daily_closings.expected_cash_closing IS
  'Várható KP záróállás mentve záráskor (fillér). NULL = régi adat, chain-számítás szükséges.';
