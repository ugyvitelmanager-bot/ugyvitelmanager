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
  categoryId?: string | null,
  productType: 'ingredient' | 'recipe_product' | 'stock_product' = 'stock_product',
  vatRateId?: string | null,
  unitId?: string | null
) {
  try {
    const supabase = await createClient()

    // 1. Alapértelmezett kategória ha nincs megadva
    let finalCategoryId = categoryId
    if (!finalCategoryId) {
      const { data: catRaw } = await supabase.from('categories').select('id').eq('category_type', 'product').limit(1).single()
      const cat = catRaw as { id: string } | null
      finalCategoryId = cat?.id || null
    }

    // 2. Alapértelmezett ÁFA ha nincs megadva (lehetőleg a 27%-os)
    let finalVatRateId = vatRateId
    if (!finalVatRateId) {
      const { data: vatRaw } = await supabase.from('vat_rates').select('id, name')
      const vats = (vatRaw as any[]) || []
      finalVatRateId = vats.find(v => v.name === '27%')?.id || (vats.length > 0 ? vats[0].id : null)
    }

    // 3. Mértékegység: ha explicit meg van adva, azt használjuk; egyébként típus szerint auto
    let selectedUnitId: string | null = unitId ?? null
    if (!selectedUnitId) {
      const { data: unitsRaw } = await supabase.from('units').select('id, symbol').in('symbol', ['adag', 'db'])
      const units = (unitsRaw as any[]) || []
      const adagUnit = units.find(u => u.symbol === 'adag')?.id
      const dbUnit = units.find(u => u.symbol === 'db')?.id
      selectedUnitId = productType === 'recipe_product' ? adagUnit : (dbUnit ?? (units.length > 0 ? units[0].id : null))
    }

    // 4. Termék létrehozása a Raktárban (Products tábla)
    const { data: product, error: insertError } = await (supabase.from('products') as any)
      .insert({
        name,
        category_id: finalCategoryId,
        product_type: productType,
        default_vat_rate_id: finalVatRateId,
        unit_id: selectedUnitId,
        purchase_price_net: 0,
        default_sale_price_gross: 0,
        is_mohu_fee: false
      })
      .select('id, name, unit_id')
      .single()

    if (insertError || !product) throw insertError || new Error('Hiba a termék létrehozása közben.')

    // 5. Ha saját készítésű (recept), akkor létrehozzuk az üres Receptet is
    let redirectUrl = `/etlap/${product.id}` // Alapból az árazóra visz (Viszonteladásnál)

    if (productType === 'ingredient') {
      redirectUrl = '/products' // Alapanyagnál visszavisz a raktárlistára
    } else if (productType === 'recipe_product') {
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

    // Visszatérünk a termékkel is, hogy a UI frissíthesse a listát
    return { success: true, redirectUrl, product: { id: product.id, name: product.name, unit_id: product.unit_id as string | null } }

  } catch (error: any) {
    console.error('Create item error:', error)
    return { success: false, error: error.message }
  }
}

export async function updateProductUnit(productId: string, unitId: string) {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from('products') as any).update({ unit_id: unitId }).eq('id', productId)
    if (error) throw error
    revalidatePath('/products')
    revalidatePath('/recipes')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleProductArchive(productId: string, isActive: boolean) {
  try {
    const supabase = await createClient()
    const { error } = await (supabase.from('products') as any).update({ is_active: isActive }).eq('id', productId)
    
    if (error) {
      if (error.code === '42703') { // undefined_column
        throw new Error('Hiányzó oszlop a Supabase-ben! Kérlek futtasd ezt az SQL-t: ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;')
      }
      throw error
    }
    
    // Ha recept, azt is archiváljuk
    const { data: recipe } = await supabase.from('recipes').select('id').eq('product_id', productId).single()
    if (recipe) {
      await (supabase.from('recipes') as any).update({ is_active: isActive }).eq('product_id', productId)
    }

    revalidatePath('/etlap')
    revalidatePath('/products')
    revalidatePath('/recipes')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
