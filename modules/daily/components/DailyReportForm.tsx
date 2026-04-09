'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Save, CheckCircle, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'

import { calculateDailySummary, EMPTY_FORM_DATA } from '../lib/calculations'
import { CLOSING_STATUS_LABELS, CLOSING_STATUS_BADGE } from '../lib/labels'
import { saveDailyClosing } from '../actions'
import type { DailyClosingFormData, DailyClosingStatus, CashPurchaseRecord } from '../types'

import { HalasPgBlock }      from './HalasPgBlock'
import { BufePgBlock }       from './BufePgBlock'
import { TerminalBlock }     from './TerminalBlock'
import { CashPurchasesBlock } from './CashPurchasesBlock'
import { OtherExpensesBlock } from './OtherExpensesBlock'
import { TagiKolcsonBlock }  from './TagiKolcsonBlock'
import { HazipenzBlock }     from './HazipenzBlock'
import { KonyvelesiBlock }   from './KonyvelesiBlock'
import { NapiEgyenlegBlock } from './NapiEgyenlegBlock'

interface Props {
  date: string
  initialData: DailyClosingFormData
  initialStatus: DailyClosingStatus
  cashPurchases: CashPurchaseRecord[]
  prevDate: string | null
  nextDate: string | null
  prevCashClosing: number
}

export function DailyReportForm({
  date,
  initialData,
  initialStatus,
  cashPurchases,
  prevDate,
  nextDate,
  prevCashClosing,
}: Props) {
  const router = useRouter()
  const [formData, setFormData] = useState<DailyClosingFormData>(initialData)
  const [status, setStatus] = useState<DailyClosingStatus>(initialStatus)
  const [isSaving, setIsSaving] = useState(false)

  // KP beszerzések összege Forintban (DB fillér → Ft)
  const cashPurchasesTotalFt = useMemo(
    () => cashPurchases.reduce((sum, p) => sum + Math.round(p.total_net / 100), 0),
    [cashPurchases]
  )

  // Összesítő — mindig friss, useMemo-val gyorsítva
  const summary = useMemo(
    () => calculateDailySummary(formData, cashPurchasesTotalFt, prevCashClosing),
    [formData, cashPurchasesTotalFt, prevCashClosing]
  )

  const update = (patch: Partial<DailyClosingFormData>) => {
    setFormData((prev) => ({ ...prev, ...patch }))
  }

  const handleSave = async (saveStatus: DailyClosingStatus) => {
    setIsSaving(true)
    try {
      const res = await saveDailyClosing(date, formData, saveStatus)
      if (res.success) {
        setStatus(saveStatus)
        toast.success(
          saveStatus === 'final'
            ? 'Napi elszámolás véglegesítve!'
            : 'Vázlat mentve.'
        )
        router.refresh()
      } else {
        toast.error(res.error || 'Mentési hiba')
      }
    } finally {
      setIsSaving(false)
    }
  }

  // Dátum formázás magyaros megjelenítéshez
  const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="max-w-3xl mx-auto space-y-5 pb-16">
      {/* Fejléc */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <button
            onClick={() => router.push('/napi-elszamolas')}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Vissza a listához
          </button>
          <h1 className="text-2xl font-bold text-slate-900 capitalize">{displayDate}</h1>
          <span
            className={`mt-1 inline-block text-xs font-bold px-2 py-0.5 rounded ${CLOSING_STATUS_BADGE[status]}`}
          >
            {CLOSING_STATUS_LABELS[status]}
          </span>
        </div>

        {/* Nap navigáció */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => prevDate && router.push(`/napi-elszamolas/${prevDate}`)}
            disabled={!prevDate}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Előző nap"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => nextDate && router.push(`/napi-elszamolas/${nextDate}`)}
            disabled={!nextDate}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="Következő nap"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* PG blokkok */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <HalasPgBlock
          halas_27={formData.halas_27}
          halas_18={formData.halas_18}
          halas_am={formData.halas_am}
          halas_pg_cash={formData.halas_pg_cash}
          halas_pg_card={formData.halas_pg_card}
          total={summary.halas_pg_total}
          onChange={update}
        />
        <BufePgBlock
          bufe_27={formData.bufe_27}
          bufe_5={formData.bufe_5}
          bufe_am={formData.bufe_am}
          bufe_pg_cash={formData.bufe_pg_cash}
          bufe_pg_card={formData.bufe_pg_card}
          total={summary.bufe_pg_total}
          onChange={update}
        />
      </div>

      {/* Terminál blokk */}
      <TerminalBlock
        halas_terminal_card={formData.halas_terminal_card}
        bufe_terminal_card={formData.bufe_terminal_card}
        halas_pg_card={formData.halas_pg_card}
        bufe_pg_card={formData.bufe_pg_card}
        total_bk={summary.total_bk}
        onChange={update}
      />

      {/* KP beszerzések */}
      <CashPurchasesBlock
        purchases={cashPurchases}
        totalFt={cashPurchasesTotalFt}
      />

      {/* Egyéb kiadások */}
      <OtherExpensesBlock
        expenses={formData.expenses}
        onChange={(expenses) => update({ expenses })}
      />

      {/* Tagi kölcsön */}
      <TagiKolcsonBlock
        member_loan={formData.member_loan}
        member_loan_note={formData.member_loan_note}
        onChange={update}
      />

      {/* Házipénztár */}
      <HazipenzBlock
        petty_cash_movement={formData.petty_cash_movement}
        petty_cash_note={formData.petty_cash_note}
        expected_cash_closing={summary.expected_cash_closing}
        opening_cash_balance={summary.opening_cash_balance}
        onChange={update}
      />

      {/* Napi egyenleg összesítő */}
      <NapiEgyenlegBlock summary={summary} memberLoan={formData.member_loan} />

      {/* Könyvelési bontás */}
      <KonyvelesiBlock summary={summary} />

      {/* Megjegyzés */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
        <label className="block text-sm font-bold uppercase tracking-wider text-slate-500 mb-2">
          Megjegyzés
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => update({ notes: e.target.value })}
          placeholder="Opcionális megjegyzés a naphoz..."
          rows={2}
          className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white resize-none"
        />
      </div>

      {/* Mentés gombok */}
      <div className="sticky bottom-0 bg-white border-t border-slate-200 -mx-4 px-4 py-4 md:-mx-8 md:px-8 flex items-center justify-between gap-3 shadow-lg">
        <div className="text-sm text-slate-500">
          {status === 'final' && (
            <span className="text-green-600 font-medium">✓ Véglegesítve</span>
          )}
          {status === 'draft' && (
            <span className="text-yellow-600 font-medium">Vázlat — még nem végleges</span>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleSave('draft')}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            Vázlat mentése
          </button>
          <button
            type="button"
            onClick={() => handleSave('final')}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Véglegesítés
          </button>
        </div>
      </div>
    </div>
  )
}
