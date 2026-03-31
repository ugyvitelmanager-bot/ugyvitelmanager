'use client'

import { PlusCircle, Trash2 } from 'lucide-react'
import type { DailyClosingExpenseItem } from '../types'

interface Props {
  expenses: DailyClosingExpenseItem[]
  onChange: (expenses: DailyClosingExpenseItem[]) => void
}

export function OtherExpensesBlock({ expenses, onChange }: Props) {
  const addRow = () => {
    onChange([
      ...expenses,
      { amount: 0, note: '', sort_order: expenses.length },
    ])
  }

  const removeRow = (index: number) => {
    onChange(expenses.filter((_, i) => i !== index))
  }

  const updateRow = (index: number, patch: Partial<DailyClosingExpenseItem>) => {
    onChange(
      expenses.map((e, i) => (i === index ? { ...e, ...patch } : e))
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
        💸 Egyéb napi kiadás
      </h3>

      <div className="space-y-2">
        {expenses.length === 0 && (
          <p className="text-sm text-slate-400 italic">Nincs egyéb kiadás rögzítve.</p>
        )}
        {expenses.map((expense, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={expense.amount === 0 ? '' : expense.amount}
              onChange={(e) =>
                updateRow(i, {
                  amount:
                    e.target.value === ''
                      ? 0
                      : Math.max(0, Math.round(parseFloat(e.target.value) || 0)),
                })
              }
              className="w-32 text-right font-mono border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
            <span className="text-xs text-slate-400 shrink-0">Ft</span>
            <input
              type="text"
              placeholder="Megnevezés (pl. jégtömb, parkoló...)"
              value={expense.note}
              onChange={(e) => updateRow(i, { note: e.target.value })}
              className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
            />
            <button
              type="button"
              onClick={() => removeRow(i)}
              className="text-slate-300 hover:text-red-500 transition-colors"
              title="Sor törlése"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addRow}
        className="mt-3 flex items-center gap-1.5 text-sm text-slate-500 hover:text-orange-600 transition-colors"
      >
        <PlusCircle className="w-4 h-4" />
        Kiadás hozzáadása
      </button>
    </div>
  )
}
