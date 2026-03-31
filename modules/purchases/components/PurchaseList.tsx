import { formatCurrency } from '@/lib/finance'
import { ShoppingBag } from 'lucide-react'
import { PAYMENT_METHOD_LABELS } from '@/modules/daily/lib/labels'
import type { PurchaseRow } from '../types'

interface Props {
  purchases: PurchaseRow[]
  fromDate: string
}

const PAYMENT_STYLE: Record<string, { border: string; badge: string }> = {
  cash_daily:       { border: 'border-l-orange-400', badge: 'bg-orange-50 text-orange-700 border border-orange-200' },
  cash_petty:       { border: 'border-l-orange-400', badge: 'bg-orange-50 text-orange-700 border border-orange-200' },
  member_loan_cash: { border: 'border-l-blue-400',   badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
  bank_transfer:    { border: 'border-l-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
}

export function PurchaseList({ purchases, fromDate }: Props) {
  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
        <ShoppingBag className="w-10 h-10 opacity-20" />
        <p className="text-sm">Nincs rögzített beszerzés ebben az időszakban.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Fejléc */}
      <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="col-span-2">Dátum</div>
        <div className="col-span-4">Beszállító</div>
        <div className="col-span-3">Fizetés</div>
        <div className="col-span-1 text-center">Tételek</div>
        <div className="col-span-2 text-right">Összeg (Nettó)</div>
      </div>

      {/* Sorok */}
      <div className="divide-y divide-slate-100">
        {purchases.map((p) => {
          const style = PAYMENT_STYLE[p.payment_method] ?? PAYMENT_STYLE.bank_transfer
          const label = PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method
          const dateStr = new Date(p.date + 'T12:00:00').toLocaleDateString('hu-HU', {
            year: 'numeric', month: '2-digit', day: '2-digit'
          })

          return (
            <div
              key={p.id}
              className={`grid grid-cols-12 gap-2 px-4 py-3 items-center border-l-4 ${style.border} hover:bg-slate-50/50 transition-colors`}
            >
              <div className="col-span-2 text-sm font-medium text-slate-600 tabular-nums">
                {dateStr}
              </div>

              <div className="col-span-4">
                <p className="font-semibold text-slate-900 text-sm truncate">{p.supplier_name}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {p.invoice_number ?? '—'}
                </p>
              </div>

              <div className="col-span-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${style.badge}`}>
                  {label}
                </span>
              </div>

              <div className="col-span-1 text-center text-sm text-slate-500">
                {p.purchase_line_items.length}
              </div>

              <div className="col-span-2 text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                {formatCurrency(p.total_net)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Időablak jelzés */}
      <div className="px-4 py-2 bg-slate-50 border-t text-[11px] text-slate-400 text-right">
        {fromDate} óta · {purchases.length} bizonylat
      </div>
    </div>
  )
}
