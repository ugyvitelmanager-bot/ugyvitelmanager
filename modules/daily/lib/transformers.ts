// DB rekord → form state konverzió (pure helper, nem server action)
import type { DailyClosingFormData } from '../types'
import { EMPTY_FORM_DATA } from './calculations'

function fillerToFt(filler: number): number {
  return Math.round(filler / 100)
}

export function dbToFormData(closing: any): DailyClosingFormData {
  if (!closing) return EMPTY_FORM_DATA

  const expenses = ((closing.daily_closing_expenses as any[]) || [])
    .sort((a: any, b: any) => a.sort_order - b.sort_order)
    .map((e: any, i: number) => ({
      id: e.id as string,
      amount: fillerToFt(e.amount || 0),
      note: e.note || '',
      sort_order: i,
    }))

  return {
    halas_27:            fillerToFt(closing.halas_27 || 0),
    halas_18:            fillerToFt(closing.halas_18 || 0),
    halas_am:            fillerToFt(closing.halas_am || 0),
    bufe_27:             fillerToFt(closing.bufe_27 || 0),
    bufe_5:              fillerToFt(closing.bufe_5 || 0),
    bufe_am:             fillerToFt(closing.bufe_am || 0),
    halas_bk_terminal:   fillerToFt(closing.halas_bk_terminal || 0),
    bufe_bk_terminal:    fillerToFt(closing.bufe_bk_terminal || 0),
    member_loan:         fillerToFt(closing.member_loan || 0),
    member_loan_note:    closing.member_loan_note || '',
    petty_cash_movement: fillerToFt(closing.petty_cash_movement || 0),
    petty_cash_note:     closing.petty_cash_note || '',
    notes:               closing.notes || '',
    expenses,
  }
}
