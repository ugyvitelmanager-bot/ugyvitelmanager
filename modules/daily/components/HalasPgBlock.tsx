'use client'

import { formatFt } from '../lib/calculations'

interface Props {
  halas_27: number
  halas_18: number
  halas_am: number
  halas_pg_cash: number
  halas_pg_card: number
  total: number
  onChange: (patch: {
    halas_27?: number
    halas_18?: number
    halas_am?: number
    halas_pg_cash?: number
    halas_pg_card?: number
  }) => void
}

function FtInput({
  value,
  onChange,
  colorClass = 'focus:ring-emerald-400',
}: {
  value: number
  onChange: (v: number) => void
  colorClass?: string
}) {
  return (
    <input
      type="number"
      min="0"
      step="1"
      placeholder="0"
      value={value === 0 ? '' : value}
      onChange={(e) =>
        onChange(e.target.value === '' ? 0 : Math.max(0, Math.round(parseFloat(e.target.value) || 0)))
      }
      className={`w-28 sm:w-40 text-right font-mono border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 ${colorClass} bg-white`}
    />
  )
}

export function HalasPgBlock({ halas_27, halas_18, halas_am, halas_pg_cash, halas_pg_card, total, onChange }: Props) {
  const pgPaymentSum = halas_pg_cash + halas_pg_card
  const pgDiff = total - pgPaymentSum
  const paymentFilled = halas_pg_cash > 0 || halas_pg_card > 0

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
        🐟 HALAS pénztárgép
        <span className="font-normal text-slate-400 normal-case tracking-normal text-xs">AP A17710081</span>
      </h3>

      {/* Adónem bontás */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Adónem bontás</p>
      <div className="space-y-2 mb-4">
        <Row label="27% ÁFA">
          <FtInput value={halas_27} onChange={(v) => onChange({ halas_27: v })} />
        </Row>
        <Row label="18% ÁFA">
          <FtInput value={halas_18} onChange={(v) => onChange({ halas_18: v })} />
        </Row>
        <Row label="Adómentes (AM)">
          <FtInput value={halas_am} onChange={(v) => onChange({ halas_am: v })} />
        </Row>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Halas PG összesen</span>
        <span className="font-mono font-bold text-slate-800">{formatFt(total)}</span>
      </div>

      {/* Fizetési mód bontás */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Fizetési mód (PG szerint)</p>
      <div className="space-y-2">
        <Row label="Készpénz (KP)">
          <FtInput value={halas_pg_cash} onChange={(v) => onChange({ halas_pg_cash: v })} colorClass="focus:ring-emerald-400" />
        </Row>
        <Row label="Bankkártya (BK)">
          <FtInput value={halas_pg_card} onChange={(v) => onChange({ halas_pg_card: v })} colorClass="focus:ring-purple-400" />
        </Row>
      </div>

      {/* Egyezés ellenőrzés */}
      {paymentFilled && pgDiff !== 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 border border-amber-300 px-3 py-2 flex items-center justify-between">
          <span className="text-xs font-bold text-amber-700">⚠ KP+BK ≠ PG összesen</span>
          <span className="text-xs font-mono font-bold text-amber-700">
            {pgDiff > 0 ? `+${formatFt(pgDiff)}` : formatFt(pgDiff)} eltérés
          </span>
        </div>
      )}
      {paymentFilled && pgDiff === 0 && (
        <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2">
          <span className="text-xs font-bold text-emerald-700">✓ KP+BK egyezik a PG összeggel</span>
        </div>
      )}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-600 flex-1 min-w-0">{label}</span>
      <div className="flex items-center gap-1.5">
        {children}
        <span className="text-xs text-slate-400">Ft</span>
      </div>
    </div>
  )
}
