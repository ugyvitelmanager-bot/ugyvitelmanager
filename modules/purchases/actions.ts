'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type PurchaseItemInput = {
  product_id: string
  quantity: number
  unit_id: string
  unit_price_net: number // Forintban kapjuk, fillérré konvertáljuk
}

export async function recordPurchase(
  date: string,
  supplierName: string,
  invoiceNumber: string,
  paymentMethod: 'cash_daily' | 'cash_petty' | 'bank_transfer' | 'member_loan_cash',
  items: PurchaseItemInput[],
  totalNet: number // Forintban kapjuk
) {
  try {
    const supabase = await createClient()

    // 1–4. Purchases fej + tételek + készlet + ár atomikus mentése RPC-n keresztül
    const { data: purchaseId, error: coreError } = await supabase
      .rpc('record_purchase_core', {
        p_date: date,
        p_supplier_name: supplierName,
        p_invoice_number: invoiceNumber || null,
        p_payment_method: paymentMethod,
        p_total_net: Math.round(totalNet * 100),
        p_items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_id: item.unit_id,
          unit_price_net: Math.round(item.unit_price_net * 100)
        }))
      })

    if (coreError || !purchaseId) throw coreError || new Error('Hiba a vásárlás rögzítésekor.')

    // 3. Pénztári mozgás generálása (ha KP vagy Tagi kölcsön)
    if (paymentMethod !== 'bank_transfer') {
      let source = 'daily_kassza'
      let note = `Beszerzés: ${supplierName}${invoiceNumber ? ' (' + invoiceNumber + ')' : ''}`

      if (paymentMethod === 'cash_petty') source = 'petty_cash'
      if (paymentMethod === 'member_loan_cash') {
        source = 'petty_cash'
        note += ' - Tagi kölcsönből finanszírozva'

        // Előbb bevételezzük a tagi kölcsönt a pénztárba
        const { error: loanError } = await (supabase.from('cash_transactions') as any).insert({
          date,
          amount: Math.round(totalNet * 100),
          type: 'loan_in',
          source: 'petty_cash',
          note: `Tagi kölcsön beszerzéshez: ${supplierName}`,
          purchase_id: purchaseId
        })

        if (loanError) throw loanError
      }

      const { error: expenseError } = await (supabase.from('cash_transactions') as any).insert({
        date,
        amount: Math.round(totalNet * 100),
        type: 'expense',
        source,
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
