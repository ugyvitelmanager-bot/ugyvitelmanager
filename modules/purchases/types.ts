export type PaymentMethod = 'cash_daily' | 'cash_petty' | 'bank_transfer' | 'member_loan_cash'

export interface PurchaseLineItem {
  id: string          // local key only, not persisted
  productId: string
  quantity: number
  unitId: string
  unitPrice: number   // Forintban, client-side
}

export interface PurchaseFormState {
  date: string
  supplier: string
  invoiceNumber: string
  paymentMethod: PaymentMethod
  items: PurchaseLineItem[]
}

export interface ProductOption {
  id: string
  name: string
  unit_id: string
  unit_symbol: string
}

export interface UnitOption {
  id: string
  symbol: string
  name: string | null
}

export interface PurchaseRow {
  id: string
  date: string
  supplier_name: string
  invoice_number: string | null
  payment_method: string
  total_net: number
  purchase_line_items: { id: string }[]
}
