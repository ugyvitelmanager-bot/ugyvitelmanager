'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

export async function deletePurchase(purchaseId: string) {
  try {
    const supabase = await createClient()

    // Ha volt KP tranzakció hozzá, azt is töröljük
    await (supabase.from('cash_transactions') as any)
      .delete()
      .eq('purchase_id', purchaseId)

    const { error } = await (supabase.from('purchases') as any)
      .delete()
      .eq('id', purchaseId)

    if (error) throw error

    revalidatePath('/beszerzes')
    revalidatePath('/penztar')
    revalidatePath('/products')

    return { success: true }
  } catch (error: any) {
    console.error('Delete purchase error:', error)
    return { success: false, error: error.message }
  }
}

export async function updatePurchaseHeader(
  purchaseId: string,
  date: string,
  supplierName: string,
  invoiceNumber: string,
  paymentMethod: 'cash' | 'bank_transfer'
) {
  try {
    const supabase = await createClient()

    const { error } = await (supabase.from('purchases') as any)
      .update({
        date,
        supplier_name: supplierName,
        invoice_number: invoiceNumber || null,
        payment_method: paymentMethod,
      })
      .eq('id', purchaseId)

    if (error) throw error

    // Ha KP tranzakció is van hozzá, frissítjük a megjegyzését és dátumát
    await (supabase.from('cash_transactions') as any)
      .update({
        date,
        note: `Beszerzés: ${supplierName}${invoiceNumber ? ' (' + invoiceNumber + ')' : ''}`,
      })
      .eq('purchase_id', purchaseId)

    revalidatePath('/beszerzes')
    revalidatePath('/penztar')

    return { success: true }
  } catch (error: any) {
    console.error('Update purchase error:', error)
    return { success: false, error: error.message }
  }
}

// ---------------------------------------------------------------------------
// recordPurchaseHeader — gyors rögzítés: csak fejléc, nincs tételsor
// A cash_transaction itt jön létre (gross_amount, mert azt fizetik ki tényleg).
// Tételsorok utólag adhatók hozzá: applyPurchaseLineItems
// ---------------------------------------------------------------------------

export async function recordPurchaseHeader(
  date: string,
  supplierName: string,
  invoiceNumber: string,
  paymentMethod: 'cash' | 'bank_transfer',
  netAmountFt: number,
  vatAmountFt: number,
  grossAmountFt: number,
  performanceDate: string | null,
  invoiceDate: string | null,
  dueDate: string | null,
) {
  try {
    const supabase = await createClient()

    const { data: purchaseId, error } = await (supabase as any).rpc('record_purchase_header', {
      p_date: date,
      p_supplier_name: supplierName,
      p_invoice_number: invoiceNumber || null,
      p_payment_method: paymentMethod,
      p_net_amount: Math.round(netAmountFt * 100),
      p_vat_amount: Math.round(vatAmountFt * 100),
      p_gross_amount: Math.round(grossAmountFt * 100),
      p_performance_date: performanceDate || null,
      p_invoice_date: invoiceDate || null,
      p_due_date: dueDate || null,
    })

    if (error || !purchaseId) throw error || new Error('Hiba a fejléc rögzítésekor.')

    if (paymentMethod === 'cash') {
      const note = `Beszerzés: ${supplierName}${invoiceNumber ? ' (' + invoiceNumber + ')' : ''}`
      const { error: cashError } = await (supabase.from('cash_transactions') as any).insert({
        date,
        amount: Math.round(grossAmountFt * 100), // bruttó megy ki ténylegesen a pénztárból
        type: 'expense',
        source: 'petty_cash',
        note,
        purchase_id: purchaseId,
      })
      if (cashError) throw cashError
    }

    revalidatePath('/beszerzes')
    revalidatePath('/penztar')

    return { success: true, id: purchaseId as string }
  } catch (error: any) {
    console.error('Record purchase header error:', error)
    return { success: false, error: error.message }
  }
}

// ---------------------------------------------------------------------------
// applyPurchaseLineItems — idempotens tételsor csere meglévő purchase-hez
// NEM hoz létre cash_transaction-t. Csak készlet + ár frissítés.
// ---------------------------------------------------------------------------

export async function applyPurchaseLineItems(
  purchaseId: string,
  items: PurchaseItemInput[],
) {
  try {
    const supabase = await createClient()

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

    const { error } = await (supabase as any).rpc('apply_purchase_line_items', {
      p_purchase_id: purchaseId,
      p_items: rpcItems,
    })

    if (error) throw error

    revalidatePath('/beszerzes')
    revalidatePath('/products')
    revalidatePath('/recipes')

    return { success: true }
  } catch (error: any) {
    console.error('Apply purchase line items error:', error)
    return { success: false, error: error.message }
  }
}

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
