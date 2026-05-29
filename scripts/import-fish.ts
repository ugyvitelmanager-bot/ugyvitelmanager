// One-time import script: reads halak.xlsx and upserts fish + catches into Supabase.
// Run: npx tsx --env-file=.env.local scripts/import-fish.ts

import * as ExcelJS from 'exceljs'
import { createClient } from '@supabase/supabase-js'
import * as path from 'path'
import * as fs from 'fs'

// ---------------------------------------------------------------------------
// Env loading
// ---------------------------------------------------------------------------
const envFile = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf-8').split('\n').forEach((line) => {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '')
  })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL vagy SUPABASE_SERVICE_ROLE_KEY hiányzik a .env.local-ból')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
})

// ---------------------------------------------------------------------------
// Column layout (0-indexed, matching the actual Excel structure)
//
// First-catch block (cols 0–6):
//   0: date, 1: time, 2: station, 3: name, 4: type, 5: angler, 6: weight
//
// Chip ID:
//   7: chip_id
//
// Re-catch blocks starting at col 8, each block is 5 columns wide:
//   +0: date, +1: time, +2: station, +3: weight, +4: angler
// ---------------------------------------------------------------------------
const C_DATE    = 1
const C_STATION = 3
const C_NAME    = 4
const C_TYPE    = 5
const C_ANGLER  = 6
const C_WEIGHT  = 7
const C_CHIPID  = 8
const C_RECATCH_START = 10
const RECATCH_STRIDE  = 5
// offsets within each re-catch block
const RC_DATE    = 0
const RC_STATION = 2
const RC_WEIGHT  = 3
const RC_ANGLER  = 4

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type FishType = 'tükrös' | 'tőponty' | 'amur' | 'busa' | 'egyéb'

interface CatchData {
  date:    string   // YYYY-MM-DD
  station: string
  angler:  string
  grams:   number
}

interface FishData {
  chipId:     string
  name:       string
  type:       FishType
  catches:    CatchData[]  // [0] = first catch, [1+] = re-catches
}

// ---------------------------------------------------------------------------
// Cell value extraction
// ---------------------------------------------------------------------------

// Returns raw cell value as a plain string (no date conversion)
function rawStr(cell: ExcelJS.Cell): string {
  const v = cell.value
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object' && 'richText' in (v as object)) {
    return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join('')
  }
  if (typeof v === 'object' && 'formula' in (v as object)) {
    const result = (v as ExcelJS.CellFormulaValue).result
    return result != null ? String(result) : ''
  }
  return String(v)
}

// Returns all cell values in a row as raw strings, for debugging
function rowDebug(row: ExcelJS.Row, maxCol = 20): string[] {
  const out: string[] = []
  for (let c = 1; c <= maxCol; c++) {
    out.push(rawStr(row.getCell(c)))
  }
  return out
}

// Converts a cell to YYYY-MM-DD.
// Handles: JS Date, Excel serial number, "2026.03.27", "2026-03-27"
function parseDate(cell: ExcelJS.Cell): string | null {
  const v = cell.value
  if (v == null) return null

  if (v instanceof Date) {
    return v.toISOString().split('T')[0]
  }

  if (typeof v === 'number') {
    if (v < 1000) return null  // too small to be a date serial
    // Excel serial: days since 1900-01-00, with 1900 leap-year bug (serial 60 = 1900-02-28)
    return new Date((v - 25569) * 86400 * 1000).toISOString().split('T')[0]
  }

  const s = String(v).trim()
  if (!s) return null

  // "2026.03.27" → "2026-03-27"
  const dotMatch = s.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})/)
  if (dotMatch) {
    return `${dotMatch[1]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[3].padStart(2, '0')}`
  }

  // ISO or dash-separated
  const dashMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (dashMatch) {
    return `${dashMatch[1]}-${dashMatch[2].padStart(2, '0')}-${dashMatch[3].padStart(2, '0')}`
  }

  return null
}

// Parses "11100 g", "10625g", "10625" → integer grams
function parseWeight(cell: ExcelJS.Cell): number | null {
  const raw = rawStr(cell).replace(/\s/g, '')
  if (!raw) return null
  // If the cell is a plain number in ExcelJS it comes back as number type
  if (typeof cell.value === 'number') return Math.round(cell.value)
  const m = raw.match(/^(\d+)/)
  if (!m) return null
  return parseInt(m[1], 10)
}

