// ============================================================
// Napi elszámolás — TypeScript típusok
// Minden form érték Forintban (integer), DB fillérben tárolja
// ============================================================

export type DailyClosingStatus = 'draft' | 'final'

export interface DailyClosingExpenseItem {
  id?: string
  amount: number   // Forint a form state-ben
  note: string
  sort_order: number
}

export interface DailyClosingFormData {
  // HALAS pénztárgép (AP A17710081) — adónem bontás
  halas_27: number
  halas_18: number
  halas_am: number
  // HALAS fizetési mód bontás (PG szerint)
  halas_pg_cash: number
  halas_pg_card: number
  // HALAS terminál tényleges zárás
  halas_terminal_card: number
  // BÜFÉ pénztárgép (AP A19202513) — adónem bontás
  bufe_27: number
  bufe_5: number
  bufe_am: number
  // BÜFÉ fizetési mód bontás (PG szerint)
  bufe_pg_cash: number
  bufe_pg_card: number
  // BÜFÉ terminál tényleges zárás
  bufe_terminal_card: number
  // Tagi kölcsön
  member_loan: number
  member_loan_note: string
  // Házipénztár mozgás
  petty_cash_movement: number
  petty_cash_note: string
  // Egyéb kiadások (mini-lista)
  expenses: DailyClosingExpenseItem[]
  // Meta
  notes: string
}

export interface DailySummary {
  // PG összesítők (Forint)
  halas_pg_total: number
  bufe_pg_total: number
  total_pg: number
  // PG fizetési mód összesítők (explicit, PG szerint)
  total_pg_cash: number         // halas_pg_cash + bufe_pg_cash
  total_pg_card: number         // halas_pg_card + bufe_pg_card
  // PG egyezés ellenőrzés: pg_total − (pg_cash + pg_card); 0 = OK
  halas_pg_diff: number
  bufe_pg_diff: number
  // BK eltérés: pg_card − terminal_card; 0 = OK
  halas_bk_diff: number
  bufe_bk_diff: number
  // Terminál összesítő (Forint)
  total_bk: number              // halas_terminal_card + bufe_terminal_card
  total_kp: number              // = total_pg_cash (alias)
  // ÁFA bontás könyveléshez (Forint)
  total_27: number
  total_18: number
  total_5: number
  total_am: number
  // Kiadások (Forint)
  other_expenses_total: number
  cash_purchases_total: number
  total_expenses: number
  // Egyenleg (Forint)
  net_balance: number
  expected_cash_closing: number
}

export interface CashPurchaseRecord {
  id: string
  date: string
  supplier_name: string
  total_net: number       // fillér a DB-ből
  payment_method: string
}

// Lista nézethez — szerver aggregálja
export interface DailyClosingListRow {
  id: string
  date: string
  status: DailyClosingStatus
  // Számolt értékek (Forint)
  halas_pg_total: number
  bufe_pg_total: number
  total_pg: number
  total_bk: number
  net_balance: number
  member_loan: number
  cash_purchases_total: number
  other_expenses_total: number
}
