-- Új ÁFA bontás mezők: mindkét PG egységes 5/18/27/AAM struktúrával
ALTER TABLE daily_closings
  ADD COLUMN IF NOT EXISTS halas_5   bigint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bufe_18   bigint NOT NULL DEFAULT 0;
