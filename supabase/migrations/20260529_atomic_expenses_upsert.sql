-- replace_daily_closing_expenses: atomikus kiadás-csere
-- DELETE + INSERT egy implicit PostgreSQL tranzakcióban fut.
-- Ha az INSERT meghiúsul, a DELETE is visszagörög — nem maradnak
-- félkész állapotban a kiadás sorok hálózati hiba esetén sem.

CREATE OR REPLACE FUNCTION replace_daily_closing_expenses(
  p_closing_id UUID,
  p_expenses   JSONB  -- [{amount: integer, note: text, sort_order: integer}]
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  DELETE FROM daily_closing_expenses
  WHERE daily_closing_id = p_closing_id;

  INSERT INTO daily_closing_expenses (daily_closing_id, amount, note, sort_order)
  SELECT
    p_closing_id,
    (item->>'amount')::INTEGER,
    COALESCE(item->>'note', ''),
    (item->>'sort_order')::SMALLINT
  FROM jsonb_array_elements(p_expenses) AS item;
END;
$$;
