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
