'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, TrendingUp } from 'lucide-react'

interface RevExpRow {
  month: string
  halasBev: number   // fillér
  bufeBev: number    // fillér
  kpKiad: number     // fillér
  bkKiad: number     // fillér
  utKiad: number     // fillér
}

interface Props {
  rows: RevExpRow[]
}

const FT = (n: number) =>
  new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(Math.round(n / 100)) + ' Ft'

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })
}

function sumField(rows: RevExpRow[], key: keyof RevExpRow) {
  return rows.reduce((s, r) => s + (r[key] as number), 0)
}

export function RevenueExpenseBlock({ rows }: Props) {
  const [open, setOpen] = useState(true)

  if (rows.length === 0) return null

  const tot = {
    halasBev: sumField(rows, 'halasBev'),
    bufeBev:  sumField(rows, 'bufeBev'),
    kpKiad:   sumField(rows, 'kpKiad'),
    bkKiad:   sumField(rows, 'bkKiad'),
    utKiad:   sumField(rows, 'utKiad'),
  }
  const totOsszBev  = tot.halasBev + tot.bufeBev
  const totOsszKiad = tot.kpKiad + tot.bkKiad + tot.utKiad
  const totEredm    = totOsszBev - totOsszKiad

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-slate-400" />
          <div className="text-left">
            <p className="text-sm font-bold text-slate-700">Bevétel / Kiadás — havi eredménykimutatás</p>
            <p className="text-xs text-slate-400">Halas & Büfé PG bevétel · KP / BK / Utalás kiadás · Eredmény</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 whitespace-nowrap">Hónap</th>
                <th className="text-right px-3 py-3 font-semibold text-emerald-700 whitespace-nowrap">Halas bev.</th>
                <th className="text-right px-3 py-3 font-semibold text-emerald-700 whitespace-nowrap">Büfé bev.</th>
                <th className="text-right px-4 py-3 font-semibold text-emerald-800 whitespace-nowrap border-r border-slate-200">Össz bevétel</th>
                <th className="text-right px-3 py-3 font-semibold text-red-600 whitespace-nowrap">KP kiad.</th>
                <th className="text-right px-3 py-3 font-semibold text-red-600 whitespace-nowrap">BK kiad.</th>
                <th className="text-right px-3 py-3 font-semibold text-red-600 whitespace-nowrap">Utalás</th>
                <th className="text-right px-4 py-3 font-semibold text-red-800 whitespace-nowrap border-r border-slate-200">Össz kiadás</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-700 whitespace-nowrap">Eredmény</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r => {
                const osszBev  = r.halasBev + r.bufeBev
                const osszKiad = r.kpKiad + r.bkKiad + r.utKiad
                const eredm    = osszBev - osszKiad
                return (
                  <tr key={r.month} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-700 whitespace-nowrap capitalize">{monthLabel(r.month)}</td>
                    <td className="px-3 py-3 text-right font-mono text-emerald-700 whitespace-nowrap">{FT(r.halasBev)}</td>
                    <td className="px-3 py-3 text-right font-mono text-emerald-700 whitespace-nowrap">{FT(r.bufeBev)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap border-r border-slate-100">{FT(osszBev)}</td>
                    <td className="px-3 py-3 text-right font-mono text-red-600 whitespace-nowrap">{FT(r.kpKiad)}</td>
                    <td className="px-3 py-3 text-right font-mono text-red-600 whitespace-nowrap">{FT(r.bkKiad)}</td>
                    <td className="px-3 py-3 text-right font-mono text-red-600 whitespace-nowrap">{FT(r.utKiad)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-red-800 whitespace-nowrap border-r border-slate-100">{FT(osszKiad)}</td>
                    <td className={`px-5 py-3 text-right font-mono font-bold whitespace-nowrap ${eredm >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {eredm >= 0 ? '+' : ''}{FT(eredm)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300">
              <tr>
                <td className="px-5 py-3 font-bold text-slate-700 uppercase text-xs tracking-wider">Összesen</td>
                <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">{FT(tot.halasBev)}</td>
                <td className="px-3 py-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">{FT(tot.bufeBev)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-800 whitespace-nowrap border-r border-slate-200">{FT(totOsszBev)}</td>
                <td className="px-3 py-3 text-right font-mono font-bold text-red-600 whitespace-nowrap">{FT(tot.kpKiad)}</td>
                <td className="px-3 py-3 text-right font-mono font-bold text-red-600 whitespace-nowrap">{FT(tot.bkKiad)}</td>
                <td className="px-3 py-3 text-right font-mono font-bold text-red-600 whitespace-nowrap">{FT(tot.utKiad)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-red-800 whitespace-nowrap border-r border-slate-200">{FT(totOsszKiad)}</td>
                <td className={`px-5 py-3 text-right font-mono font-bold text-base whitespace-nowrap ${totEredm >= 0 ? 'text-emerald-800' : 'text-red-600'}`}>
                  {totEredm >= 0 ? '+' : ''}{FT(totEredm)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
