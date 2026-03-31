// Read-only könyvelési bontás — server-kompatibilis pure display
import { formatFt } from '../lib/calculations'
import type { DailySummary } from '../types'

interface Props {
  summary: DailySummary
}

export function KonyvelesiBlock({ summary }: Props) {
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">
        🧾 Könyvelési bontás
      </h3>

      <div className="space-y-1 mb-4">
        <SectionTitle>ÁFA forgalom</SectionTitle>
        <Row label="27% ÁFA összforgalom" value={summary.total_27} />
        <Row label="18% ÁFA forgalom (Halas)" value={summary.total_18} />
        <Row label="5% ÁFA forgalom (Büfé)" value={summary.total_5} />
        <Row label="Adómentes (AM)" value={summary.total_am} />
      </div>

      <div className="space-y-1 pt-3 border-t border-slate-200">
        <SectionTitle>Fizetési mód</SectionTitle>
        <Row label="Bankkártyás (terminál zárás)" value={summary.total_bk} />
        <Row label="Készpénzes (PG szerint)" value={summary.total_kp} />
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-1 pb-0.5">
      {children}
    </p>
  )
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-sm text-slate-600">{label}</span>
      <span className="font-mono text-sm text-slate-700">{formatFt(value)}</span>
    </div>
  )
}
