'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type RecordPurchaseCoreArgs = Database['public']['Functions']['record_purchase_core']['Args']

export type PurchaseItemInput =
  | {
      kind: 'product'
      product_id: string
      quantity: number
      unit_id: string
      unit_price_net: number // Forintban kapjuk, fillérré konvertáljuk
    }
  | {
      kind: 'cost'
      description: string
      unit_price_net: number // Forintban kapjuk, fillérré konvertáljuk
    }

export async function recordPurchase(
  date: string,
  supplierName: string,
  invoiceNumber: string,
  paymentMethod: 'cash' | 'bank_transfer',
  items: PurchaseItemInput[],
  totalNet: number // Forintban kapjuk
) {
  try {
    const supabase = await createClient()

    // RPC-nek küldött items: termék sorok teljes adattal, cost sorok product_id=null + description
    const rpcItems = items.map(item => {
      if (item.kind === 'product') {
        return {
          product_id: item.product_id,
          quantity: item.quantity,
          unit_id: item.unit_id,
          unit_price_net: Math.round(item.unit_price_net * 100),
        }
      } else {
        return {
          product_id: null,
          description: item.description,
          quantity: 1,
          unit_id: null,
          unit_price_net: Math.round(item.unit_price_net * 100),
        }
      }
    })

    const rpcArgs: RecordPurchaseCoreArgs = {
      p_date: date,
      p_supplier_name: supplierName,
      p_invoice_number: invoiceNumber || null,
      p_payment_method: paymentMethod,
      p_total_net: Math.round(totalNet * 100),
      p_items: rpcItems as any,
    }

    // TODO: remove (as any) cast when @supabase/ssr generics fully propagate Functions type
    const { data: purchaseId, error: coreError } = await (supabase as any)
      .rpc('record_purchase_core', rpcArgs)

    if (coreError || !purchaseId) throw coreError || new Error('Hiba a vásárlás rögzítésekor.')

    // Pénztári mozgás generálása (ha KP)
    if (paymentMethod === 'cash') {
      const note = `Beszerzés: ${supplierName}${invoiceNumber ? ' (' + invoiceNumber + ')' : ''}`

      const { error: expenseError } = await (supabase.from('cash_transactions') as any).insert({
        date,
        amount: Math.round(totalNet * 100),
        type: 'expense',
        source: 'petty_cash',
        note,
        purchase_id: purchaseId
      })

      if (expenseError) throw expenseError
    }

    revalidatePath('/beszerzes')
    revalidatePath('/products')
    revalidatePath('/penztar')
    revalidatePath('/recipes')

    return { success: true, id: purchaseId }
  } catch (error: any) {
    console.error('Record purchase error:', error)
    return { success: false, error: error.message }
  }
}
