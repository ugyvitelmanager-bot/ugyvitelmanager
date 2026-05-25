'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  DailyClosingFormData,
  DailyClosingStatus,
  CashPurchaseRecord,
} from './types'
import { CASH_PAYMENT_METHODS } from './lib/labels'
import { calculateDailySummary, computeRunningHpBalance } from './lib/calculations'

// ============================================================
// Konverziós segédfüggvény (privát)
// ============================================================

function ftToFiller(ft: number): number {
  return Math.round(ft * 100)
}

function fillerToFt(filler: number): number {
  return Math.round(filler / 100)
}

// ============================================================
// Lekérdezések
// ============================================================

/** Egyetlen nap betöltése + aznapi KP beszerzések + előző záróállás */
export async function getDailyClosing(date: string): Promise<{
  closing: any | null
  cashPurchases: CashPurchaseRecord[]
  prevCashClosing: number
}> {
  const supabase = await createClient()

  const [closingRes, purchasesRes, latestPrevStoredRes] = await Promise.all([
    supabase.from('daily_closings')
      .select('*, daily_closing_expenses(*)')
      .eq('date', date)
      .maybeSingle(),
    supabase.from('purchases')
      .select('id, date, supplier_name, total_net, gross_amount, payment_method')
      .eq('date', date)
      .in('payment_method', CASH_PAYMENT_METHODS),
    // Fast path: legutóbbi korábbi zárás tárolt egyenlege (O(1))
    supabase.from('daily_closings')
      .select('expected_cash_closing')
      .lt('date', date)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  let prevCashClosing: number

  if (latestPrevStoredRes.data?.expected_cash_closing != null) {
    // Fast path: tárolt érték alapján (O(1))
    prevCashClosing = Math.round(latestPrevStoredRes.data.expected_cash_closing / 100)
  } else {
    // Slow path: teljes lánc-számítás (régi rekordokhoz, amíg nincs tárolt érték)
    const [allPrevClosingsRes, allPrevPurchasesRes] = await Promise.all([
      supabase.from('daily_closings')
        .select('date, daily_closing_expenses(*), halas_pg_cash, bufe_pg_cash, member_loan, petty_cash_movement')
        .lt('date', date)
        .order('date', { ascending: true }),
      supabase.from('purchases')
        .select('date, total_net, gross_amount')
        .lt('date', date)
        .in('payment_method', CASH_PAYMENT_METHODS),
    ])
    const prevPurchasesByDate: Record<string, number> = {}
    for (const p of allPrevPurchasesRes.data || []) {
      const amountFiller = p.gross_amount ?? p.total_net ?? 0
      prevPurchasesByDate[p.date] = (prevPurchasesByDate[p.date] || 0) + Math.round(amountFiller / 100)
    }
    prevCashClosing = computeRunningHpBalance(
      (allPrevClosingsRes.data as any[]) || [],
      prevPurchasesByDate,
    )
  }

  return {
    closing: closingRes.data || null,
    cashPurchases: (purchasesRes.data as CashPurchaseRecord[]) || [],
    prevCashClosing,
  }
}

/** Hónap listájának lekérése aggregált adatokkal */
export async function getDailyClosings(year: number, month: number): Promise<{
  closings: any[]
  purchaseTotalsByDate: Record<string, number>
}> {
  const supabase = await createClient()

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const lastDay = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const [closingsRes, purchasesRes] = await Promise.all([
    supabase.from('daily_closings')
      .select('*, daily_closing_expenses(amount)')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false }),
    supabase.from('purchases')
      .select('date, total_net, gross_amount, payment_method')
      .gte('date', startDate)
      .lte('date', endDate)
      .in('payment_method', CASH_PAYMENT_METHODS),
  ])

  const closings = closingsRes.data || []
  const purchases = purchasesRes.data || []

  // Napi KP beszerzés összegek dátum szerint (Forintban) — bruttó ha van, fallback nettó
  const purchaseTotalsByDate: Record<string, number> = {}
  for (const p of purchases) {
    const amountFiller = p.gross_amount ?? p.total_net ?? 0
    purchaseTotalsByDate[p.date] =
      (purchaseTotalsByDate[p.date] || 0) + fillerToFt(amountFiller)
  }

  return { closings, purchaseTotalsByDate }
}

// ============================================================
// Mentés (upsert)
// ============================================================

