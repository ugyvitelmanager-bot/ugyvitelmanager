'use client'

import { useState } from 'react'
import { Download, ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  defaultYear: number
  defaultMonth: number
}

function monthFirstDay(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}-01`
}
function monthLastDay(year: number, month: number) {
  const last = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`
}

export function ExportButton({ defaultYear, defaultMonth }: Props) {
  const [open, setOpen] = useState(false)
  const [from, setFrom] = useState(monthFirstDay(defaultYear, defaultMonth))
  const [to,   setTo]   = useState(monthLastDay(defaultYear, defaultMonth))

  const downloadUrl = `/api/export/napi-elszamolas?from=${from}&to=${to}`

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors"
      >
        <Download className="w-4 h-4" />
        Könyvelési export
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-80">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Excel export – időszak</p>

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Kezdő dátum</label>
                <input
                  type="date"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">Záró dátum</label>
                <input
                  type="date"
                  value={to}
                  onChange={e => setTo(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-snug">
              Az export 2 lapot tartalmaz: <strong>ÁFA bontás</strong> (halas + büfé, adónem szerint) és <strong>fizetési módok</strong> (bankkártya / készpénz naponta).
            </p>

            <a
              href={downloadUrl}
              download
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Excel letöltése
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
