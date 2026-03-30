-- ============================================================
-- ÜGYVITEL MANAGER – Supabase Schema
-- ============================================================
-- Ezt a fájlt másold be a Supabase SQL Editor-ba és futtasd le.
-- ============================================================

-- Enum típusok
CREATE TYPE product_type AS ENUM (
  'ingredient',
  'recipe_product',
  'stock_product',
  'service',
  'service_with_serial',
  'non_stock_sale'
);

CREATE TYPE source_type AS ENUM (
  'cash_register',
  'terminal',
  'invoice',
  'manual'
);

CREATE TYPE business_area AS ENUM (
  'buffet',
  'fish',
  'event',
  'other'
);

CREATE TYPE movement_type AS ENUM (
  'purchase',
  'sale_recipe',
  'sale_stock',
  'inventory_adjustment',
  'manual',
  'waste',
  'other'
);

CREATE TYPE recipe_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE event_status AS ENUM ('draft', 'quote_sent', 'accepted', 'completed', 'closed', 'cancelled');
CREATE TYPE inventory_status AS ENUM ('draft', 'finalized');
CREATE TYPE category_type AS ENUM ('product', 'sale', 'purchase', 'event');
CREATE TYPE location_type AS ENUM ('buffet', 'shop', 'warehouse', 'other');

-- ============================================================
-- 1. TÖRZSADATOK
-- ============================================================

-- ÁFA kulcsok
CREATE TABLE vat_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,               -- pl. 'AAM', '5%', '27%'
  rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_exempt BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Kategóriák (hierarchikus)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category_type category_type NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  business_area business_area NOT NULL DEFAULT 'other',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mértékegységek
CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,               -- pl. 'kilogramm', 'darab'
  symbol TEXT NOT NULL,             -- pl. 'kg', 'db', 'l'
  precision INTEGER NOT NULL DEFAULT 0,  -- tizedes jegyek száma
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bevételi források
CREATE TABLE sales_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,               -- pl. 'Büfé pénztárgép', 'Halas terminál'
  source_type source_type NOT NULL,
  business_area business_area NOT NULL DEFAULT 'other',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Beszállítók
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_number TEXT,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tárolóhelyek
CREATE TABLE storage_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_type location_type NOT NULL DEFAULT 'other',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. TERMÉKEK
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sku TEXT,
  product_type product_type NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE RESTRICT,
  default_vat_rate_id UUID REFERENCES vat_rates(id) ON DELETE RESTRICT,
  is_stock_tracked BOOLEAN NOT NULL DEFAULT FALSE,
  has_serial_tracking BOOLEAN NOT NULL DEFAULT FALSE,
  default_storage_location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
  packaging_description TEXT,
  -- Árak (nettó fillérben tárolva a pontosság érdekében)
  purchase_price_net INTEGER,           -- legutóbbi beszerzési nettó ár (fillér)
  calculated_unit_cost_net INTEGER,     -- recept alapján számolt önköltség (fillér)
  default_sale_price_net INTEGER,       -- javasolt nettó eladási ár (fillér)
  default_sale_price_gross INTEGER,     -- javasolt bruttó eladási ár (fillér)
  note TEXT,
  is_mohu_fee BOOLEAN DEFAULT FALSE,
  current_stock NUMERIC DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. RECEPTEK
-- ============================================================

CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  vat_rate_id UUID REFERENCES vat_rates(id) ON DELETE RESTRICT,
  target_margin_percent NUMERIC(5,2),
  status recipe_status NOT NULL DEFAULT 'draft',
  version_number INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE recipe_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(10,4) NOT NULL,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  unit_cost_net_snapshot INTEGER NOT NULL DEFAULT 0,  -- fillér, rögzítéskori ár
  line_cost_net INTEGER NOT NULL DEFAULT 0,           -- fillér, kalkulált összeg
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 4. BESZERZÉSEK
-- ============================================================

CREATE TABLE purchase_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_date DATE NOT NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE RESTRICT,
  invoice_number TEXT,
  storage_location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
  note TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_header_id UUID NOT NULL REFERENCES purchase_headers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity NUMERIC(10,4) NOT NULL,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  unit_price_net INTEGER NOT NULL,       -- fillér
  vat_rate_id UUID NOT NULL REFERENCES vat_rates(id) ON DELETE RESTRICT,
  line_net_amount INTEGER NOT NULL,      -- fillér
  line_gross_amount INTEGER NOT NULL,    -- fillér
  is_stock_affecting BOOLEAN NOT NULL DEFAULT TRUE
);