/** Napi rekord mentése / frissítése */
export async function saveDailyClosing(
  date: string,
  formData: DailyClosingFormData,
  status: DailyClosingStatus
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient()
    const { expenses, ...fields } = formData

    // ── Expected cash closing kiszámítása ────────────────────
    // 1. Előző nap nyitóállása: tárolt érték ha van (O(1)), különben lánc (O(N))
    const { data: prevStoredRow } = await supabase.from('daily_closings')
      .select('expected_cash_closing')
      .lt('date', date)
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle()

    let openingFt: number
    if (prevStoredRow?.expected_cash_closing != null) {
      openingFt = Math.round(prevStoredRow.expected_cash_closing / 100)
    } else {
      // Fallback: teljes lánc-számítás (régi rekordokhoz)
      const [allPrevClosingsRes, allPrevPurchasesRes] = await Promise.all([
        supabase.from('daily_closings')
          .select('date, daily_closing_expenses(*), halas_pg_cash, bufe_pg_cash, member_loan, petty_cash_movement')
          .lt('date', date)
          .order('date', { ascending: true }),
        supabase.from('purchases')
          .select('date, total_net, gross_amount')
          .lt('date', date)
          .in('payment_method', CASH_PAYMENT_METHODS),
      ])
      const prevByDate: Record<string, number> = {}
      for (const p of allPrevPurchasesRes.data || []) {
        const amt = p.gross_amount ?? p.total_net ?? 0
        prevByDate[p.date] = (prevByDate[p.date] || 0) + Math.round(amt / 100)
      }
      openingFt = computeRunningHpBalance(
        (allPrevClosingsRes.data as any[]) || [],
        prevByDate,
      )
    }

    // 2. Mai KP vásárlások összege (bruttó ha van, fallback nettó)
    const { data: todayPurchasesRes } = await supabase.from('purchases')
      .select('gross_amount, total_net')
      .eq('date', date)
      .in('payment_method', CASH_PAYMENT_METHODS)

    const cashPurchasesFt = (todayPurchasesRes || []).reduce(
      (s, p) => s + Math.round((p.gross_amount ?? p.total_net ?? 0) / 100), 0,
    )

    // 3. Kiszámítás és konverzió fillérbe (mentéshez)
    const summary = calculateDailySummary(formData, cashPurchasesFt, openingFt)
    const expectedCashClosingFiller = Math.round(summary.expected_cash_closing * 100)

    // Upsert a fő rekordot (Forint → fillér)
    const { data: closing, error: closingError } = await supabase.from('daily_closings')
      .upsert(
        {
          date,
          halas_27:            ftToFiller(fields.halas_27),
          halas_18:            ftToFiller(fields.halas_18),
          halas_am:            ftToFiller(fields.halas_am),
          halas_pg_cash:       ftToFiller(fields.halas_pg_cash),
          halas_pg_card:       ftToFiller(fields.halas_pg_card),
          halas_terminal_card: ftToFiller(fields.halas_terminal_card),
          bufe_27:             ftToFiller(fields.bufe_27),
          bufe_5:              ftToFiller(fields.bufe_5),
          bufe_am:             ftToFiller(fields.bufe_am),
          bufe_pg_cash:        ftToFiller(fields.bufe_pg_cash),
          bufe_pg_card:        ftToFiller(fields.bufe_pg_card),
          bufe_terminal_card:  ftToFiller(fields.bufe_terminal_card),
          member_loan:         ftToFiller(fields.member_loan),
          member_loan_note:    fields.member_loan_note.trim() || null,
          petty_cash_movement: ftToFiller(fields.petty_cash_movement),
          petty_cash_note:     fields.petty_cash_note.trim() || null,
          notes:                  fields.notes.trim() || null,
          status,
          expected_cash_closing:  expectedCashClosingFiller,
          updated_at:             new Date().toISOString(),
        },
        { onConflict: 'date' }
      )
      .select('id')
      .single()

    if (closingError || !closing) {
      throw closingError || new Error('Mentési hiba: rekord nem jött vissza')
    }

    // Kiadások csere: töröl mindent, majd újra beszúr
    await supabase.from('daily_closing_expenses')
      .delete()
      .eq('daily_closing_id', closing.id)

    const validExpenses = expenses.filter(
      (e) => e.amount > 0 || e.note.trim().length > 0
    )

    if (validExpenses.length > 0) {
      const expenseRows = validExpenses.map((e, i) => ({
        daily_closing_id: closing.id,
        amount:     ftToFiller(e.amount),
        note:       e.note.trim(),
        sort_order: i,
      }))

      const { error: expError } = await supabase.from('daily_closing_expenses')
        .insert(expenseRows)

      if (expError) throw expError
    }

    revalidatePath('/napi-elszamolas')
    revalidatePath(`/napi-elszamolas/${date}`)
    return { success: true }
  } catch (error: any) {
    console.error('saveDailyClosing error:', error)
    return { success: false, error: error.message || 'Ismeretlen hiba a mentés során' }
  }
}

