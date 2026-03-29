'use server'

import { importAirtableData } from './services/importService'
import { importEtlapData } from './services/importEtlapService'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function runAirtableImportAction() {
  try {
    const result = await importAirtableData()
    if (result.success) {
      revalidatePath('/')
      revalidatePath('/products')
    }
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function runEtlapImportAction() {
  try {
    const result = await importEtlapData()
    if (result.success) {
      revalidatePath('/')
      revalidatePath('/products')
      revalidatePath('/recipes')
    }
    return result
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateProductPricing(
  id: string, 
  purchasePriceNet: number, 
  defaultSalePriceGross: number,
  isMohuFee: boolean
) {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from('products') as any)
      .update({ 
        purchase_price_net: Math.round(purchasePriceNet),
        default_sale_price_gross: Math.round(defaultSalePriceGross),
        is_mohu_fee: isMohuFee,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      
    if (error) throw error

    revalidatePath(`/etlap/${id}`)
    revalidatePath('/etlap')
    
    return { success: true }
  } catch (error: any) {
    console.error('Pricing update error:', error)
    return { success: false, error: error.message }
  }
}

export async function createNewMenuItem(
  name: string,
  categoryId: string,
  productType: 'recipe_product' | 'stock_product',
  vatRateId: string
) {
  try {
    const supabase = await createClient()

    // 1. Alapértelmezett mértékegységek lekérése ('adag' recepteknek, 'db' egyébnek)
    const { data: unitsRaw } = await supabase.from('units').select('id, symbol').in('symbol', ['adag', 'db'])
    const units = (unitsRaw as any[]) || []
    const adagUnit = units.find(u => u.symbol === 'adag')?.id
    const dbUnit = units.find(u => u.symbol === 'db')?.id
    const selectedUnitId = productType === 'recipe_product' ? adagUnit : dbUnit

    // 2. Termék létrehozása a Raktárban (Products tábla)
    const { data: product, error: insertError } = await (supabase.from('products') as any)
      .insert({
        name,
        category_id: categoryId,
        product_type: productType,
        default_vat_rate_id: vatRateId,
        unit_id: selectedUnitId || (units.length > 0 ? units[0].id : null),
        purchase_price_net: 0,
        default_sale_price_gross: 0,
        is_mohu_fee: false
      })
      .select('id')
      .single()

    if (insertError || !product) throw insertError || new Error('Hiba a termék létrehozása közben.')

    // 3. Ha saját készítésű (recept), akkor létrehozzuk az üres Receptet is
    let redirectUrl = `/etlap/${product.id}` // Alapból az árazóra visz (Viszonteladásnál)

    if (productType === 'recipe_product') {
      const { data: recipe, error: recipeError } = await (supabase.from('recipes') as any)
        .insert({
          product_id: product.id,
          name: name,
          is_active: true
        })
        .select('id')
        .single()
        
      if (recipeError || !recipe) throw recipeError || new Error('Hiba a receptúra létrehozása közben.')
      
      redirectUrl = `/recipes/${recipe.id}` // Ha recept, egyből oda visz
    }

    // Visszatérünk a céllal, amerre irányítjuk a usert
    return { success: true, redirectUrl }

  } catch (error: any) {
    console.error('Create item error:', error)
    return { success: false, error: error.message }
  }
}
