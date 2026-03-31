// Read-only összesítő — server-kompatibilis pure display
import { formatFt } from '../lib/calculations'
import type { DailySummary } from '../types'

interface Props {
  summary: DailySummary
  memberLoan: number
}

export function NapiEgyenlegBlock({ summary, memberLoan }: Props) {
  const isPositive = summary.net_balance >= 0
  const hasLoan = memberLoan > 0

  return (
    <div
      className={`rounded-xl p-5 border ${
        isPositive
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
        📊 Napi összesítő
      </h3>

      <div className="space-y-1.5 mb-4">
        <SummaryRow label="Összes PG bevétel" value={summary.total_pg} />
        <SummaryRow label="KP-ban fizetett beszerzeések" value={-summary.cash_purchases_total} negative />
        {summary.other_expenses_total > 0 && (
          <SummaryRow label="Egyéb kiadások" value={-summary.other_expenses_total} negative />
        )}
      </div>

      <div
        className={`rounded-lg p-4 border ${
          isPositive ? 'bg-white border-emerald-200' : 'bg-white border-red-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className={`text-xs font-bold uppercase tracking-wider ${
                isPositive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              Napi működési egyenleg
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              PG bevétel − KP kiadások alapján
            </p>
          </div>
          <div className="text-right">
            <span
              className={`text-2xl font-black font-mono ${
                isPositive ? 'text-emerald-700' : 'text-red-600'
              }`}
            >
              {isPositive ? '+' : ''}{formatFt(summary.net_balance)}
            </span>
            <span className="ml-2 text-lg">{isPositive ? '✅' : '❌'}</span>
          </div>
        </div>
      </div>

      {hasLoan && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3 flex items-center justify-between">
          <span className="text-sm font-bold text-amber-700">⚠ Tagi kölcsön befizetés</span>
          <span className="font-mono font-bold text-amber-700">+{formatFt(memberLoan)}</span>
        </div>
      )}

      {!isPositive && !hasLoan && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-300 p-3">
          <p className="text-sm text-amber-700 font-medium">
            ⚠ Negatív egyenleg — volt tagi kölcsön ma?
          </p>
        </div>
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  negative,
}: {
  label: string
  value: number
  negative?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-slate-600">{label}</span>
      <span
        className={`font-mono text-sm ${
          negative ? 'text-red-600' : 'text-slate-700'
        }`}
      >
        {negative && value < 0 ? '' : negative ? '−' : ''}{formatFt(Math.abs(value))}
      </span>
    </div>
  )
}
