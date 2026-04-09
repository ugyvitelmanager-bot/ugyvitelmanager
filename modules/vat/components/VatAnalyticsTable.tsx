'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface VatRow {
  month: string
  // Bevételi oldal
  base27: number; vat27: number
  base18: number; vat18: number
  base5: number;  vat5: number
  baseAm: number
  fizetendo: number
  // Beszerzési oldal
  netAmount: number
  vatAmount: number
  visszaigenylheto: number
  // Nettó
  netto: number
}

interface Props {
  rows: VatRow[]
}

const FT = (n: number) =>
  new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' Ft'

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })
}

function sum(rows: VatRow[], key: keyof VatRow) {
  return rows.reduce((s, r) => s + (r[key] as number), 0)
}

export function VatAnalyticsTable({ rows }: Props) {
  const [showDetail, setShowDetail] = useState(false)

  if (rows.length === 0) {
    return <p className="text-slate-400 text-sm italic">Nincs adat.</p>
  }

  const totals = {
    base27: sum(rows, 'base27'), vat27: sum(rows, 'vat27'),
    base18: sum(rows, 'base18'), vat18: sum(rows, 'vat18'),
    base5:  sum(rows, 'base5'),  vat5:  sum(rows, 'vat5'),
    baseAm: sum(rows, 'baseAm'),
    fizetendo: sum(rows, 'fizetendo'),
    netAmount: sum(rows, 'netAmount'),
    vatAmount: sum(rows, 'vatAmount'),
    visszaigenylheto: sum(rows, 'visszaigenylheto'),
    netto: sum(rows, 'netto'),
  }

  return (
    <div className="space-y-4">

      {/* ── Összefoglaló tábla ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Havi ÁFA összesítő</p>
          <button
            onClick={() => setShowDetail(v => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 transition-colors"
          >
            {showDetail ? 'Adónem bontás elrejtése' : 'Adónem bontás mutatása'}
            {showDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 font-semibold text-slate-600 whitespace-nowrap">Hónap</th>

                {showDetail && <>
                  <th className="text-right px-3 py-3 font-semibold text-slate-500 whitespace-nowrap text-xs">27% alap</th>
                  <th className="text-right px-3 py-3 font-semibold text-violet-600 whitespace-nowrap text-xs">27% ÁFA</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-500 whitespace-nowrap text-xs">18% alap</th>
                  <th className="text-right px-3 py-3 font-semibold text-violet-600 whitespace-nowrap text-xs">18% ÁFA</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-500 whitespace-nowrap text-xs">5% alap</th>
                  <th className="text-right px-3 py-3 font-semibold text-violet-600 whitespace-nowrap text-xs">5% ÁFA</th>
                  <th className="text-right px-3 py-3 font-semibold text-slate-500 whitespace-nowrap text-xs">AM alap</th>
                </>}

                <th className="text-right px-4 py-3 font-semibold text-violet-700 whitespace-nowrap">Fizetendő ÁFA</th>
                <th className="text-right px-4 py-3 font-semibold text-emerald-700 whitespace-nowrap">Visszaigényelhető</th>
                <th className="text-right px-5 py-3 font-semibold text-slate-700 whitespace-nowrap">Nettó fizetendő</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map(r => (
                <tr key={r.month} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-700 capitalize whitespace-nowrap">{monthLabel(r.month)}</td>

                  {showDetail && <>
                    <td className="px-3 py-3 text-right font-mono text-slate-500 text-xs whitespace-nowrap">{FT(r.base27)}</td>
                    <td className="px-3 py-3 text-right font-mono text-violet-600 text-xs whitespace-nowrap">{FT(r.vat27)}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-500 text-xs whitespace-nowrap">{FT(r.base18)}</td>
                    <td className="px-3 py-3 text-right font-mono text-violet-600 text-xs whitespace-nowrap">{FT(r.vat18)}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-500 text-xs whitespace-nowrap">{FT(r.base5)}</td>
                    <td className="px-3 py-3 text-right font-mono text-violet-600 text-xs whitespace-nowrap">{FT(r.vat5)}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-500 text-xs whitespace-nowrap">{FT(r.baseAm)}</td>
                  </>}

                  <td className="px-4 py-3 text-right font-mono font-semibold text-violet-700 whitespace-nowrap">{FT(r.fizetendo)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-emerald-600 whitespace-nowrap">{FT(r.visszaigenylheto)}</td>
                  <td className={`px-5 py-3 text-right font-mono font-bold whitespace-nowrap ${r.netto >= 0 ? 'text-slate-800' : 'text-emerald-700'}`}>
                    {r.netto >= 0 ? '' : '+'}{FT(-r.netto) /* negatív nettó = visszaigényelhető */}
                    {r.netto < 0 && <span className="ml-1 text-[10px] font-normal text-emerald-600">visszaigényelhető</span>}
                    {r.netto > 0 && <span className="ml-1 text-[10px] font-normal text-slate-400">fizetendő</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50 border-t-2 border-slate-300">
              <tr>
                <td className="px-5 py-3 font-bold text-slate-700 uppercase text-xs tracking-wider">Összesen</td>

                {showDetail && <>
                  <td className="px-3 py-3 text-right font-mono font-bold text-slate-500 text-xs whitespace-nowrap">{FT(totals.base27)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-violet-600 text-xs whitespace-nowrap">{FT(totals.vat27)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-slate-500 text-xs whitespace-nowrap">{FT(totals.base18)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-violet-600 text-xs whitespace-nowrap">{FT(totals.vat18)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-slate-500 text-xs whitespace-nowrap">{FT(totals.base5)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-violet-600 text-xs whitespace-nowrap">{FT(totals.vat5)}</td>
                  <td className="px-3 py-3 text-right font-mono font-bold text-slate-500 text-xs whitespace-nowrap">{FT(totals.baseAm)}</td>
                </>}

                <td className="px-4 py-3 text-right font-mono font-bold text-violet-700 whitespace-nowrap">{FT(totals.fizetendo)}</td>
                <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">{FT(totals.visszaigenylheto)}</td>
                <td className={`px-5 py-3 text-right font-mono font-bold text-base whitespace-nowrap ${totals.netto >= 0 ? 'text-slate-900' : 'text-emerald-700'}`}>
                  {totals.netto >= 0 ? '' : '+'}{FT(Math.abs(totals.netto))}
                  {totals.netto < 0 && <span className="ml-1 text-xs font-normal text-emerald-600">visszaigényelhető</span>}
                  {totals.netto > 0 && <span className="ml-1 text-xs font-normal text-slate-400">fizetendő</span>}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="px-5 py-2 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-400">
          Bevételi ÁFA: final státuszú napi zárásokból visszaszámolva · Visszaigényelhető: purchases.vat_amount, teljesítés dátuma szerint
        </div>
      </div>
    </div>
  )
}
