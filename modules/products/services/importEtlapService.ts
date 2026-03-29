import { createClient } from '@/lib/supabase/server'
import { roundToForint } from '@/lib/finance'
import fs from 'fs'
import path from 'path'

/**
 * Étlap CSV importálása:
 * Az Airtable Étlap táblájából importálja a késztermékeket (eladható tételek).
 * A Raktár CSV-ből már importált alapanyagok kerülnek hozzájuk recept-összetevőként.
 * 
 * CSV struktúra: Termék neve | Kategória | Összetétel | Összetevők | Nettó anyagköltség |
 *                Haszonkulcs | Nettó eladási Ár | ÁFA | ÁFA-val növelt eladási ár | MOHU Köteles?
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

    // Default egység: db
    const unitDb = units.find(u => u.symbol === 'db')

    // VAT keresés rate_percent alapján
    const getVat = (vatStr: string) => {
      const pct = parseFloat(vatStr.replace('%', '').trim())
      return vatRates.find(v => Math.abs(parseFloat(v.rate_percent) - pct) < 0.01)
        || vatRates.find(v => parseFloat(v.rate_percent) === 27)
    }

    // Eredmény nyomkövetés
    let inserted = 0
    let skipped = 0
    let recipeCreated = 0
    let errors: string[] = []

    // 3. Késztermékek importálása
    for (const row of etlapData) {
      const name = row['Termék neve'].trim()
      if (!name) continue

      // Már létező termékek kihagyása
      if (existingProducts.find(p => p.name === name)) {
        skipped++
        continue
      }

      const categoryName = row['Kategória']?.trim()
      const category = categories.find(c => c.name === categoryName)
      const vatStr = row['ÁFA']?.trim() || '27%'
      const vat = getVat(vatStr)
      const isMohu = row['MOHU Köteles?']?.trim() === 'checked'

      // Árak fillérbe konvertálva (Forint * 100)
      const purchasePriceNet = parseEtlapPrice(row['Nettó anyagköltség'])
      const salePriceGross = roundToForint(parseEtlapPrice(row['ÁFA-val növelt eladási ár']))

      // Összetevők elemzése — ha több összetevő van, VAGY az összetevő neve eltér a termék nevétől,
      // akkor valódi recept; ha az egyetlen összetevő maga a termék, egyszerű viszonteladási termék
      const ingredientNamesRaw = row['Összetevők'] || ''
      const ingredientNames = splitIngredients(ingredientNamesRaw)
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
          is_stock_tracked: productType === 'stock_product',
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
        // Frissített termék lista lekérése (az imént feltöltöttekkel együtt)
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

        // Recept összetevők hozzáadása
        for (const ingredientName of ingredientNames) {
          const ingredient = allProducts.find(p => 
            normalize(p.name) === normalize(ingredientName)
          )
          if (!ingredient) {
            errors.push(`Nem található összetevő: "${ingredientName}" → ${name}`)
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

/**
 * Étlap árak Forintban vannak (nem "Ft 2.689,50" formátumban)
 * Pl.: "1112" → 111200 fillér
 */
function parseEtlapPrice(priceStr: string): number {
  if (!priceStr) return 0
  const clean = priceStr.replace(/[^\d]/g, '')
  const forint = parseInt(clean, 10) || 0
  return forint * 100
}

/**
 * Összetevők szövegének feldarabolása
 * A CSV-ben vesszővel elválasztva vannak, ezért a CSV parser már lista elemként adja
 * de az "Összetevők" oszlop maga is vesszővel tagolt értékeket tartalmaz
 */
function splitIngredients(raw: string): string[] {
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

/**
 * Névegyeztetés: kis-nagybetű és extra szóköz független összehasonlítás
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/\s+/g, ' ').trim()
}
