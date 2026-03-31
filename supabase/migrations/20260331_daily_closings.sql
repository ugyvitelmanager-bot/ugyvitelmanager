-- ============================================================
-- Napi elszámolás / napi zárás táblák
-- FÜGGETLEN a meglévő daily_reports táblától (incomes modul)
-- ============================================================

-- Fő napi rekord (egy rekord per nap)
CREATE TABLE IF NOT EXISTS daily_closings (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  date                  DATE        UNIQUE NOT NULL,

  -- HALAS pénztárgép (AP A17710081) — adónem bontás, fillér
  halas_27              INTEGER     NOT NULL DEFAULT 0,
  halas_18              INTEGER     NOT NULL DEFAULT 0,
  halas_am              INTEGER     NOT NULL DEFAULT 0,

  -- HALAS fizetési mód bontás (PG szerint), fillér
  halas_pg_cash         INTEGER     NOT NULL DEFAULT 0,
  halas_pg_card         INTEGER     NOT NULL DEFAULT 0,

  -- HALAS terminál tényleges zárás, fillér
  halas_terminal_card   INTEGER     NOT NULL DEFAULT 0,

  -- BÜFÉ pénztárgép (AP A19202513) — adónem bontás, fillér
  bufe_27               INTEGER     NOT NULL DEFAULT 0,
  bufe_5                INTEGER     NOT NULL DEFAULT 0,
  bufe_am               INTEGER     NOT NULL DEFAULT 0,

  -- BÜFÉ fizetési mód bontás (PG szerint), fillér
  bufe_pg_cash          INTEGER     NOT NULL DEFAULT 0,
  bufe_pg_card          INTEGER     NOT NULL DEFAULT 0,

  -- BÜFÉ terminál tényleges zárás, fillér
  bufe_terminal_card    INTEGER     NOT NULL DEFAULT 0,

  -- Tagi kölcsön (ha volt aznap bevitel), fillér
  member_loan           INTEGER     NOT NULL DEFAULT 0,
  member_loan_note      TEXT,

  -- Házipénztár mozgás (pozitív = betett, negatív = kivett), fillér
  petty_cash_movement   INTEGER     NOT NULL DEFAULT 0,
  petty_cash_note       TEXT,

  -- Meta
  notes                 TEXT,
  status                TEXT        NOT NULL DEFAULT 'draft'
                                    CHECK (status IN ('draft', 'final')),
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_closings_date
  ON daily_closings (date);

-- Egyéb napi kiadás tételek (1:N a daily_closings-hoz)
CREATE TABLE IF NOT EXISTS daily_closing_expenses (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  daily_closing_id      UUID        NOT NULL
                                    REFERENCES daily_closings(id)
                                    ON DELETE CASCADE,
  amount                INTEGER     NOT NULL,         -- fillér
  note                  TEXT        NOT NULL DEFAULT '',
  sort_order            SMALLINT    NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_daily_closing_expenses_closing
  ON daily_closing_expenses (daily_closing_id);

-- RLS
ALTER TABLE daily_closings          ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closing_expenses  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage daily_closings"
  ON daily_closings FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage daily_closing_expenses"
  ON daily_closing_expenses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
