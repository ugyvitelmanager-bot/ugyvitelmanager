# 📋 Projekt Haladás – Checklist

Ez a fájl követi a Biz Manager MVP megvalósítását.

## 🏁 Phase 1: Alapok és Törzsadatok (MVP Fázis 1)

### 🧱 Alapozás
- [x] Next.js 16 + Tailwind 4 Setup
- [x] Supabase Auth integráció
- [x] Root Layout + Header + Sidebar
- [x] GitHub + Vercel Deploy stabilizálás (404-es hiba hárítva)

### ⚙️ Törzsadat Kezelés (Settings)
- [x] ÁFA kulcsok (vat_rates) Alapadatok
- [x] Mértékegységek (units) Alapadatok
- [x] Kategóriák (categories) + Üzletági logika (Business Area)
- [x] Airtable Import Motor (163 termék + árak + receptek betöltése)
- [ ] Bevételi források (sales_sources) CRUD
- [ ] Tárolóhelyek (storage_locations) CRUD

### 📦 Termékmenedzsment (Products)
- [x] Pénzügyi precizitás (fillér alapú számítás, Forint kerekítés eladásnál)
- [ ] Terméklista nézet (táblázat + szűrés)
- [ ] Új termék rögzítése (Típus-alapú form)
- [ ] Termék szerkesztése / Soft Delete

### 🧪 Receptúrák és Kalkuláció (Recipes)
- [x] Recept rögzítő logika (Importálva az Airtable-ből!)
- [x] Önköltség és javasolt ár kalkulátor logika
- [ ] Recept verziókezelés alapok

---

## 📈 Phase 2: Tranzakciók és Leltár

### 💰 Bevételrögzítés (Sales)
- [ ] Napi/Heti bevétel beviteli felület
- [ ] Forrás és ÁFA alapú rögzítés
- [ ] Horgászjegy sorszám kontroll alapok

### 🛒 Beszerzés (Purchases)
- [ ] Beszerzés rögzítése
- [ ] Készletnövekedés automatikus generálása

### 📋 Leltár (Inventory)
- [ ] Leltárív generálás
- [ ] XLSX Export

---

## 📊 Phase 3: Dashboard és Riportok
- [ ] Dashboard statisztikák (Büfé vs Halas)
- [ ] ÁFA összesítő riport
- [ ] Fordulatszám és árrés elemzés
