'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, BarChart3 } from 'lucide-react'
import { formatCurrency } from '@/lib/finance'

interface MonthRow {
  month: string   // 'YYYY-MM'
  pgKp: number
  memberLoan: number
  kiadás: number
  balance: number
}

interface Props {
  rows: MonthRow[]
}

function fmt(n: number) {
  return formatCurrency(n)
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })
}

export function MonthlyBreakdownBlock({ rows }: Props) {
  const [open, setOpen] = useState(true)

  const totals = rows.reduce(
    (acc, r) => ({
      pgKp: acc.pgKp + r.pgKp,
      memberLoan: acc.memberLoan + r.memberLoan,
      kiadás: acc.kiadás + r.kiadás,
    }),
    { pgKp: 0, memberLoan: 0, kiadás: 0 }
  )
  const totalBalance = totals.pgKp + totals.memberLoan - totals.kiadás

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <BarChart3 className="w-5 h-5 text-slate-400" />
          <div className="text-left">
            <p className="text-sm font-bold text-slate-700">Havi készpénzmozgás</p>
            <p className="text-xs text-slate-400">PG KP bevétel · Tagi kölcsön · Kiadás · Házipénztár egyenleg</p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-600">Hónap</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">PG KP bevétel</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Tagi kölcsön</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Kiadás (bruttó)</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-600 whitespace-nowrap">Házipénztár egyenleg</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r => (
                <tr key={r.month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-700 capitalize">{monthLabel(r.month)}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-700">{fmt(r.pgKp)}</td>
                  <td className="px-4 py-3 text-right font-mono text-amber-600">{fmt(r.memberLoan)}</td>
                  <td className="px-4 py-3 text-right font-mono text-red-600">{fmt(r.kiadás)}</td>
                  <td className={`px-5 py-3 text-right font-mono font-bold ${r.balance >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    {r.balance >= 0 ? '+' : ''}{fmt(r.balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
              <tr>
                <td className="px-5 py-3 font-bold text-slate-700 uppercase text-xs tracking-wider">Összesen</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">{fmt(totals.pgKp)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-amber-600">{fmt(totals.memberLoan)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-red-600">{fmt(totals.kiadás)}</td>
                <td className={`px-5 py-3 text-right font-mono font-bold text-base ${totalBalance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                  {totalBalance >= 0 ? '+' : ''}{fmt(totalBalance)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
