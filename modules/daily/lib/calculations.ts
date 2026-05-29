// ============================================================
// Napi elszámolás — pure számítási függvények
// Nincs import más modulokból, nincs mellékhatás
// Minden érték Forintban (form state)
// ============================================================

import type { DailyClosingFormData, DailySummary } from '../types'

export function calculateDailySummary(
  data: DailyClosingFormData,
  cashPurchasesTotalFt: number,
  openingCashBalance: number = 0
): DailySummary {
  // PG összesítők
  const halas_pg_total = data.halas_27 + data.halas_18 + data.halas_5 + data.halas_am
  const bufe_pg_total  = data.bufe_27  + data.bufe_18  + data.bufe_5  + data.bufe_am
  const total_pg       = halas_pg_total + bufe_pg_total

  // PG fizetési mód összesítők (explicit, PG szerint)
  const total_pg_cash = data.halas_pg_cash + data.bufe_pg_cash
  const total_pg_card = data.halas_pg_card + data.bufe_pg_card

  // PG egyezés ellenőrzés: pg_total − (pg_cash + pg_card)
  const halas_pg_diff = halas_pg_total - (data.halas_pg_cash + data.halas_pg_card)
  const bufe_pg_diff  = bufe_pg_total  - (data.bufe_pg_cash  + data.bufe_pg_card)

  // BK eltérés: PG szerint BK − terminál tényleges
  const halas_bk_diff = data.halas_pg_card - data.halas_terminal_card
  const bufe_bk_diff  = data.bufe_pg_card  - data.bufe_terminal_card

  // Terminál összesítő
  const total_bk = data.halas_terminal_card + data.bufe_terminal_card
  const total_kp = total_pg_cash

  // ÁFA bontás
  const total_27 = data.halas_27 + data.bufe_27
  const total_18 = data.halas_18 + data.bufe_18
  const total_5  = data.halas_5  + data.bufe_5
  const total_am = data.halas_am + data.bufe_am

  // Kiadások
  const other_expenses_total = data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const total_expenses = cashPurchasesTotalFt + other_expenses_total

  // Egyenleg
  const net_balance = total_pg - total_expenses

  // Várható KP záróállás (nyitókészlet + mai mozgások)
  const expected_cash_closing =
    openingCashBalance
    + total_pg_cash
    + data.member_loan
    - cashPurchasesTotalFt
    - other_expenses_total
    - data.petty_cash_movement

  return {
    halas_pg_total,
    bufe_pg_total,
    total_pg,
    total_pg_cash,
    total_pg_card,
    halas_pg_diff,
    bufe_pg_diff,
    halas_bk_diff,
    bufe_bk_diff,
    total_bk,
    total_kp,
    total_27,
    total_18,
    total_5,
    total_am,
    other_expenses_total,
    cash_purchases_total: cashPurchasesTotalFt,
    total_expenses,
    net_balance,
    opening_cash_balance: openingCashBalance,
    expected_cash_closing,
  }
}

// ── Shared HP balance helper ─────────────────────────────────

interface HpClosingRow {
  date: string
  halas_pg_cash: number | null
  bufe_pg_cash: number | null
  member_loan: number | null
  petty_cash_movement: number | null
  daily_closing_expenses: Array<{ amount: number | null }>
}

/**
 * Kumulatív házipénztár egyenleg kiszámítása raw DB sorokból.
 * Bemenetek fillérben (DB formátum), cashPurchasesByDate Ft-ban.
 * Kimenet: egyenleg Ft-ban.
 */
export function computeRunningHpBalance(
  closings: HpClosingRow[],
  cashPurchasesByDate: Record<string, number>, // date → Ft
): number {
  let balance = 0
  for (const c of closings) {
    const pgCash   = Math.round(((c.halas_pg_cash || 0) + (c.bufe_pg_cash || 0)) / 100)
    const loan     = Math.round((c.member_loan || 0) / 100)
    const expenses = (c.daily_closing_expenses || []).reduce(
      (s, e) => s + Math.round((e.amount || 0) / 100), 0,
    )
    const petty    = Math.round((c.petty_cash_movement || 0) / 100)
    balance += pgCash + loan - (cashPurchasesByDate[c.date] || 0) - expenses - petty
  }
  return balance
}

/**
 * Forint összeg formázása — pl. 45 200 Ft.
 * Input: forint (NEM fillér). A daily modul számításai Ft-ban dolgoznak.
 * Ha fillér értéked van, konvertálj előbb: formatFt(filler / 100)
 * Lásd még: formatCurrency() @ lib/finance.ts — az filléret vár, nem forintot.
 */
export function formatFt(forint: number): string {
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    maximumFractionDigits: 0,
  }).format(Math.round(forint))
}

/** Üres form alapértékek */
export const EMPTY_FORM_DATA: DailyClosingFormData = {
  halas_27: 0,
  halas_18: 0,
  halas_5: 0,
  halas_am: 0,
  halas_pg_cash: 0,
  halas_pg_card: 0,
  halas_terminal_card: 0,
  bufe_27: 0,
  bufe_18: 0,
  bufe_5: 0,
  bufe_am: 0,
  bufe_pg_cash: 0,
  bufe_pg_card: 0,
  bufe_terminal_card: 0,
  member_loan: 0,
  member_loan_note: '',
  petty_cash_movement: 0,
  petty_cash_note: '',
  expenses: [],
  notes: '',
}
