// ============================================================
// Napi elszámolás — pure számítási függvények
// Nincs import más modulokból, nincs mellékhatás
// Minden érték Forintban (form state)
// ============================================================

import type { DailyClosingFormData, DailySummary } from '../types'

export function calculateDailySummary(
  data: DailyClosingFormData,
  cashPurchasesTotalFt: number
): DailySummary {
  // PG összesítők
  const halas_pg_total = data.halas_27 + data.halas_18 + data.halas_am
  const bufe_pg_total  = data.bufe_27  + data.bufe_5   + data.bufe_am
  const total_pg       = halas_pg_total + bufe_pg_total

  // Terminál / KP bontás
  const total_bk  = data.halas_bk_terminal + data.bufe_bk_terminal
  const halas_kp  = halas_pg_total - data.halas_bk_terminal
  const bufe_kp   = bufe_pg_total  - data.bufe_bk_terminal
  const total_kp  = halas_kp + bufe_kp

  // ÁFA bontás
  const total_27 = data.halas_27 + data.bufe_27
  const total_18 = data.halas_18
  const total_5  = data.bufe_5
  const total_am = data.halas_am + data.bufe_am

  // Kiadások
  const other_expenses_total = data.expenses.reduce((sum, e) => sum + (e.amount || 0), 0)
  const total_expenses = cashPurchasesTotalFt + other_expenses_total

  // Egyenleg
  const net_balance = total_pg - total_expenses

  // Várható KP záróállás
  const expected_cash_closing =
    total_kp
    + data.member_loan
    - cashPurchasesTotalFt
    - other_expenses_total
    + data.petty_cash_movement

  return {
    halas_pg_total,
    bufe_pg_total,
    total_pg,
    total_bk,
    halas_kp,
    bufe_kp,
    total_kp,
    total_27,
    total_18,
    total_5,
    total_am,
    other_expenses_total,
    cash_purchases_total: cashPurchasesTotalFt,
    total_expenses,
    net_balance,
    expected_cash_closing,
  }
}

/** Forint összeg formázása — pl. 45 200 Ft */
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
  halas_am: 0,
  bufe_27: 0,
  bufe_5: 0,
  bufe_am: 0,
  halas_bk_terminal: 0,
  bufe_bk_terminal: 0,
  member_loan: 0,
  member_loan_note: '',
  petty_cash_movement: 0,
  petty_cash_note: '',
  expenses: [],
  notes: '',
}
