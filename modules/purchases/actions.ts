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

// ---------------------------------------------------------------------------
// importPurchaseHeaders — XLSX importból érkező több fejléc egyszerre
// Ugyanaz a logika mint recordPurchaseHeader, sorban hívva.
// Visszaad: { imported, errors[] }
// ---------------------------------------------------------------------------

export interface ImportRow {
  invoiceNumber: string
  supplierName: string
  performanceDate: string
  invoiceDate: string
  dueDate: string
  netAmount: number       // Ft
  vatAmount: number       // Ft
  grossAmount: number     // Ft
  paymentMethod: 'cash' | 'bank_transfer' | 'card'
}

export async function importPurchaseHeaders(
  rows: ImportRow[]
): Promise<{ imported: number; errors: string[] }> {
  const supabase = await createClient()
  let imported = 0
  const errors: string[] = []

  for (const row of rows) {
    try {
      const date = row.performanceDate || row.invoiceDate || new Date().toISOString().split('T')[0]

      const { data: purchaseId, error } = await (supabase as any).rpc('record_purchase_header', {
        p_date:             date,
        p_supplier_name:    row.supplierName,
        p_invoice_number:   row.invoiceNumber || null,
        p_payment_method:   row.paymentMethod,
        p_net_amount:       Math.round(row.netAmount * 100),
        p_vat_amount:       Math.round(row.vatAmount * 100),
        p_gross_amount:     Math.round(row.grossAmount * 100),
        p_performance_date: row.performanceDate || null,
        p_invoice_date:     row.invoiceDate || null,
        p_due_date:         row.dueDate || null,
      })

      if (error || !purchaseId) throw error || new Error('Ismeretlen hiba')

      if (row.paymentMethod === 'cash') {
        const note = `Beszerzés: ${row.supplierName}${row.invoiceNumber ? ' (' + row.invoiceNumber + ')' : ''}`
        await (supabase.from('cash_transactions') as any).insert({
          date,
          amount: Math.round(row.grossAmount * 100),
          type: 'expense',
          source: 'petty_cash',
          note,
          purchase_id: purchaseId,
        })
      }

      imported++
    } catch (err: any) {
      errors.push(`${row.invoiceNumber || row.supplierName}: ${err?.message ?? 'Ismeretlen hiba'}`)
    }
  }

  revalidatePath('/beszerzes')
  revalidatePath('/penztar')

  return { imported, errors }
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
  totalNet: number, // Forintban kapjuk
  // Opcionális extra fejléc mezők — könyvelési adatok
  extraHeader?: {
    vatAmountFt: number
    grossAmountFt: number
    performanceDate: string | null
    invoiceDate: string | null
    dueDate: string | null
  }
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

    // Extra fejléc mezők mentése (vat, gross, dátumok) ha meg lettek adva
    if (extraHeader) {
      await (supabase.from('purchases') as any)
        .update({
          vat_amount:       extraHeader.vatAmountFt > 0 ? Math.round(extraHeader.vatAmountFt * 100) : null,
          gross_amount:     extraHeader.grossAmountFt > 0 ? Math.round(extraHeader.grossAmountFt * 100) : null,
          performance_date: extraHeader.performanceDate || null,
          invoice_date:     extraHeader.invoiceDate || null,
          due_date:         extraHeader.dueDate || null,
        })
        .eq('id', purchaseId)
    }

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
