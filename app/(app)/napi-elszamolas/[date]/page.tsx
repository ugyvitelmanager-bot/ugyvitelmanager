import { notFound } from 'next/navigation'
import { getDailyClosing } from '@/modules/daily/actions'
import { dbToFormData } from '@/modules/daily/lib/transformers'
import { EMPTY_FORM_DATA } from '@/modules/daily/lib/calculations'
import { DailyReportForm } from '@/modules/daily/components/DailyReportForm'
import type { DailyClosingStatus } from '@/modules/daily/types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ date: string }>
}

/** Dátum string validáció: YYYY-MM-DD formátum */
function isValidDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false
  const d = new Date(date + 'T12:00:00')
  return !isNaN(d.getTime())
}

/** Előző és következő nap string */
function adjacentDates(date: string): { prev: string; next: string } {
  const d = new Date(date + 'T12:00:00')
  const prev = new Date(d)
  const next = new Date(d)
  prev.setDate(d.getDate() - 1)
  next.setDate(d.getDate() + 1)
  return {
    prev: prev.toISOString().split('T')[0],
    next: next.toISOString().split('T')[0],
  }
}

export default async function NapiElszamolasDatePage({ params }: PageProps) {
  const { date } = await params

  if (!isValidDate(date)) notFound()

  // Ne mutassuk jövőbeli napokat
  const today = new Date().toISOString().split('T')[0]
  if (date > today) notFound()

  const { closing, cashPurchases, prevCashClosing } = await getDailyClosing(date)

  const initialData   = closing ? dbToFormData(closing) : EMPTY_FORM_DATA
  const initialStatus = (closing?.status as DailyClosingStatus) ?? 'draft'

  const { prev, next } = adjacentDates(date)

  // Csak múltbeli/mai napra navigálunk
  const prevDate = prev <= today ? prev : null
  const nextDate = next <= today ? next : null

  return (
    <div className="p-4 md:p-8">
      <DailyReportForm
        date={date}
        initialData={initialData}
        initialStatus={initialStatus}
        cashPurchases={cashPurchases}
        prevDate={prevDate}
        nextDate={nextDate}
        prevCashClosing={prevCashClosing}
      />
    </div>
  )
}
