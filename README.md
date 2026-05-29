# CarpLove Ügyviteli Manager

Belső ügyviteli rendszer a CarpLove horgászközpont számára: napi elszámolás, bevétel/kiadás kezelés, készletnyilvántartás, rendezvény-ajánlatok.

## Tech stack

- **Next.js** (App Router) — `app/` könyvtár, server actions
- **Supabase** — PostgreSQL, RLS, RPCs, realtime
- **TypeScript** — strict mode
- **Tailwind CSS** — utility-first stílusok
- **Vercel** — deploy

## Supabase projekt

- **Project ref:** `rjhqrniwmowqddaizufe`
- **Dashboard:** [supabase.com/dashboard/project/rjhqrniwmowqddaizufe](https://supabase.com/dashboard/project/rjhqrniwmowqddaizufe)

## Helyi fejlesztés

```bash
npm install
npm run dev
```

Másold be a `.env.local.example` tartalmát `.env.local`-ba és töltsd ki a Supabase URL + anon key értékeket.

## Types generálás

Ha a DB sémája változott (migráció futott), regeneráld a TypeScript típusokat:

```bash
npx supabase login   # csak egyszer szükséges
npx supabase gen types typescript --project-id rjhqrniwmowqddaizufe --schema public > types/database.ts
```

A generált fájl (`types/database.ts`) ne legyen kézzel szerkesztve — a `types/index.ts` wrapper exportálja a szükséges típusokat.

## Séma és migrációk

- **Canonical séma:** `supabase/schema.sql` — friss DB-t ebből lehet felállítani
- **Migrációk:** `supabase/migrations/` — kronológikus változások

Új migráció futtatása: másold be a Supabase SQL Editor-ba és futtasd le.

## Főbb architektúrális döntések

| Döntés | Indok |
|--------|-------|
| **Fillér-alapú pénz** | `purchases.total_net`, `gross_amount` stb. mind `BIGINT` fillérben. 1 Ft = 100 fillér. Elkerüli a lebegőpontos kerekítési hibákat. |
| **Moduláris struktúra** | `modules/daily/`, `modules/purchases/`, `modules/cash/` stb. — feature-first szervezés |
| **Server Actions** | Adatmódosítások `modules/*/actions.ts` fájlokban, nem API route-okon keresztül |
| **Atomic RPCs** | `record_purchase_core`, `record_purchase_header`, `apply_purchase_line_items` — DB-oldalon garantálják a konzisztenciát |
| **Két purchases flow** | `purchase_headers/purchase_items` (Phase 2, nem aktív) vs `purchases/purchase_line_items` (MVP, aktív) — Phase 2-ben konsolidálandó |

## Modulok

| Modul | Útvonal | Státusz |
|-------|---------|---------|
| Napi elszámolás | `/napi` | Aktív |
| Beszerzések | `/beszerzes` | Aktív |
| Pénztár | `/penztar` | Aktív |
| Termékek | `/products` | Aktív |
| Receptek | `/recipes` | Aktív |
| Étlap | `/etlap` | Aktív |
| Dashboard | `/` | Aktív |