// empty/null → 'tőponty'.
// ExcelJS passes through Latin-1 bytes as Unicode code points (ü=0xFC, ö=0xF6),
// so re-encode via 'binary' and decode as latin1 to get a reliable ASCII-range string,
// then match by structural pattern instead of exact Hungarian spelling.
function mapType(raw: string): FishType {
  if (!raw.trim()) return 'tőponty'
  const normalized = Buffer.from(raw, 'binary').toString('latin1').toLowerCase().trim()
  if (normalized.startsWith('t') && normalized.includes('kr')) return 'tükrös'   // Tükrös
  if (normalized.startsWith('t') && normalized.includes('ves')) return 'tőponty' // Töves
  if (normalized === 'pikkelyes') return 'egyéb'
  if (normalized.includes('amur')) return 'amur'
  if (normalized.includes('busa')) return 'busa'
  return 'tőponty'
}

// Take first word as the "first name" stored in DB
function firstName(cell: ExcelJS.Cell): string {
  return rawStr(cell).trim().split(/\s+/)[0] ?? ''
}

// ---------------------------------------------------------------------------
// Row parser
// ---------------------------------------------------------------------------
function parseRow(row: ExcelJS.Row, rowNum: number): FishData | null {
  // ExcelJS cells are 1-based; our column constants are 0-based → add 1
  const chipRaw = rawStr(row.getCell(C_CHIPID + 1)).trim()
  if (!chipRaw || !/^\d+$/.test(chipRaw)) return null

  const date = parseDate(row.getCell(C_DATE + 1))
  const grams = parseWeight(row.getCell(C_WEIGHT + 1))
  const station = rawStr(row.getCell(C_STATION + 1)).trim()
  const name = rawStr(row.getCell(C_NAME + 1)).trim()
  const angler = firstName(row.getCell(C_ANGLER + 1))

  if (!date) {
    console.warn(`  WARN  sor ${rowNum}: hiányzó dátum, chip=${chipRaw} — kihagyva`)
    return null
  }
  if (!grams || grams <= 0) {
    console.warn(`  WARN  sor ${rowNum}: érvénytelen súly, chip=${chipRaw} — kihagyva`)
    return null
  }
  if (!name) {
    console.warn(`  WARN  sor ${rowNum}: hiányzó halnév, chip=${chipRaw} — kihagyva`)
    return null
  }

  const typeRaw    = rawStr(row.getCell(C_TYPE + 1))
  const typeMapped = mapType(typeRaw)
  console.log(`  TYPE  chip=${chipRaw} "${name}"  raw="${typeRaw}"  hex=[${[...typeRaw].map((c) => c.codePointAt(0)!.toString(16)).join(' ')}]  →  "${typeMapped}"`)

  const firstCatch: CatchData = { date, station, angler, grams }

  // Re-catches: blocks of RECATCH_STRIDE columns starting at C_RECATCH_START
  const reCatches: CatchData[] = []
  let blockStart = C_RECATCH_START
  const lastCol = row.cellCount   // ExcelJS: rightmost non-empty cell (0 if none)

  while (blockStart + RC_ANGLER < lastCol) {
    const rcDateCell = row.getCell(blockStart + RC_DATE + 1)
    const rcDate = parseDate(rcDateCell)
    if (!rcDate) break   // empty date = no more re-catches

    const rcGrams = parseWeight(row.getCell(blockStart + RC_WEIGHT + 1))
    if (!rcGrams || rcGrams <= 0) {
      console.warn(`  WARN  sor ${rowNum}: visszafogás üres súly, chip=${chipRaw}, blokk col=${blockStart} — kihagyva`)
      blockStart += RECATCH_STRIDE
      continue
    }

    reCatches.push({
      date:    rcDate,
      station: rawStr(row.getCell(blockStart + RC_STATION + 1)).trim(),
      grams:   rcGrams,
      angler:  firstName(row.getCell(blockStart + RC_ANGLER + 1)),
    })

    blockStart += RECATCH_STRIDE
  }

  return {
    chipId:  chipRaw,
    name,
    type:    typeMapped,
    catches: [firstCatch, ...reCatches],
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const excelPath = path.join(__dirname, '..', 'halak.xlsx')
  console.log(`Olvassuk: ${excelPath}\n`)

  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(excelPath)

  const sheet = workbook.worksheets[0]
  if (!sheet) {
    console.error('Nem található munkalap')
    process.exit(1)
  }
  console.log(`Munkalap: "${sheet.name}", sorok: ${sheet.rowCount}\n`)

  // ── Debug: dump first 3 rows raw ──────────────────────────────────────────
  console.log('=== RAW ELSŐ 3 SOR (ellenőrzés) ===')
  let debugCount = 0
  sheet.eachRow((row, rowNum) => {
    if (debugCount >= 3) return
    const values = rowDebug(row, 15)
    console.log(`Sor ${rowNum}: [${values.map((v, i) => `${i}:"${v}"`).join(', ')}]`)
    debugCount++
  })
  console.log('====================================\n')

  // ── Detect and skip header row ────────────────────────────────────────────
  let startRow = 1
  const firstRow = sheet.getRow(1)
  const firstRowStr = rowDebug(firstRow, 8).join(' ').toLowerCase()
  if (firstRowStr.includes('jellege') || firstRowStr.includes('chip') || firstRowStr.includes('dátum')) {
    console.log('Fejléc sor érzékelve → kihagyva (sor 1)\n')
    startRow = 2
  }

  // ── Parse all data rows ───────────────────────────────────────────────────
  const fishMap = new Map<string, FishData>()

  sheet.eachRow((row, rowNum) => {
    if (rowNum < startRow) return

    const fish = parseRow(row, rowNum)
    if (!fish) return

    if (fishMap.has(fish.chipId)) {
      // Same chip ID appears in multiple rows — merge catches
      const existing = fishMap.get(fish.chipId)!
      existing.catches.push(...fish.catches)
    } else {
      fishMap.set(fish.chipId, fish)
    }
  })

  console.log(`Parsolt halak: ${fishMap.size}`)
  const totalCatches = [...fishMap.values()].reduce((s, f) => s + f.catches.length, 0)
  console.log(`Összes fogás az Excelben: ${totalCatches}\n`)

  // ── Fetch existing chip IDs ───────────────────────────────────────────────
  const { data: existing, error: fetchErr } = await (supabase.from('fish') as any).select('chip_id')
  if (fetchErr) {
    console.error('DB lekérdezés hiba:', fetchErr.message)
    process.exit(1)
  }
  const existingIds = new Set((existing as { chip_id: string }[]).map((r) => r.chip_id))
  console.log(`Már az adatbázisban: ${existingIds.size} hal\n`)

  // ── Import ────────────────────────────────────────────────────────────────
  let created = 0, skipped = 0, extraCatches = 0, errors = 0

  for (const [chipId, fish] of fishMap) {
    if (existingIds.has(chipId)) {
      console.log(`  SKIP  chip=${chipId} (már létezik)`)
      skipped++
      continue
    }

    // Sort catches by date so the earliest is first
    fish.catches.sort((a, b) => a.date.localeCompare(b.date))
    const first = fish.catches[0]

    const { data: fishId, error: rpcErr } = await (supabase as any).rpc('create_fish_with_catch', {
      p_chip_id:           chipId,
      p_name:              fish.name,
      p_type:              fish.type,
      p_caught_at:         first.date,
      p_weight_grams:      first.grams,
      p_station:           first.station,
      p_angler_first_name: first.angler,
      p_notes:             null,
    })

    if (rpcErr) {
      console.error(`  ERROR chip=${chipId} "${fish.name}": ${rpcErr.message}`)
      errors++
      continue
    }
    console.log(`  OK    chip=${chipId} → "${fish.name}" [${fish.type}] ${first.grams}g  id=${fishId}`)
    created++

    for (let i = 1; i < fish.catches.length; i++) {
      const c = fish.catches[i]
      const { error: catchErr } = await (supabase.from('catches') as any).insert({
        fish_id:           fishId,
        caught_at:         c.date,
        weight_grams:      c.grams,
        station:           c.station,
        angler_first_name: c.angler,
        notes:             null,
        created_by:        'warden',
      })
      if (catchErr) {
        console.error(`    visszafogás #${i + 1} ERROR chip=${chipId}: ${catchErr.message}`)
        errors++
      } else {
        console.log(`    visszafogás #${i + 1} OK  ${c.date} ${c.grams}g`)
        extraCatches++
      }
    }
  }

  console.log()
  console.log('─'.repeat(50))
  console.log(`Létrehozva:      ${created} hal`)
  console.log(`Kihagyva:        ${skipped} hal (már létezett)`)
  console.log(`Extra fogások:   ${extraCatches}`)
  console.log(`Hibák:           ${errors}`)
  console.log('─'.repeat(50))
  if (errors > 0) process.exit(1)
}

main().catch((e) => { console.error(e); process.exit(1) })
