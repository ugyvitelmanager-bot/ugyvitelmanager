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

## 🛠️ Supabase Séma Összefoglaló
A rendszer az alábbi fő táblákra épül (részletek a `supabase/schema.sql` fájlban):
- `vat_rates`, `categories`, `units`, `sales_sources`, `suppliers`, `storage_locations` (Törzsadatok)
- `products` (Központi terméktábla)
- `recipes`, `recipe_items` (Receptúrák)
- `purchase_headers`, `purchase_items` (Beszerzések)
- `sales_entries` (Bevételrögzítés)
- `serial_documents`, `serial_document_usages` (Horgászjegy kontroll)
- `stock_movements` (Készletmozgások)
- `inventory_counts`, `inventory_count_items` (Leltár)
- `events`, `event_items` (Rendezvények)
- `profiles` (Felhasználói jogosultságok)

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
