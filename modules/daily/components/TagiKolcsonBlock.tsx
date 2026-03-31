'use client'

interface Props {
  member_loan: number
  member_loan_note: string
  onChange: (patch: { member_loan?: number; member_loan_note?: string }) => void
}

export function TagiKolcsonBlock({ member_loan, member_loan_note, onChange }: Props) {
  const hasLoan = member_loan > 0

  return (
    <div
      className={`border rounded-xl p-5 shadow-sm transition-colors ${
        hasLoan
          ? 'bg-amber-50 border-amber-200'
          : 'bg-white border-slate-200'
      }`}
    >
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
        🤝 Tagi kölcsön
      </h3>

      <div className="flex items-center gap-3 mb-3">
        <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-slate-700">
          <input
            type="checkbox"
            checked={hasLoan}
            onChange={(e) => {
              if (!e.target.checked) onChange({ member_loan: 0, member_loan_note: '' })
              else onChange({ member_loan: 0 })
            }}
            className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
          />
          Volt tagi kölcsön ma
        </label>
      </div>

      {hasLoan || member_loan > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Összeg"
              value={member_loan === 0 ? '' : member_loan}
              onChange={(e) =>
                onChange({
                  member_loan:
                    e.target.value === ''
                      ? 0
                      : Math.max(0, Math.round(parseFloat(e.target.value) || 0)),
                })
              }
              className="w-40 text-right font-mono border border-amber-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
            />
            <span className="text-xs text-slate-400">Ft</span>
          </div>
          <input
            type="text"
            placeholder="Ki hozta / mire kellett"
            value={member_loan_note}
            onChange={(e) => onChange({ member_loan_note: e.target.value })}
            className="w-full border border-amber-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white"
          />
        </div>
      ) : null}

      {!hasLoan && member_loan === 0 && (
        <p className="text-sm text-slate-400 italic">Nem volt szükség tagi kölcsönre.</p>
      )}
    </div>
  )
}
