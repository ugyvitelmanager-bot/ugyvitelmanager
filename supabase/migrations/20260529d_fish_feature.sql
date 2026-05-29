-- ============================================================
-- Migration: Chipelt halak nyilvántartása (CarpLove)
-- Táblák: fish, catches, catch_images
-- RLS: anon → csak jóváhagyott fogások; authenticated → teljes CRUD
-- Trigger: warden fogások automatikusan approved=true
-- ============================================================

-- -------------------------------------------------------
-- fish
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS fish (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  chip_id         TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  type            TEXT        NOT NULL CHECK (type IN ('tukros', 'tőponty', 'amur', 'busa', 'egyéb')),
  first_caught_at DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- catches
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS catches (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  fish_id           UUID        NOT NULL REFERENCES fish (id) ON DELETE CASCADE,
  caught_at         DATE        NOT NULL,
  weight_grams      INTEGER     NOT NULL CHECK (weight_grams > 0),
  station           TEXT        NOT NULL,
  angler_first_name TEXT        NOT NULL,
  notes             TEXT,
  created_by        TEXT        NOT NULL CHECK (created_by IN ('warden', 'angler')),
  approved          BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- catch_images
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS catch_images (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  catch_id    UUID        NOT NULL REFERENCES catches (id) ON DELETE CASCADE,
  image_url   TEXT        NOT NULL,
  uploaded_by TEXT        NOT NULL CHECK (uploaded_by IN ('warden', 'angler')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -------------------------------------------------------
-- Indexek
-- -------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_catches_fish_id   ON catches (fish_id);
CREATE INDEX IF NOT EXISTS idx_catches_caught_at  ON catches (caught_at);
CREATE INDEX IF NOT EXISTS idx_catches_approved   ON catches (approved);

-- -------------------------------------------------------
-- updated_at trigger — fish tábla
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION fish_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS fish_updated_at ON fish;
CREATE TRIGGER fish_updated_at
  BEFORE UPDATE ON fish
  FOR EACH ROW EXECUTE FUNCTION fish_set_updated_at();

-- -------------------------------------------------------
-- Auto-approve trigger — warden fogások azonnal jóváhagyottak
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION catches_auto_approve()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.approved := (NEW.created_by = 'warden');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS catches_set_approved ON catches;
CREATE TRIGGER catches_set_approved
  BEFORE INSERT ON catches
  FOR EACH ROW EXECUTE FUNCTION catches_auto_approve();

-- -------------------------------------------------------
-- RLS engedélyezés
-- -------------------------------------------------------
ALTER TABLE fish         ENABLE ROW LEVEL SECURITY;
ALTER TABLE catches      ENABLE ROW LEVEL SECURITY;
ALTER TABLE catch_images ENABLE ROW LEVEL SECURITY;

-- fish: mindenki olvashatja; authenticated írhat/módosíthat
CREATE POLICY fish_select_all  ON fish FOR SELECT USING (true);
CREATE POLICY fish_insert_auth ON fish FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY fish_update_auth ON fish FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- catches: anon csak approved=true; authenticated mindent lát
CREATE POLICY catches_select_anon ON catches
  FOR SELECT TO anon
  USING (approved = true);

CREATE POLICY catches_select_auth ON catches
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY catches_insert_auth ON catches
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY catches_update_auth ON catches
  FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

-- catch_images: anon csak jóváhagyott fogáshoz tartozó képek
CREATE POLICY catch_images_select_anon ON catch_images
  FOR SELECT TO anon
  USING (
    EXISTS (
      SELECT 1 FROM catches c
      WHERE c.id = catch_images.catch_id AND c.approved = true
    )
  );

CREATE POLICY catch_images_select_auth ON catch_images
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY catch_images_insert_auth ON catch_images
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY catch_images_delete_auth ON catch_images
  FOR DELETE TO authenticated
  USING (true);

-- -------------------------------------------------------
-- GRANT (Supabase 2026-05-30 követelmény)
-- -------------------------------------------------------
GRANT SELECT             ON fish         TO anon, authenticated;
GRANT INSERT, UPDATE     ON fish         TO authenticated;

GRANT SELECT             ON catches      TO anon, authenticated;
GRANT INSERT, UPDATE     ON catches      TO authenticated;

GRANT SELECT             ON catch_images TO anon, authenticated;
GRANT INSERT, DELETE     ON catch_images TO authenticated;
