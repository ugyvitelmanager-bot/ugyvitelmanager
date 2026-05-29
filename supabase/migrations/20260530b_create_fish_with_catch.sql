-- Chipelt hal rögzítése az első fogással együtt, egyetlen tranzakcióban.
-- A catches trigger (catches_auto_approve) automatikusan approved=true-ra állítja,
-- mivel created_by='warden'.

CREATE OR REPLACE FUNCTION create_fish_with_catch(
  p_chip_id            TEXT,
  p_name               TEXT,
  p_type               TEXT,
  p_caught_at          DATE,
  p_weight_grams       INTEGER,
  p_station            TEXT,
  p_angler_first_name  TEXT,
  p_notes              TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_fish_id UUID;
BEGIN
  IF TRIM(p_chip_id) = '' THEN
    RAISE EXCEPTION 'chip_id nem lehet üres';
  END IF;
  IF TRIM(p_name) = '' THEN
    RAISE EXCEPTION 'name nem lehet üres';
  END IF;
  IF p_weight_grams <= 0 THEN
    RAISE EXCEPTION 'weight_grams > 0 szükséges (kapott: %)', p_weight_grams;
  END IF;

  INSERT INTO fish (chip_id, name, type, first_caught_at)
  VALUES (TRIM(p_chip_id), TRIM(p_name), p_type, p_caught_at)
  RETURNING id INTO v_fish_id;

  INSERT INTO catches (fish_id, caught_at, weight_grams, station, angler_first_name, notes, created_by)
  VALUES (
    v_fish_id,
    p_caught_at,
    p_weight_grams,
    TRIM(p_station),
    TRIM(p_angler_first_name),
    NULLIF(TRIM(COALESCE(p_notes, '')), ''),
    'warden'
  );

  RETURN v_fish_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_fish_with_catch TO authenticated;
