'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function recordCashTransaction(data: {
  date: string
  amount: number // Forintban
  type: 'expense' | 'income' | 'loan_in' | 'loan_out' | 'transfer'
  source: 'daily_kassza' | 'petty_cash'
  note?: string
}) {
  try {
    const supabase = await createClient()

    const { error } = await (supabase.from('cash_transactions') as any).insert({
      date: data.date,
      amount: Math.round(data.amount * 100),
      type: data.type,
      source: data.source,
      note: data.note
    })

    if (error) throw error

    revalidatePath('/penztar')
    revalidatePath('/bevetel')

    return { success: true }
  } catch (error: any) {
    console.error('Record cash transaction error:', error)
    return { success: false, error: error.message }
  }
}
