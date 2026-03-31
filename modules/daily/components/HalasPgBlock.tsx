'use client'

import { formatFt } from '../lib/calculations'

interface Props {
  halas_27: number
  halas_18: number
  halas_am: number
  total: number
  onChange: (patch: { halas_27?: number; halas_18?: number; halas_am?: number }) => void
}

function FtInput({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
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
      className="w-40 text-right font-mono border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
    />
  )
}

export function HalasPgBlock({ halas_27, halas_18, halas_am, total, onChange }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
        🐟 HALAS pénztárgép
        <span className="font-normal text-slate-400 normal-case tracking-normal text-xs">AP A17710081</span>
      </h3>

      <div className="space-y-2">
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

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Halas PG összesen</span>
        <span className="font-mono font-bold text-slate-800">{formatFt(total)}</span>
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-slate-600 w-36">{label}</span>
      <div className="flex items-center gap-1.5">
        {children}
        <span className="text-xs text-slate-400">Ft</span>
      </div>
    </div>
  )
}
