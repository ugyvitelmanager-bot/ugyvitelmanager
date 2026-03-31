'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PaymentMethodSelect } from './PaymentMethodSelect'
import type { PurchaseFormState, PaymentMethod } from '../types'

interface Props {
  state: PurchaseFormState
  onDateChange: (v: string) => void
  onSupplierChange: (v: string) => void
  onInvoiceChange: (v: string) => void
  onPaymentChange: (v: PaymentMethod) => void
}

export function PurchaseForm({
  state,
  onDateChange,
  onSupplierChange,
  onInvoiceChange,
  onPaymentChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50/60 p-4 rounded-lg border border-slate-100">
      <div className="space-y-2">
        <Label htmlFor="date">Dátum</Label>
        <Input
          id="date"
          type="date"
          value={state.date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="supplier">Beszállító</Label>
        <Input
          id="supplier"
          placeholder="Pl. METRO, Pek-Snack..."
          value={state.supplier}
          onChange={(e) => onSupplierChange(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoice">Bizonylatszám</Label>
        <Input
          id="invoice"
          placeholder="Számlaszám (opcionális)"
          value={state.invoiceNumber}
          onChange={(e) => onInvoiceChange(e.target.value)}
        />
      </div>

      <PaymentMethodSelect value={state.paymentMethod} onChange={onPaymentChange} />
    </div>
  )
}
