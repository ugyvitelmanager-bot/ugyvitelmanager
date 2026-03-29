import { createClient } from '@/lib/supabase/server'
import { roundToForint } from '@/lib/finance'
import fs from 'fs'
import path from 'path'

/**
 * Étlap CSV importálása:
 * Az Airtable Étlap táblájából importálja a késztermékeket (eladható tételek).
 * 
 * FONTOS: Az "Összetétel" oszlopot használjuk az alapanyagnevekhez (nem az "Összetevők"-et).
 * Az "Összetevők" az Airtable saját linked record neveit tartalmazza, ami nem egyezik a raktár nevekkel.
 * 
 * Egyszerű termék: ha az Összetétel csak a terméket önmagát tartalmazza (pl. egy üdítő)
 * Összetett termék: ha több összetevő van (pl. hotdog, pizza)
 */
export async function importEtlapData() {
  const supabase = await createClient()

  try {
    // 1. CSV beolvasása
    const etlapCsv = fs.readFileSync(path.join(process.cwd(), 'Airtable', 'etlap.csv'), 'utf-8')
    const etlapData = parseCSV(etlapCsv).filter(row => row['Termék neve']?.trim())

    console.log(`Étlap CSV: ${etlapData.length} sor beolvasva.`)

    // 2. Szükséges törzsadatok lekérése
    const { data: vatRatesRaw } = await supabase.from('vat_rates').select('*')
    const { data: unitsRaw } = await supabase.from('units').select('*')
    const { data: categoriesRaw } = await supabase.from('categories').select('*')
    const { data: existingProductsRaw } = await supabase.from('products').select('id, name')

    const vatRates = vatRatesRaw as any[]
    const units = unitsRaw as any[]
    const categories = categoriesRaw as any[]
    const existingProducts = existingProductsRaw as any[]

    const unitDb = units.find(u => u.symbol === 'db')

    // VAT keresés rate_percent alapján
    const getVat = (vatStr: string) => {
      const pct = parseFloat(vatStr.replace('%', '').trim())
      return vatRates.find(v => Math.abs(parseFloat(v.rate_percent) - pct) < 0.01)
        || vatRates.find(v => parseFloat(v.rate_percent) === 27)
    }

    // Kategória keresés: kis/nagybetű független, whitespace normalizált
    const getCategory = (catName: string) => {
      const normalized = catName.trim().toLowerCase()
      return categories.find(c => c.name.trim().toLowerCase() === normalized)
    }

    let inserted = 0
    let skipped = 0
    let recipeCreated = 0
    const errors: string[] = []

    // 3. Késztermékek importálása
    for (const row of etlapData) {
      const name = row['Termék neve'].trim()
      if (!name) continue

      // 3a. Sor adatainak kiolvasása
      const categoryName = row['Kategória']?.trim()
      const category = getCategory(categoryName)
      const vatStr = row['ÁFA']?.trim() || '27%'
      const vat = getVat(vatStr)
      const isMohu = row['MOHU Köteles?']?.trim() === 'checked'

      if (!category && categoryName) {
        errors.push(`Ismeretlen kategória: "${categoryName}" → ${name}`)
      }

      // Már létező termékek: kategóriát és MOHU jelölést frissítjük
      const existingProduct = existingProducts.find(p => p.name.trim() === name)
      if (existingProduct) {
        if (category) {
          await (supabase.from('products') as any)
            .update({ category_id: category.id, is_mohu_fee: isMohu })
            .eq('id', existingProduct.id)
        }
        skipped++
        continue
      }

      // Árak: az étlap CSV-ben Forintban vannak
      const purchasePriceNet = parseEtlapForint(row['Nettó anyagköltség'])
      const salePriceGross = roundToForint(parseEtlapForint(row['ÁFA-val növelt eladási ár']))

      // "Összetétel" oszlop = raktár alapanyagok nevei (vesszővel elválasztva)
      // "Összetevők" = Airtable saját linked record neve → NEM használjuk
      const osszetetelRaw = row['Összetétel'] || ''
      const ingredientNames = splitIngredients(osszetetelRaw)

      // Egyszerű termék: ha csak 1 összetevő van ÉS az neve megegyezik a termékkel
      const isSimpleProduct = ingredientNames.length === 1 &&
        normalize(ingredientNames[0]) === normalize(name)

      const productType = isSimpleProduct ? 'stock_product' : 'recipe_product'

      // Termék létrehozása
      const { data: newProductRaw, error: productError } = await (supabase.from('products') as any)
        .insert({
          name,
          product_type: productType,
          category_id: category?.id || null,
          unit_id: unitDb?.id || null,
          default_vat_rate_id: vat?.id || null,
          purchase_price_net: purchasePriceNet,
          default_sale_price_gross: salePriceGross,
          is_mohu_fee: isMohu,
          is_stock_tracked: isSimpleProduct,
          is_active: true
        })
        .select()
        .single()

      if (productError) {
        errors.push(`Termék hiba (${name}): ${productError.message}`)
        continue
      }

      const newProduct = newProductRaw as any
      inserted++

      // 4. Recept létrehozása összetett termékeknél
      if (!isSimpleProduct && ingredientNames.length > 0) {
        // Frissített termék lista (az imént feltöltöttekkel)
        const { data: allProductsNow } = await supabase.from('products').select('id, name')
        const allProducts = allProductsNow as any[]

        const { data: newRecipeRaw, error: recipeError } = await (supabase.from('recipes') as any)
          .insert({
            product_id: newProduct.id,
            name,
            is_active: true,
            vat_rate_id: vat?.id || null,
          })
          .select()
          .single()

        if (recipeError) {
          errors.push(`Recept hiba (${name}): ${recipeError.message}`)
          continue
        }

        const newRecipe = newRecipeRaw as any
        recipeCreated++

        // Egyedi összetevők (duplikációk szűrése — Airtable sokszor ismételt neveket adott)
        const uniqueIngredientNames = Array.from(new Set(ingredientNames.map(n => normalize(n))))

        for (const ingredientNormalized of uniqueIngredientNames) {
          const ingredient = allProducts.find(p =>
            normalize(p.name) === ingredientNormalized
          )
          if (!ingredient) {
            errors.push(`Nem található: "${ingredientNormalized}" → ${name}`)
            continue
          }

          await (supabase.from('recipe_items') as any).insert({
            recipe_id: newRecipe.id,
            ingredient_product_id: ingredient.id,
            quantity: 1,
            unit_id: unitDb?.id || null,
          })
        }
      }
    }

    return {
      success: true,
      message: `Étlap import kész: ${inserted} termék felvéve, ${skipped} már létezett, ${recipeCreated} recept létrehozva.`,
      errors: errors.length > 0 ? errors : undefined,
    }
  } catch (error: any) {
    console.error('Étlap import hiba:', error)
    return { success: false, error: error.message }
  }
}

// --- Segédfüggvények ---

function parseCSV(csv: string): any[] {
  const lines = csv.split(/\r?\n/)
  const headers = splitCSVLine(lines[0])
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const values = splitCSVLine(line)
    const obj: any = {}
    headers.forEach((h, i) => { obj[h.trim()] = values[i] || '' })
    return obj
  })
}

function splitCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result.map(s => s.replace(/^"|"$/g, '').trim())
}

/** Étlap CSV árak: egyszerű egész Forint értékek → fillér */
function parseEtlapForint(priceStr: string): number {
  if (!priceStr) return 0
  const forint = parseInt(priceStr.replace(/[^\d]/g, ''), 10) || 0
  return forint * 100
}

/**
 * Az "Összetétel" oszlop tartalma vesszővel elválasztott alapanyagnévsor.
 * FONTOS: ez már a CSV parser által feldolgozott szöveg, NEM a raw CSV sor.
 */
function splitIngredients(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

/** Kis/nagybetű és whitespace független összehasonlítás */
function normalize(str: string): string {
  return str.toLowerCase().replace(/\s+/g, ' ').trim()
}
