'use client'

import { formatFt } from '../lib/calculations'

interface Props {
  halas_terminal_card: number
  bufe_terminal_card: number
  halas_pg_card: number
  bufe_pg_card: number
  total_bk: number
  onChange: (patch: { halas_terminal_card?: number; bufe_terminal_card?: number }) => void
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
  halas_terminal_card,
  bufe_terminal_card,
  halas_pg_card,
  bufe_pg_card,
  total_bk,
  onChange,
}: Props) {
  const halasDiff = halas_pg_card - halas_terminal_card
  const bufeDiff  = bufe_pg_card  - bufe_terminal_card

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
        💳 Bankkártya terminálok (tényleges zárás)
      </h3>

      <div className="space-y-4 mb-4">
        {/* HALAS terminál */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-1.5">
            <span className="text-sm text-slate-600 w-36">HALAS terminál</span>
            <div className="flex items-center gap-1.5">
              <FtInput
                value={halas_terminal_card}
                onChange={(v) => onChange({ halas_terminal_card: v })}
              />
              <span className="text-xs text-slate-400">Ft</span>
            </div>
          </div>
          {(halas_pg_card > 0 || halas_terminal_card > 0) && halasDiff !== 0 && (
            <div className="ml-0 rounded bg-amber-50 border border-amber-300 px-3 py-1.5 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">⚠ HALAS PG BK ≠ terminál</span>
              <span className="text-xs font-mono font-bold text-amber-700">
                PG: {formatFt(halas_pg_card)} / T: {formatFt(halas_terminal_card)}
                {' '}({halasDiff > 0 ? '+' : ''}{formatFt(halasDiff)})
              </span>
            </div>
          )}
          {(halas_pg_card > 0 || halas_terminal_card > 0) && halasDiff === 0 && (
            <div className="rounded bg-emerald-50 border border-emerald-200 px-3 py-1.5">
              <span className="text-xs font-bold text-emerald-700">✓ HALAS terminál egyezik</span>
            </div>
          )}
        </div>

        {/* BÜFÉ terminál */}
        <div>
          <div className="flex items-center justify-between gap-4 mb-1.5">
            <span className="text-sm text-slate-600 w-36">BÜFÉ terminál</span>
            <div className="flex items-center gap-1.5">
              <FtInput
                value={bufe_terminal_card}
                onChange={(v) => onChange({ bufe_terminal_card: v })}
              />
              <span className="text-xs text-slate-400">Ft</span>
            </div>
          </div>
          {(bufe_pg_card > 0 || bufe_terminal_card > 0) && bufeDiff !== 0 && (
            <div className="rounded bg-amber-50 border border-amber-300 px-3 py-1.5 flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700">⚠ BÜFÉ PG BK ≠ terminál</span>
              <span className="text-xs font-mono font-bold text-amber-700">
                PG: {formatFt(bufe_pg_card)} / T: {formatFt(bufe_terminal_card)}
                {' '}({bufeDiff > 0 ? '+' : ''}{formatFt(bufeDiff)})
              </span>
            </div>
          )}
          {(bufe_pg_card > 0 || bufe_terminal_card > 0) && bufeDiff === 0 && (
            <div className="rounded bg-emerald-50 border border-emerald-200 px-3 py-1.5">
              <span className="text-xs font-bold text-emerald-700">✓ BÜFÉ terminál egyezik</span>
            </div>
          )}
        </div>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Összes terminál</span>
        <span className="font-mono font-bold text-slate-800">{formatFt(total_bk)}</span>
      </div>
    </div>
  )
}