-- ============================================================
-- 4b. EGYSZERŰSÍTETT BESZERZÉS (MVP tábla)
-- Megjegyzés: párhuzamosan létezik a purchase_headers/purchase_items
-- párral. A kód jelenleg ezt használja. Phase 2-ben konsolidálandó.
-- ============================================================

CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  invoice_number TEXT,
  supplier_name TEXT NOT NULL,
  total_net BIGINT DEFAULT 0,
  payment_method TEXT NOT NULL,
  note TEXT
);

-- ============================================================
-- 4c. PÉNZTÁR TRANZAKCIÓK
-- Megjegyzés: amount BIGINT (fillér), de eltér a többi pénzügyi
-- mező INTEGER típusától. Ismert inkonzisztencia, Phase 2-ben javítható.
-- ============================================================

CREATE TABLE cash_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  amount BIGINT NOT NULL,
  type TEXT NOT NULL,
  source TEXT NOT NULL,
  note TEXT,
  purchase_id UUID
);

-- ============================================================
-- 4d. NAPI RIPORTOK (Z-riport adatok)
-- Megjegyzés: business_area itt TEXT, nem business_area enum.
-- Ismert inkonzisztencia a categories.business_area enum-mal képest.
-- ============================================================

CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  date DATE NOT NULL,
  business_area TEXT NOT NULL,
  z_total_gross BIGINT DEFAULT 0,
  terminal_total_gross BIGINT DEFAULT 0,
  cash_total_gross BIGINT DEFAULT 0,
  vat_5_gross BIGINT DEFAULT 0,
  vat_27_gross BIGINT DEFAULT 0,
  vat_0_gross BIGINT DEFAULT 0,
  note TEXT
);

-- ============================================================
-- 5. BEVÉTELEK
-- ============================================================

CREATE TABLE sales_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_date DATE NOT NULL,               -- a tényleges bevétel dátuma
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),  -- mikor rögzítettük
  source_id UUID NOT NULL REFERENCES sales_sources(id) ON DELETE RESTRICT,
  source_type source_type NOT NULL,      -- denormalizálva a gyors riporthoz
  vat_rate_id UUID NOT NULL REFERENCES vat_rates(id) ON DELETE RESTRICT,
  gross_amount INTEGER NOT NULL,         -- bruttó összeg fillérben
  net_amount INTEGER NOT NULL,           -- nettó összeg fillérben
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  entry_type TEXT,                       -- pl. 'daily_close', 'weekly_close', 'manual'
  reference_type TEXT,                   -- pl. 'event'
  reference_id UUID,                     -- kapcsolt rekord id-ja
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. HORGÁSZJEGY KONTROLL (sorszámozott, szigorú számadású)
-- ============================================================

CREATE TABLE serial_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  document_type TEXT NOT NULL DEFAULT 'fishing_permit',
  series_prefix TEXT,
  range_start INTEGER NOT NULL,
  range_end INTEGER NOT NULL,
  issued_count INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE serial_document_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_document_id UUID NOT NULL REFERENCES serial_documents(id) ON DELETE RESTRICT,
  sale_date DATE NOT NULL,
  source_id UUID REFERENCES sales_sources(id) ON DELETE SET NULL,
  used_from INTEGER NOT NULL,
  used_to INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  note TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. KÉSZLETMOZGÁSOK (event-sourcing elvű)
-- ============================================================

CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  storage_location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
  movement_type movement_type NOT NULL,
  quantity_change NUMERIC(10,4) NOT NULL,  -- pozitív = be, negatív = ki
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  reference_type TEXT,                     -- pl. 'purchase', 'inventory_count'
  reference_id UUID,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. LELTÁR
-- ============================================================

CREATE TABLE inventory_counts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  count_date DATE NOT NULL,
  storage_location_id UUID REFERENCES storage_locations(id) ON DELETE SET NULL,
  count_type TEXT NOT NULL DEFAULT 'full',  -- 'full', 'partial', 'spot'
  status inventory_status NOT NULL DEFAULT 'draft',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE inventory_count_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  system_quantity NUMERIC(10,4) NOT NULL DEFAULT 0,   -- rendszer szerinti
  counted_quantity NUMERIC(10,4) NOT NULL DEFAULT 0,  -- ténylegesen megszámlált
  difference_quantity NUMERIC(10,4),
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  note TEXT
);

