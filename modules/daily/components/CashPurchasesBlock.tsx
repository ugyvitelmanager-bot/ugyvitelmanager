// Server-kompatibilis pure display komponens
// ÁTMENETI: date alapján szűr, payment_method = KP típusok
// Hosszabb távon: payment_date + payment_status szűrés kellene

import { formatFt } from '../lib/calculations'
import { PAYMENT_METHOD_LABELS } from '../lib/labels'
import type { CashPurchaseRecord } from '../types'

interface Props {
  purchases: CashPurchaseRecord[]
  totalFt: number
}

export function CashPurchasesBlock({ purchases, totalFt }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-1">
        📦 KP-ban fizetett beszerzések
      </h3>
      <p className="text-[11px] text-slate-400 mb-4">
        Számla kelte alapján — átmeneti egyszerűsítés
      </p>

      {purchases.length === 0 ? (
        <p className="text-sm text-slate-400 italic">Nincs KP-ban fizetett beszerzés ezen a napon.</p>
      ) : (
        <div className="space-y-1.5 mb-3">
          {purchases.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="font-medium text-slate-700">{p.supplier_name}</span>
                <span className="ml-2 text-[11px] text-slate-400 uppercase tracking-wide">
                  {PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method}
                </span>
              </div>
              <span className="font-mono text-slate-600">
                −{formatFt(Math.round((p.gross_amount ?? p.total_net) / 100))}
              </span>
            </div>
          ))}
        </div>
      )}

      {purchases.length > 0 && (
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Összes KP beszerzés
          </span>
          <span className="font-mono font-bold text-slate-800">−{formatFt(totalFt)}</span>
        </div>
      )}
    </div>
  )
}
