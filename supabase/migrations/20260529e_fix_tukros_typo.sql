-- Fix typo: 'tukros' → 'tükrös' in fish.type CHECK constraint
-- Also update any existing rows that have the old value

-- Update existing rows first (so the new constraint doesn't reject them)
UPDATE fish SET type = 'tükrös' WHERE type = 'tukros';

-- Drop old constraint
ALTER TABLE fish DROP CONSTRAINT fish_type_check;

-- Re-add with corrected spelling
ALTER TABLE fish ADD CONSTRAINT fish_type_check
  CHECK (type IN ('tükrös', 'tőponty', 'amur', 'busa', 'egyéb'));

-- Also fix the create_fish_with_catch RPC so it doesn't rely on implicit constraint check alone
-- (no change needed to the function — it passes p_type straight through, constraint enforces validity)
