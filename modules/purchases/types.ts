export type PaymentMethod = 'cash' | 'bank_transfer' | 'card'

export interface PurchaseLineItem {
  id: string
  kind: 'product' | 'cost'
  // kind='product' mezők
  productId: string
  quantity: number
  unitId: string
  unitPrice: number   // Forintban, client-side
  // kind='cost' mezők
  description: string
  amount: number      // Forintban, client-side
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
  net_amount: number | null       // fejléc nettó (fillér) — null régi tételes bejegyzéseknél
  vat_amount: number | null       // fejléc ÁFA (fillér)
  gross_amount: number | null     // fejléc bruttó (fillér)
  performance_date: string | null
  invoice_date: string | null
  due_date: string | null
  purchase_line_items: { id: string }[]
}
