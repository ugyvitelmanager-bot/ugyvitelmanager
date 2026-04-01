-- Fix product units: add gr/ml units and assign correct unit to products

-- Step 1: Add missing units (gr, ml) if they don't exist yet
INSERT INTO units (symbol)
VALUES ('gr'), ('ml')
ON CONFLICT (symbol) DO NOTHING;

-- Step 2: Fix any products that got NULL unit_id from previous failed attempt
UPDATE products
SET unit_id = '9baa8633-c964-4f0e-89b0-ab3026018cc4'  -- db
WHERE unit_id IS NULL;

-- Step 3: Set unit to 'gr' for weight-based ingredients
UPDATE products
SET unit_id = (SELECT id FROM units WHERE symbol = 'gr' LIMIT 1)
WHERE name IN (
  'Baconszalonna szeletelt',
  'Barbecue Szósz Heinz',
  'Burger szósz Heinz',
  'Cheddar sajt reszelt',
  'Hagyma Chutney',
  'Hasábburgonya Julienne',
  'Ketchup Heinz',
  'Krémsajt',
  'Majonéz Heinz',
  'Mozzarella',
  'Mustár Heinz',
  'Paprikás szalámi Kaiser',
  'Sonka Prosciutto Crudo',
  'Tépett pulled pork sous vide',
  'Trappista sajt reszelt Ammerland',
  'Paradicsom friss',
  'Csemegeuborka',
  'Tejszínhab',
  'Kristálycukor'
);

-- Step 4: Set unit to 'ml' for liquid-based ingredients
UPDATE products
SET unit_id = (SELECT id FROM units WHERE symbol = 'ml' LIMIT 1)
WHERE name IN (
  'Fritőz sütőolaj Romi',
  'UHT tej 2,8%',
  'Olympos citromlé',
  'Soproni hordós',
  'Soproni Meggy hordós',
  'Finlandia vodka',
  'Fütyülős Csokis mogyorós',
  'Gordon''s Gin',
  'Jack Daniels',
  'Jagermeister',
  'Unicum Szilva'
);
