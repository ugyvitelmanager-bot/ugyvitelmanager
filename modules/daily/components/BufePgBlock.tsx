'use client'

import { formatFt } from '../lib/calculations'

interface Props {
  bufe_27: number
  bufe_5: number
  bufe_am: number
  total: number
  onChange: (patch: { bufe_27?: number; bufe_5?: number; bufe_am?: number }) => void
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
      className="w-40 text-right font-mono border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
    />
  )
}

export function BufePgBlock({ bufe_27, bufe_5, bufe_am, total, onChange }: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-2">
        🍔 BÜFÉ pénztárgép
        <span className="font-normal text-slate-400 normal-case tracking-normal text-xs">AP A19202513</span>
      </h3>

      <div className="space-y-2">
        <Row label="27% ÁFA">
          <FtInput value={bufe_27} onChange={(v) => onChange({ bufe_27: v })} />
        </Row>
        <Row label="5% ÁFA">
          <FtInput value={bufe_5} onChange={(v) => onChange({ bufe_5: v })} />
        </Row>
        <Row label="Adómentes (AM)">
          <FtInput value={bufe_am} onChange={(v) => onChange({ bufe_am: v })} />
        </Row>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Büfé PG összesen</span>
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