-- ============================================================
-- 9. RENDEZVÉNYEK / AJÁNLATOK
-- ============================================================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_date DATE,
  status event_status NOT NULL DEFAULT 'draft',
  customer_name TEXT,
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE event_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                    -- szabad szöveges tétel név
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,  -- opcionális
  quantity NUMERIC(10,4) NOT NULL,
  unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
  unit_cost_net INTEGER NOT NULL DEFAULT 0,   -- fillér
  unit_sale_net INTEGER NOT NULL DEFAULT 0,   -- fillér
  vat_rate_id UUID NOT NULL REFERENCES vat_rates(id) ON DELETE RESTRICT,
  line_net_amount INTEGER NOT NULL DEFAULT 0,   -- fillér
  line_gross_amount INTEGER NOT NULL DEFAULT 0, -- fillér
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- 10. FELHASZNÁLÓK / PROFIL
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',   -- 'admin', 'user'
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Profil automatikus létrehozás bejelentkezéskor
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 11. UPDATED_AT TRIGGER (automatikus frissítés)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER recipes_updated_at BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 12. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE vat_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE serial_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE serial_document_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Minden bejelentkezett felhasználó olvashat (később finomítható role alapon)
CREATE POLICY "Authenticated users can read all" ON vat_rates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON units FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON sales_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON suppliers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON storage_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON recipes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON recipe_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON purchase_headers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON purchase_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON sales_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON serial_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON serial_document_usages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON stock_movements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON inventory_counts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON inventory_count_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON event_items FOR SELECT TO authenticated USING (true);

-- Írási jogok (INSERT / UPDATE / DELETE) – csak bejelentkezett felhasználók
CREATE POLICY "Authenticated users can write" ON vat_rates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON units FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON sales_sources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON suppliers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON storage_locations FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON recipes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON recipe_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON purchase_headers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON purchase_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON sales_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON serial_documents FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON serial_document_usages FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON stock_movements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON inventory_counts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON inventory_count_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON events FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON event_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Három új tábla (MVP)
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read all" ON purchases FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON cash_transactions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read all" ON daily_reports FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can write" ON purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON cash_transactions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can write" ON daily_reports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Profil: csak a saját profilt láthatja/szerkesztheti
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- ============================================================
-- 13. SEED ADATOK (alapértelmezett törzsadatok)
-- ============================================================

INSERT INTO vat_rates (name, rate_percent, is_exempt) VALUES
  ('AAM', 0, TRUE),
  ('5%', 5, FALSE),
  ('27%', 27, FALSE);

INSERT INTO units (name, symbol, precision) VALUES
  ('darab', 'db', 0),
  ('kilogramm', 'kg', 3),
  ('liter', 'l', 3),
  ('csomag', 'cs', 0),
  ('adag', 'adag', 0);

INSERT INTO sales_sources (name, source_type, business_area) VALUES
  ('Büfé pénztárgép', 'cash_register', 'buffet'),
  ('Büfé terminál', 'terminal', 'buffet'),
  ('Halas pénztárgép', 'cash_register', 'fish'),
  ('Halas terminál', 'terminal', 'fish'),
  ('Rendezvény számla', 'invoice', 'event'),
  ('Egyéb kézi bevétel', 'manual', 'other');

INSERT INTO storage_locations (name, location_type) VALUES
  ('Büfé raktár', 'buffet'),
  ('Bolt (horgász)', 'shop'),
  ('Egyéb raktár', 'warehouse');

INSERT INTO categories (name, category_type, business_area) VALUES
  ('Büfé alapanyag',      'product',  'buffet'),
  ('Büfé termék',         'product',  'buffet'),
  ('Horgászcikk',         'product',  'fish'),
  ('Hal',                 'product',  'fish'),
  ('Horgászjegy',         'product',  'fish'),
  ('Büfé bevétel',        'sale',     'buffet'),
  ('Halas bevétel',       'sale',     'fish'),
  ('Rendezvény bevétel',  'sale',     'event'),
  ('Alapanyag beszerzés', 'purchase', 'other'),
  ('Áru beszerzés',       'purchase', 'other');
