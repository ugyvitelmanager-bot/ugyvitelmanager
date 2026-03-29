'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function recordDailyRevenue(data: {
  date: string
  business_area: 'buffet' | 'fish'
  z_total_gross: number
  terminal_total_gross: number
  cash_total_gross: number
  vat_5_gross: number
  vat_27_gross: number
  vat_0_gross: number
  note?: string
}) {
  try {
    const supabase = await createClient()

    const { error } = await (supabase.from('daily_reports') as any).insert({
      date: data.date,
      business_area: data.business_area,
      z_total_gross: Math.round(data.z_total_gross * 100),
      terminal_total_gross: Math.round(data.terminal_total_gross * 100),
      cash_total_gross: Math.round(data.cash_total_gross * 100),
      vat_5_gross: Math.round(data.vat_5_gross * 100),
      vat_27_gross: Math.round(data.vat_27_gross * 100),
      vat_0_gross: Math.round(data.vat_0_gross * 100),
      note: data.note
    })

    if (error) throw error

    // Ha rögzítettünk készpénzes bevételt, vigyük fel a napi kasszába is
    if (data.cash_total_gross > 0) {
      await (supabase.from('cash_transactions') as any).insert({
        date: data.date,
        amount: Math.round(data.cash_total_gross * 100),
        type: 'income',
        source: 'daily_kassza',
        note: `Napi bevétel (Z-szalag): ${data.business_area === 'fish' ? 'Halas' : 'Büfé'}`
      })
    }

    revalidatePath('/bevetel')
    revalidatePath('/penztar')

    return { success: true }
  } catch (error: any) {
    console.error('Record revenue error:', error)
    return { success: false, error: error.message }
  }
}
