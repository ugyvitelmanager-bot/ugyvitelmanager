import Link from 'next/link'
import { CalendarDays, PlusCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { getDailyClosings } from '@/modules/daily/actions'
import { DailyReportList } from '@/modules/daily/components/DailyReportList'

export const dynamic = 'force-dynamic'

const MONTH_NAMES = [
  '', 'január', 'február', 'március', 'április', 'május', 'június',
  'július', 'augusztus', 'szeptember', 'október', 'november', 'december',
]

interface PageProps {
  searchParams: Promise<{ year?: string; month?: string }>
}

export default async function NapiElszamolasPage({ searchParams }: PageProps) {
  const params = await searchParams
  const today = new Date()
  const year  = parseInt(params.year  || String(today.getFullYear()))
  const month = parseInt(params.month || String(today.getMonth() + 1))

  const { closings, purchaseTotalsByDate } = await getDailyClosings(year, month)

  // Előző / következő hónap navigáció
  const prevMonth = month === 1  ? { year: year - 1, month: 12 } : { year, month: month - 1 }
  const nextMonth = month === 12 ? { year: year + 1, month: 1  } : { year, month: month + 1 }

  // Ma dátum string a gyors rögzítés gombhoz
  const todayStr = today.toISOString().split('T')[0]

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* Fejléc */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-emerald-600" />
            Napi Elszámolás
          </h1>
          <p className="mt-1 text-gray-500 text-sm">
            Napi PG zárások, KP bontás, tagi kölcsön és könyvelési adatok.
          </p>
        </div>
        <Link
          href={`/napi-elszamolas/${todayStr}`}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Mai nap rögzítése
        </Link>
      </div>

      {/* Hónap navigáció */}
      <div className="flex items-center gap-3">
        <Link
          href={`/napi-elszamolas?year=${prevMonth.year}&month=${prevMonth.month}`}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
          title="Előző hónap"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-xl font-bold text-slate-800 min-w-[200px] text-center">
          {year}. {MONTH_NAMES[month]}
        </h2>
        <Link
          href={`/napi-elszamolas?year=${nextMonth.year}&month=${nextMonth.month}`}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors"
          title="Következő hónap"
        >
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Lista */}
      <DailyReportList
        closings={closings}
        purchaseTotalsByDate={purchaseTotalsByDate}
        year={year}
        month={month}
      />
    </div>
  )
}
