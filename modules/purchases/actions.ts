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

    // 1. Beszerzési fej mentése
    const { data: purchase, error: purchaseError } = await (supabase.from('purchases') as any)
      .insert({
        date,
        supplier_name: supplierName,
        invoice_number: invoiceNumber,
        payment_method: paymentMethod,
        total_net: Math.round(totalNet * 100) // Fillérben tárolunk
      })
      .select('id')
      .single()

    if (purchaseError || !purchase) throw purchaseError || new Error('Hiba a beszerzési fej rögzítésekor.')

    // 2. Tételek mentése és Készlet/Ár frissítése
    for (const item of items) {
      const unitPriceFiller = Math.round(item.unit_price_net * 100)
      const lineTotalFiller = Math.round(item.quantity * unitPriceFiller)

      const { error: itemError } = await (supabase.from('purchase_items') as any).insert({
        purchase_id: purchase.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_id: item.unit_id,
        unit_price_net: unitPriceFiller,
        total_net: lineTotalFiller
      })

      if (itemError) throw itemError

      // Készlet és Utolsó ár frissítése a terméknél
      // Megjegyzés: SQL-ben kényelmesebb lenne, de a Supabase SDK-val inkrementálunk
      const { data: product } = await supabase.from('products').select('current_stock').eq('id', item.product_id).single()
      const currentStock = (product as any)?.current_stock || 0

      await (supabase.from('products') as any)
        .update({
          current_stock: Number(currentStock) + Number(item.quantity),
          purchase_price_net: unitPriceFiller,
          updated_at: new Date().toISOString()
        })
        .eq('id', item.product_id)
    }

    // 3. Pénztári mozgás generálása (ha KP vagy Tagi kölcsön)
    if (paymentMethod !== 'bank_transfer') {
      let type = 'expense'
      let source = 'daily_kassza'
      let note = `Beszerzés: ${supplierName}${invoiceNumber ? ' (' + invoiceNumber + ')' : ''}`

      if (paymentMethod === 'cash_petty') source = 'petty_cash'
      if (paymentMethod === 'member_loan_cash') {
        source = 'petty_cash'
        note += ' - Tagi kölcsönből finanszírozva'
        
        // Előbb bevételezzük a tagi kölcsönt a pénztárba
        await (supabase.from('cash_transactions') as any).insert({
          date,
          amount: Math.round(totalNet * 100),
          type: 'loan_in',
          source: 'petty_cash',
          note: `Tagi kölcsön beszerzéshez: ${supplierName}`,
          purchase_id: purchase.id
        })
      }

      await (supabase.from('cash_transactions') as any).insert({
        date,
        amount: Math.round(totalNet * 100),
        type: 'expense',
        source,
        note,
        purchase_id: purchase.id
      })
    }

    revalidatePath('/beszerzes')
    revalidatePath('/products')
    revalidatePath('/penztar')
    revalidatePath('/recipes')

    return { success: true, id: purchase.id }
  } catch (error: any) {
    console.error('Record purchase error:', error)
    return { success: false, error: error.message }
  }
}
