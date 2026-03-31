// Server-kompatibilis pure display komponens
import Link from 'next/link'
import { PlusCircle } from 'lucide-react'
import { calculateDailySummary, formatFt } from '../lib/calculations'
import { CLOSING_STATUS_LABELS, CLOSING_STATUS_BADGE } from '../lib/labels'
import { dbToFormData } from '../lib/transformers'
import type { DailyClosingStatus } from '../types'

interface Props {
  closings: any[]
  purchaseTotalsByDate: Record<string, number>   // Forint per date
  year: number
  month: number
}

export function DailyReportList({ closings, purchaseTotalsByDate, year, month }: Props) {
  const closingByDate: Record<string, any> = {}
  for (const c of closings) {
    closingByDate[c.date] = c
  }

  // Hónap összes napja (az elszámolás bejegyzett napjait megmutatjuk)
  // Csak a meglévő rekordokat és a KP bszerzeéses napokat jelenítjük meg,
  // plusz az aktuális hónap napjait (üresként)
  const today = new Date()
  const lastDay = new Date(year, month, 0).getDate()
  const days: string[] = []
  for (let d = lastDay; d >= 1; d--) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    // Csak a múltbeli és mai napokat mutatjuk
    const dt = new Date(dateStr + 'T12:00:00')
    if (dt <= today) days.push(dateStr)
  }

  // Havi összesítők
  let monthTotalPg = 0
  let monthTotalBk = 0
  let monthNetBalance = 0
  let monthMemberLoan = 0
  let monthCashPurchases = 0

  const rows = days.map((date) => {
    const closing = closingByDate[date]
    const cashPurchasesFt = purchaseTotalsByDate[date] || 0

    if (!closing) {
      return { date, closing: null, summary: null, cashPurchasesFt }
    }

    const formData = dbToFormData(closing)
    const summary = calculateDailySummary(formData, cashPurchasesFt)

    monthTotalPg      += summary.total_pg
    monthTotalBk      += summary.total_bk
    monthNetBalance   += summary.net_balance
    monthMemberLoan   += formData.member_loan
    monthCashPurchases += cashPurchasesFt

    return { date, closing, summary, cashPurchasesFt, formData }
  })

  return (
    <div className="space-y-4">
      {/* Havi összesítő kártya */}
      {closings.length > 0 && (
        <div className="bg-slate-800 text-white rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Összes PG" value={formatFt(monthTotalPg)} />
          <StatCard label="KP bszerzeések" value={`−${formatFt(monthCashPurchases)}`} />
          <StatCard
            label="Havi egyenleg"
            value={(monthNetBalance >= 0 ? '+' : '') + formatFt(monthNetBalance)}
            highlight={monthNetBalance >= 0 ? 'green' : 'red'}
          />
          {monthMemberLoan > 0 && (
            <StatCard label="Tagi kölcsön" value={formatFt(monthMemberLoan)} highlight="amber" />
          )}
        </div>
      )}

      {/* Lista */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Dátum</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Halas PG</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Büfé PG</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">KP Bszerzeés</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Egyenleg</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600">Tagi</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-600">Státusz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(({ date, closing, summary, cashPurchasesFt, formData }) => {
                const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('hu-HU', {
                  month: 'short',
                  day: 'numeric',
                  weekday: 'short',
                })
                const isToday = date === today.toISOString().split('T')[0]
                const hasLoan = formData ? formData.member_loan > 0 : false
                const isNegative = summary ? summary.net_balance < 0 : false

                return (
                  <tr
                    key={date}
                    className={`hover:bg-slate-50 transition-colors ${hasLoan ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/napi-elszamolas/${date}`}
                        className="font-medium text-slate-700 hover:text-emerald-600 transition-colors"
                      >
                        {displayDate}
                        {isToday && (
                          <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold uppercase">
                            Ma
                          </span>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {summary ? formatFt(summary.halas_pg_total) : <EmptyCell />}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-600">
                      {summary ? formatFt(summary.bufe_pg_total) : <EmptyCell />}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">
                      {cashPurchasesFt > 0 ? `−${formatFt(cashPurchasesFt)}` : <EmptyCell />}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">
                      {summary ? (
                        <span className={isNegative ? 'text-red-600' : 'text-emerald-700'}>
                          {summary.net_balance >= 0 ? '+' : ''}{formatFt(summary.net_balance)}
                        </span>
                      ) : (
                        <EmptyCell />
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">
                      {hasLoan && formData ? (
                        <span className="text-amber-600 font-bold">{formatFt(formData.member_loan)}</span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {closing ? (
                        <Link href={`/napi-elszamolas/${date}`}>
                          <span
                            className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded ${
                              CLOSING_STATUS_BADGE[closing.status as DailyClosingStatus]
                            }`}
                          >
                            {CLOSING_STATUS_LABELS[closing.status as DailyClosingStatus]}
                          </span>
                        </Link>
                      ) : (
                        <Link
                          href={`/napi-elszamolas/${date}`}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-600 transition-colors"
                        >
                          <PlusCircle className="w-3 h-3" />
                          Rögzítés
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    Ebben a hónapban még nincsenek elszámolások.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function EmptyCell() {
  return <span className="text-slate-300">—</span>
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: 'green' | 'red' | 'amber'
}) {
  const colorClass =
    highlight === 'green'
      ? 'text-emerald-400'
      : highlight === 'red'
      ? 'text-red-400'
      : highlight === 'amber'
      ? 'text-amber-400'
      : 'text-white'

  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-mono font-bold text-lg ${colorClass}`}>{value}</p>
    </div>
  )
}
