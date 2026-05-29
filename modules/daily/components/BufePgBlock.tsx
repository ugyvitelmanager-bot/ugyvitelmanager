'use client'

import { formatFt } from '../lib/calculations'
import { VAT_RATE_LABELS } from '../lib/labels'
import { FtInput, Row } from './shared/PgBlockHelpers'

interface Props {
  bufe_27: number
  bufe_18: number
  bufe_5: number
  bufe_am: number
  bufe_pg_cash: number
  bufe_pg_card: number
  total: number
  onChange: (patch: {
    bufe_27?: number
    bufe_18?: number
    bufe_5?: number
    bufe_am?: number
    bufe_pg_cash?: number
    bufe_pg_card?: number
  }) => void
}

export function BufePgBlock({ bufe_27, bufe_18, bufe_5, bufe_am, bufe_pg_cash, bufe_pg_card, total, onChange }: Props) {
  const pgPaymentSum = bufe_pg_cash + bufe_pg_card
  const pgDiff = total - pgPaymentSum
  const paymentFilled = bufe_pg_cash > 0 || bufe_pg_card > 0

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
        🍔 BÜFÉ pénztárgép
        <span className="font-normal text-slate-400 normal-case tracking-normal text-xs">AP A19202513</span>
      </h3>

      {/* Adónem bontás */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Adónem bontás</p>
      <div className="space-y-2 mb-4">
        <Row label={VAT_RATE_LABELS[27]}>
          <FtInput value={bufe_27} onChange={(v) => onChange({ bufe_27: v })} colorClass="focus:ring-blue-400" />
        </Row>
        <Row label={VAT_RATE_LABELS[18]}>
          <FtInput value={bufe_18} onChange={(v) => onChange({ bufe_18: v })} colorClass="focus:ring-blue-400" />
        </Row>
        <Row label={VAT_RATE_LABELS[5]}>
          <FtInput value={bufe_5} onChange={(v) => onChange({ bufe_5: v })} colorClass="focus:ring-blue-400" />
        </Row>
        <Row label={VAT_RATE_LABELS.am}>
          <FtInput value={bufe_am} onChange={(v) => onChange({ bufe_am: v })} colorClass="focus:ring-blue-400" />
        </Row>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Büfé PG összesen</span>
        <span className="font-mono font-bold text-slate-800">{formatFt(total)}</span>
      </div>

      {/* Fizetési mód bontás */}
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">Fizetési mód (PG szerint)</p>
      <div className="space-y-2">
        <Row label="Készpénz (KP)">
          <FtInput value={bufe_pg_cash} onChange={(v) => onChange({ bufe_pg_cash: v })} colorClass="focus:ring-blue-400" />
        </Row>
        <Row label="Bankkártya (BK)">
          <FtInput value={bufe_pg_card} onChange={(v) => onChange({ bufe_pg_card: v })} colorClass="focus:ring-purple-400" />
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
