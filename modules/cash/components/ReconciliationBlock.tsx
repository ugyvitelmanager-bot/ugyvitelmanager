'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, CheckCircle2, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/finance'

interface Props {
  pgKpInflow: number        // daily_closings KP PG bevétel (fillér)
  memberLoanInflow: number  // daily_closings tagi kölcsön (fillér)
  manualInflow: number      // cash_transactions income+loan_in (fillér)
  purchasesKpBrutto: number // purchases tábla KP kiadás bruttó összeg (fillér)
  ctOutflow: number         // cash_transactions expense+loan_out+transfer (fillér)
  reconcDiff: number        // ctOutflow - purchasesKpBrutto (fillér)
}

function Row({ label, value, color = 'slate' }: { label: string; value: number; color?: 'green' | 'red' | 'slate' | 'amber' }) {
  const colorClass = color === 'green' ? 'text-emerald-600' : color === 'red' ? 'text-red-600' : color === 'amber' ? 'text-amber-600' : 'text-slate-700'
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-100 last:border-0">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`font-mono font-semibold text-sm ${colorClass}`}>{formatCurrency(value)}</span>
    </div>
  )
}

export function ReconciliationBlock({
  pgKpInflow,
  memberLoanInflow,
  manualInflow,
  purchasesKpBrutto,
  ctOutflow,
  reconcDiff,
}: Props) {
  const [open, setOpen] = useState(false)

  const totalInflow = pgKpInflow + memberLoanInflow + manualInflow
  const balanceByPurchases = totalInflow - purchasesKpBrutto
  const balanceByCt = totalInflow - ctOutflow
  const isOk = Math.abs(reconcDiff) < 100 // < 1 Ft eltérés = rendben

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isOk
            ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            : <AlertTriangle className="w-5 h-5 text-amber-500" />
          }
          <div className="text-left">
            <p className="text-sm font-bold text-slate-700">Egyeztetési ellenőrzés</p>
            <p className="text-xs text-slate-400">
              {isOk
                ? 'Purchases tábla és cash_transactions egyezik'
                : `Eltérés: ${formatCurrency(Math.abs(reconcDiff))} — adatinkonzisztencia lehetséges`
              }
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-100">
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Bevételek */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Bevételek (daily_closings)</p>
              <Row label="PG KP bevétel" value={pgKpInflow} color="green" />
              <Row label="Tagi kölcsön" value={memberLoanInflow} color="green" />
              <Row label="Egyéb manuális" value={manualInflow} color="green" />
              <div className="mt-2 flex justify-between font-bold text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-600">Összes bevétel</span>
                <span className="font-mono text-emerald-700">{formatCurrency(totalInflow)}</span>
              </div>
            </div>

            {/* Kiadások összehasonlítás */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Kiadások (két forrás)</p>
              <Row label="Purchases bruttó (igaz)" value={purchasesKpBrutto} color="red" />
              <Row label="Cash transactions" value={ctOutflow} color={isOk ? 'red' : 'amber'} />
              <div className={`mt-2 flex justify-between font-bold text-sm pt-2 border-t border-slate-200 ${isOk ? 'text-emerald-600' : 'text-amber-600'}`}>
                <span>Eltérés</span>
                <span className="font-mono">{reconcDiff >= 0 ? '+' : ''}{formatCurrency(reconcDiff)}</span>
              </div>
            </div>

            {/* Egyenleg kétféleképpen */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Egyenleg (két számítás)</p>
              <Row label="Bevétel − Purchases bruttó" value={balanceByPurchases} color={balanceByPurchases >= 0 ? 'green' : 'red'} />
              <Row label="Bevétel − Cash transactions" value={balanceByCt} color={balanceByCt >= 0 ? 'green' : 'red'} />
              <div className="mt-2 pt-2 border-t border-slate-200">
                <p className="text-xs text-slate-400">
                  {isOk
                    ? '✓ A két szám egyezik — az adatok konzisztensek.'
                    : 'A különbség mutatja a nettó/bruttó keveredés mértékét.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
