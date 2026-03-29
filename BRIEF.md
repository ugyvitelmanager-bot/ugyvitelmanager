# Ügyvitel Manager – Projekt Specifikáció és Irányelv

Ez a dokumentum a projekt hivatalos briefje és technikai iránymutatása. Minden fejlesztésnek ehhez kell igazodnia.

## 🎯 Projekt célja
Egy webes ügyviteli rendszer Supabase backenddel és Vercel deployjal, amely egy vegyes működésű vállalkozást kezel (büfé, halas, horgászjegy, rendezvények).

---

## 🏗️ Architekturális Elvárások
* **Moduláris felépítés**: Domain-alapú modulok a `modules/` mappában.
* **Kötelező rétegezés**: 
    - UI réteg (`app/`)
    - Service réteg (`modules/*/services/`)
    - Data Access réteg (`Supabase queryk`)
* **Pénzügyi precizitás**: Integer/fillér alapú számítások a kerekítési hibák elkerülésére.
* **Soft Delete**: Üzleti adatok nem törlődnek véglegesen.

---

## 🧩 Modulok és Üzleti Logika

### 1. Bevételi források (Sales Sources)
* Típusok: `cash_register`, `terminal`, `invoice`, `manual`.
* Források: Büfé, Halas, Rendezvény, Egyéb.

### 2. Terméktípusok
* `ingredient`: Alapanyag (készletezett).
* `recipe_product`: Receptúrás eladási termék (kalkulált).
* `stock_product`: Fix árú készletes termék.
* `service_with_serial`: Sorszámozott horgászjegy (speciális kontroll).
* `non_stock_sale`: Nem készletezett bevétel (pl. haleladás).

### 3. Horgászjegy Kezelés
* Szigorú számadású sorszámtartomány követés.
* Nem klasszikus raktárkészlet, hanem elszámolási kontroll.

### 4. Receptek és Kalkuláció
* Alapanyagokból összeálló receptúrák.
* Automatikus önköltség és javasolt ár számítás.

---

## 🛠️ Teljes Supabase Adatbázis Struktúra

A rendszer az alábbi SQL séma alapján működik. Minden pénzügyi tétel (ár, összeg) **integer (fillér)** formátumban tárolódik a pontosság érdekében.

```sql
-- Enum típusok
CREATE TYPE product_type AS ENUM ('ingredient', 'recipe_product', 'stock_product', 'service', 'service_with_serial', 'non_stock_sale');
CREATE TYPE source_type AS ENUM ('cash_register', 'terminal', 'invoice', 'manual');
CREATE TYPE business_area AS ENUM ('buffet', 'fish', 'event', 'other');
CREATE TYPE movement_type AS ENUM ('purchase', 'sale_recipe', 'sale_stock', 'inventory_adjustment', 'manual', 'waste', 'other');
CREATE TYPE recipe_status AS ENUM ('draft', 'active', 'archived');
CREATE TYPE event_status AS ENUM ('draft', 'quote_sent', 'accepted', 'completed', 'closed', 'cancelled');
CREATE TYPE inventory_status AS ENUM ('draft', 'finalized');
CREATE TYPE category_type AS ENUM ('product', 'sale', 'purchase', 'event');
CREATE TYPE location_type AS ENUM ('buffet', 'shop', 'warehouse', 'other');

-- 1. TÖRZSADATOK
-- vat_rates: ÁFA kulcsok (name, rate_percent, is_exempt)
-- categories: Hierarchia + business_area (name, category_type, business_area, parent_id)
-- units: Mértékegységek (name, symbol, precision)
-- sales_sources: Bevételi források (name, source_type, business_area)
-- suppliers: Beszállítók (name, tax_number, contact)
-- storage_locations: Tárolóhelyek (name, location_type)

-- 2. TERMÉKEK
-- products: (name, sku, type, category_id, unit_id, vat_rate_id, prices IN CENTS, stock_tracked)

-- 3. RECEPTEK
-- recipes: (product_id, name, target_margin_percent, status, version)
-- recipe_items: (recipe_id, ingredient_id, quantity, unit_id, cost_snapshot)

-- 4. BESZERZÉSEK
-- purchase_headers & purchase_items: (date, supplier, products, quantity, unit_price_net IN CENTS)

-- 5. BEVÉTELEK
-- sales_entries: (sale_date, source_id, vat_rate_id, gross_amount IN CENTS, net_amount IN CENTS, category_id)

-- 6. HORGÁSZJEGY KONTROLL
-- serial_documents & serial_document_usages: (product_id, type, prefix, range_start, range_end, quantity)

-- 7. KÉSZLETMOZGÁSOK
-- stock_movements: (product_id, location_id, type, quantity_change, reference)

-- 8. LELTÁR
-- inventory_counts & inventory_count_items: (date, status, system_qty, counted_qty, difference)

-- 9. RENDEZVÉNYEK / AJÁNLATOK
-- events & event_items: (name, date, status, customer, products, quantity, custom_prices)

-- 10. FELHASZNÁLÓK
-- profiles: (id, full_name, role, is_active)
```

---

## 📥 Airtable Adatmigráció (Mapping)

Az `Airtable/` mappában lévő CSV-ket az alábbiak szerint feleltetjük meg az új sémának:

1. **`Grid view.csv` (Cikktörzs)**: 
    - `Cikk neve` -> `products.name`
    - `Kategória` -> `categories.name`
    - `Kiszerelés` -> `products.packaging_description`
    - `Mértékegység` -> `units.symbol` (leképezve)
    - `Egységár` -> `products.purchase_price_net` (fillérre konvertálva)

2. **`Grid view (1).csv` (Árazás)**:
    - `Termék neve` -> `products.name` alapján párosítás
    - `Haszonkulcs` -> `recipes.target_margin_percent`
    - `ÁFA` -> `vat_rates.name` alapján párosítás
    - `ÁFA-val növelt ár` -> `products.default_sale_price_gross`

3. **`Grid view (2).csv` (Receptek)**:
    - `Receptazonosító` -> `recipes.name`
    - `Alapanyag` -> `recipe_items.ingredient_product_id`
    - `Mennyiség` -> `recipe_items.quantity`

---

## 🏗️ Architekturális Irányelvek
* **Domain-alapú szerkezet**: A logika a `modules/` mappában, a routing az `app/`-ben lakik.
* **Service réteg**: `modules/*/services/` - Itt történik minden Supabase hívás és üzleti logika.
* **Pénzügyi precizitás**: A `lib/finance.ts` használata minden számításhoz (integer alapú/fillér logika).

---

## 📈 MVP Fejlesztési Sorrend

### I. Fázis (Folyamatban)
- [x] Auth & Layout Setup
- [ ] Törzsadatok kezelése (ÁFA, Egységek, Kategóriák)
- [ ] Termék menedzsment (CRUD + Típusok)
- [ ] Alapszintű Receptkezelés
- [ ] Napi/Heti bevételrögzítés

### II. Fázis
- [ ] Leltár rögzítés és XLSX export
- [ ] Rendezvény kalkuláció modul
- [ ] Készletmozgás finomítás

---

*Ez a dokumentum a projekt fejlődésével párhuzamosan frissül.*
