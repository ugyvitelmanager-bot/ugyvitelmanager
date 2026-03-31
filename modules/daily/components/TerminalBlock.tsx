'use client'

import { formatFt } from '../lib/calculations'

interface Props {
  halas_bk_terminal: number
  bufe_bk_terminal: number
  total_bk: number
  halas_kp: number
  bufe_kp: number
  total_kp: number
  onChange: (patch: { halas_bk_terminal?: number; bufe_bk_terminal?: number }) => void
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
      className="w-40 text-right font-mono border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
    />
  )
}

export function TerminalBlock({
  halas_bk_terminal,
  bufe_bk_terminal,
  total_bk,
  halas_kp,
  bufe_kp,
  total_kp,
  onChange,
}: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
        💳 Bankkártya terminálok
      </h3>

      <div className="space-y-2 mb-4">
        <Row label="HALAS terminál">
          <FtInput
            value={halas_bk_terminal}
            onChange={(v) => onChange({ halas_bk_terminal: v })}
          />
        </Row>
        <Row label="BÜFÉ terminál">
          <FtInput
            value={bufe_bk_terminal}
            onChange={(v) => onChange({ bufe_bk_terminal: v })}
          />
        </Row>
      </div>

      <div className="pt-3 border-t border-slate-100 space-y-1.5">
        <CalcRow label="Összes BK" value={total_bk} />
        <CalcRow
          label="Halas KP"
          value={halas_kp}
          warn={halas_kp < 0}
          warnText="Terminál > PG"
        />
        <CalcRow
          label="Büfé KP"
          value={bufe_kp}
          warn={bufe_kp < 0}
          warnText="Terminál > PG"
        />
        <CalcRow label="Összes KP" value={total_kp} bold />
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

function CalcRow({
  label,
  value,
  bold,
  warn,
  warnText,
}: {
  label: string
  value: number
  bold?: boolean
  warn?: boolean
  warnText?: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs uppercase font-bold tracking-wider text-slate-400">{label}</span>
      <div className="flex items-center gap-2">
        {warn && (
          <span className="text-xs text-amber-600 font-medium">⚠ {warnText}</span>
        )}
        <span
          className={`font-mono text-sm ${bold ? 'font-bold text-slate-800' : 'text-slate-600'} ${warn ? 'text-red-600' : ''}`}
        >
          {formatFt(value)}
        </span>
      </div>
    </div>
  )
}
