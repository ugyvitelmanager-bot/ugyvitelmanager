'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface RecipeItemPayload {
  ingredient_product_id: string
  quantity: number // This quantity will correspond to whatever unit we display (e.g. grams)
  unit_id: string
}

export async function saveRecipeItems(
  recipeId: string, 
  productId: string, 
  items: RecipeItemPayload[], 
  totalNetCost: number // The calculated total material cost in fillér
) {
  try {
    const supabase = await createClient()

    // 1. Töröljük a meglévő receptúra sorokat a recepthez
    const { error: deleteError } = await supabase
      .from('recipe_items')
      .delete()
      .eq('recipe_id', recipeId)

    if (deleteError) throw deleteError

    // 2. Szúrjuk be az újakat
    if (items.length > 0) {
      const { error: insertError } = await (supabase.from('recipe_items') as any)
        .insert(
          items.map(item => ({
            recipe_id: recipeId,
            ingredient_product_id: item.ingredient_product_id,
            quantity: item.quantity,
            unit_id: item.unit_id
          }))
        )
      
      if (insertError) throw insertError
    }

    // 3. Frissítsük az éles termék (Étlap elem) nettó beszerzési árát!
    const { error: updateProductError } = await (supabase.from('products') as any)
      .update({ 
        purchase_price_net: Math.round(totalNetCost),
        updated_at: new Date().toISOString()
      })
      .eq('id', productId)

    if (updateProductError) throw updateProductError

    // Érvényesítsük a cache-eket a releváns oldalakon
    revalidatePath(`/recipes/${recipeId}`)
    revalidatePath(`/recipes`)
    revalidatePath(`/etlap/${productId}`)
    revalidatePath(`/etlap`)

    return { success: true }
  } catch (error: any) {
    console.error('Recipe save error:', error)
    return { success: false, error: error.message }
  }
}
