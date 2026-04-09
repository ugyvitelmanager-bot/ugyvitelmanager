'use client'

import { formatFt } from '../lib/calculations'

interface Props {
  petty_cash_movement: number
  petty_cash_note: string
  expected_cash_closing: number
  opening_cash_balance: number
  onChange: (patch: { petty_cash_movement?: number; petty_cash_note?: string }) => void
}

export function HazipenzBlock({
  petty_cash_movement,
  petty_cash_note,
  expected_cash_closing,
  opening_cash_balance,
  onChange,
}: Props) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
        🏦 Házipénztár
      </h3>

      {opening_cash_balance !== 0 && (
        <div className="flex items-center justify-between mb-4 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Nyitókészlet (előző zárás)</span>
          <span className={`font-mono font-bold text-sm ${opening_cash_balance >= 0 ? 'text-slate-700' : 'text-red-600'}`}>
            {formatFt(opening_cash_balance)}
          </span>
        </div>
      )}

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-sm text-slate-600">Egyéb KP kifizetés</span>
            <p className="text-[11px] text-slate-400 mt-0.5">pl. bér, banki befizetés — levonódik a záróállásból</p>
          </div>
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={petty_cash_movement === 0 ? '' : petty_cash_movement}
              onChange={(e) =>
                onChange({
                  petty_cash_movement:
                    e.target.value === ''
                      ? 0
                      : Math.max(0, Math.round(parseFloat(e.target.value) || 0)),
                })
              }
              className="w-40 text-right font-mono border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            />
            <span className="text-xs text-slate-400">Ft</span>
          </div>
        </div>

        <input
          type="text"
          placeholder="Megjegyzés (pl. bér kifizetése, banki befizetés)"
          value={petty_cash_note}
          onChange={(e) => onChange({ petty_cash_note: e.target.value })}
          className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
        />
      </div>

      <div className="pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Várható KP záróállás
            </span>
            <p className="text-[11px] text-slate-400 mt-0.5">
              KP bevétel + tagi kölcsön − KP kiadások − Egyéb kifizetés
            </p>
          </div>
          <span
            className={`font-mono font-bold text-base ${
              expected_cash_closing >= 0 ? 'text-slate-800' : 'text-red-600'
            }`}
          >
            {formatFt(expected_cash_closing)}
          </span>
        </div>
      </div>
    </div>
  )
}
