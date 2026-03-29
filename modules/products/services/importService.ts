import { createClient } from '@/lib/supabase/server'
import { roundCurrency, roundToForint } from '@/lib/finance'
import fs from 'fs'
import path from 'path'

/**
 * Airtable CSV adatok importálása a Supabase-be
 */
export async function importAirtableData() {
  const supabase = await createClient()

  try {
    // 1. Fájlok beolvasása
    const productsCsv = fs.readFileSync(path.join(process.cwd(), 'Airtable', 'Grid view.csv'), 'utf-8')
    const pricingCsv = fs.readFileSync(path.join(process.cwd(), 'Airtable', 'Grid view (1).csv'), 'utf-8')
    const recipesCsv = fs.readFileSync(path.join(process.cwd(), 'Airtable', 'Grid view (2).csv'), 'utf-8')

    const productsData = parseCSV(productsCsv)
    const pricingData = parseCSV(pricingCsv)
    const recipesData = parseCSV(recipesCsv)

    console.log(`Betöltve: ${productsData.length} termék sor, ${pricingData.length} ár sor, ${recipesData.length} recept sor.`)

    // 2. Törzsadatok lekérése (ÁFA, Egységek) az ID-k párosításához
    const { data: vatRatesRaw } = await supabase.from('vat_rates').select('*')
    const { data: unitsRaw } = await supabase.from('units').select('*')

    const vatRates = vatRatesRaw as any[]
    const units = unitsRaw as any[]

    if (!vatRates || !units) throw new Error('Nem sikerült lekérni az ÁFA vagy Egység törzsadatokat.')

    // 3. Kategóriák: csak az újakat szúrjuk be, a meglévőket kihagyjuk
    const uniqueCategories = Array.from(new Set(productsData.map(p => p['Kategória']).filter(Boolean)))
    const { data: existingCatsRaw } = await supabase.from('categories').select('*')
    const existingCats = (existingCatsRaw as any[]) || []

    for (const catName of uniqueCategories) {
      const alreadyExists = existingCats.find(
        c => c.name.toLowerCase().trim() === catName.toLowerCase().trim()
      )
      if (!alreadyExists) {
        await (supabase.from('categories') as any).insert({
          name: catName,
          category_type: 'product',
          business_area: 'buffet'
        })
      }
    }

    const { data: categoriesRaw } = await supabase.from('categories').select('*')
    const categories = categoriesRaw as any[]
    if (!categories) throw new Error('Nem sikerült lekérni a kategóriákat.')

    // 4. Termékek feldolgozása
    for (const item of productsData) {
      const name = item['Cikk neve']
      if (!name) continue

      const priceMeta = pricingData.find(p => p['Termék neve'] === name)
      const category = categories.find(c => c.name === item['Kategória'])
      const unit = units.find(u => u.symbol === item['Mértékegység']) || units.find(u => u.symbol === 'db')
      const vat = vatRates.find(v => v.name === (priceMeta?.['ÁFA'] || '27%')) || vatRates[0]

      const purchasePrice = parseAirtablePrice(item['Egységár'] || item['Beszerzési ár (nettó)'])
      const salePriceGross = priceMeta ? parseAirtablePrice(priceMeta['ÁFA-val növelt eladási ár']) : null
      const isMohu = priceMeta?.['MOHU Köteles?'] === 'checked'

      const hasRecipe = recipesData.some(r => r['Receptazonosító'] === name)
      const productType = hasRecipe ? 'recipe_product' : (item['Kategória'] === 'Alapanyag' || item['Kategória'] === 'Segédanyag' ? 'ingredient' : 'stock_product')

      await (supabase.from('products') as any).insert({
        name: name,
        product_type: productType,
        category_id: category?.id,
        unit_id: unit?.id,
        default_vat_rate_id: vat?.id,
        purchase_price_net: roundCurrency(purchasePrice),
        default_sale_price_gross: salePriceGross ? roundToForint(salePriceGross) : null,
        is_mohu_fee: isMohu,
        is_stock_tracked: productType !== 'recipe_product',
        packaging_description: item['Kiszerelés'],
        is_active: true
      })
    }

    // 5. Receptek feltöltése
    const uniqueRecipes = Array.from(new Set(recipesData.map(r => r['Receptazonosító']).filter(Boolean)))
    const { data: dbProductsRaw } = await supabase.from('products').select('id, name')
    const dbProducts = dbProductsRaw as any[]

    for (const recipeName of uniqueRecipes) {
      const product = dbProducts?.find(p => p.name === recipeName)
      if (!product) continue

      const { data: newRecipeRaw } = await (supabase.from('recipes') as any).insert({
        product_id: product.id,
        name: recipeName,
        status: 'active',
        vat_rate_id: vatRates.find(v => v.name === '5%')?.id || vatRates[0].id 
      }).select().single()

      const newRecipe = newRecipeRaw as any

      if (newRecipe) {
        const items = recipesData.filter(r => r['Receptazonosító'] === recipeName)
        for (const rItem of items) {
          const ingredient = dbProducts?.find(p => p.name === rItem['Alapanyag a raktárból'])
          if (!ingredient) continue

          const unit = units.find(u => u.symbol === 'gr') || units[0] 
          
          await (supabase.from('recipe_items') as any).insert({
            recipe_id: newRecipe.id,
            ingredient_product_id: ingredient.id,
            quantity: parseFloat(rItem['Mennyiség'].replace(',', '.')),
            unit_id: unit.id
          })
        }
      }
    }

    return { success: true, message: `Sikeres import: ${productsData.length} termék feldolgozva.` }
  } catch (error: any) {
    console.error('Import hiba:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Egyszerű CSV parszoló (kezeli az idézőjeleket)
 */
function parseCSV(csv: string): any[] {
  const lines = csv.split(/\r?\n/)
  const headers = splitCSVLine(lines[0])
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = splitCSVLine(line)
    const obj: any = {}
    headers.forEach((h, i) => {
      obj[h] = values[i] || ''
    })
    return obj
  })
}

function splitCSVLine(line: string): string[] {
  const result = []
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
  return result.map(s => s.replace(/^"|"$/g, ''))
}

/**
 * Airtable ár formátum konvertálása fillérre (integer)
 * "Ft 2.689,50" -> 268950
 */
function parseAirtablePrice(priceStr: string): number {
  if (!priceStr) return 0
  // "Ft 2.689,50" -> "2689,50"
  const clean = priceStr.replace(/[^\d,]/g, '').replace(',', '.')
  const value = parseFloat(clean)
  return Math.round(value * 100)
}
