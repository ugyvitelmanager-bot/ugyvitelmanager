'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import type { PaymentMethod } from '../types'
import { PAYMENT_METHOD_LABELS, CASH_PAYMENT_METHODS } from '@/modules/daily/lib/labels'

interface Props {
  value: PaymentMethod
  onChange: (value: PaymentMethod) => void
}

const isCash = (method: PaymentMethod) =>
  (CASH_PAYMENT_METHODS as readonly string[]).includes(method)

const paymentItems = Object.fromEntries(Object.entries(PAYMENT_METHOD_LABELS))

export function PaymentMethodSelect({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <Label htmlFor="payment">Kifizetés módja</Label>
      <Select
        value={value}
        onValueChange={(v: string | null) => v && onChange(v as PaymentMethod)}
        items={paymentItems}
      >
        <SelectTrigger id="payment" className="bg-white">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(PAYMENT_METHOD_LABELS) as [PaymentMethod, string][]).map(([key, label]) => (
            <SelectItem key={key} value={key}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className={`text-[11px] ${isCash(value) ? 'text-orange-600' : 'text-slate-400'}`}>
        {isCash(value)
          ? '→ Megjelenik a napi KP elszámolásban'
          : '→ Nem része a napi KP elszámolásnak'}
      </p>
    </div>
  )
}
