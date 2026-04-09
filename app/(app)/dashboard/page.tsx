import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/finance'
import Link from 'next/link'
import {
  CalendarDays, TrendingUp, Wallet, AlertCircle,
  CheckCircle2, Circle, PlusCircle, ArrowRight,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

function fmt(fillér: number) {
  return new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(Math.round(fillér / 100)) + ' Ft'
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('hu-HU', { year: 'numeric', month: 'long' })
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]
  const currentMonth = today.slice(0, 7)
  const monthStart = `${currentMonth}-01`
  const lastDay = new Date(Number(currentMonth.slice(0, 4)), Number(currentMonth.slice(5, 7)), 0).getDate()
  const monthEnd = `${currentMonth}-${String(lastDay).padStart(2, '0')}`
  const sevenDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]

  const [
    { data: todayClosing },
    { data: monthClosings },
    { data: monthPurchases },
    { data: openInvoices },
    { data: recentClosings },
    { data: recentPurchases },
    { data: allClosingsForBalance },
    { data: allPurchasesForBalance },
  ] = await Promise.all([
    // Mai nap zárása
    (supabase.from('daily_closings') as any)
      .select('date, status, halas_27, halas_18, halas_am, bufe_27, bufe_5, bufe_am, halas_pg_cash, bufe_pg_cash, member_loan, petty_cash_movement, daily_closing_expenses(*)')
      .eq('date', today)
      .maybeSingle(),

    // Aktuális hónap zárásai (bevétel)
    (supabase.from('daily_closings') as any)
      .select('halas_27, halas_18, halas_am, bufe_27, bufe_5, bufe_am, halas_pg_cash, bufe_pg_cash, member_loan, petty_cash_movement, daily_closing_expenses(amount)')
      .eq('status', 'final')
      .gte('date', monthStart)
      .lte('date', monthEnd),

    // Aktuális hónap kiadásai (purchases)
    (supabase.from('purchases') as any)
      .select('gross_amount, total_net')
      .gte('date', monthStart)
      .lte('date', monthEnd),

    // Nyitott (ki nem egyenlített) számlák
    (supabase.from('purchases') as any)
      .select('id, gross_amount, total_net, supplier_name, due_date')
      .eq('is_settled', false)
      .not('gross_amount', 'is', null)
      .order('due_date', { ascending: true }),

    // Utolsó 7 nap zárásai
    (supabase.from('daily_closings') as any)
      .select('date, status, halas_27, halas_18, halas_am, bufe_27, bufe_5, bufe_am, daily_closing_expenses(amount)')
      .gte('date', sevenDaysAgo)
      .lte('date', today)
      .order('date', { ascending: false }),

    // Legutóbbi 8 számla
    (supabase.from('purchases') as any)
      .select('id, date, supplier_name, gross_amount, total_net, is_settled, payment_method')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(8),

    // Összes final zárás a HP egyenleghez
    (supabase.from('daily_closings') as any)
      .select('date, halas_pg_cash, bufe_pg_cash, member_loan, petty_cash_movement, daily_closing_expenses(amount)')
      .eq('status', 'final')
      .order('date', { ascending: true }),

    // Összes KP vásárlás a HP egyenleghez
    (supabase.from('purchases') as any)
      .select('date, gross_amount, total_net')
      .in('payment_method', ['cash']),
  ])

  // ── Mai PG bevétel ──────────────────────────────────────────
  const todayPgRevenue = todayClosing
    ? ((todayClosing.halas_27 || 0) + (todayClosing.halas_18 || 0) + (todayClosing.halas_am || 0) +
       (todayClosing.bufe_27 || 0) + (todayClosing.bufe_5 || 0) + (todayClosing.bufe_am || 0))
    : 0

  // ── Havi eredmény ───────────────────────────────────────────
  const monthRevenue = ((monthClosings as any[]) || []).reduce((s: number, d: any) =>
    s + (d.halas_27||0) + (d.halas_18||0) + (d.halas_am||0) + (d.bufe_27||0) + (d.bufe_5||0) + (d.bufe_am||0), 0)

  const monthExpenses = ((monthPurchases as any[]) || []).reduce((s: number, p: any) =>
    s + (p.gross_amount ?? p.total_net ?? 0), 0)

  const monthBalance = monthRevenue - monthExpenses

  // ── Nyitott számlák ─────────────────────────────────────────
  const openList = (openInvoices as any[]) || []
  const openTotal = openList.reduce((s: number, p: any) => s + (p.gross_amount ?? p.total_net ?? 0), 0)

  // Lejárt (due_date < today)
  const overdueCount = openList.filter((p: any) => p.due_date && p.due_date < today).length

  // ── Házipénztár gördülő egyenleg ────────────────────────────
  const allClosings = (allClosingsForBalance as any[]) || []
  const allKpPurchases = (allPurchasesForBalance as any[]) || []

  const kpByDate: Record<string, number> = {}
  for (const p of allKpPurchases) {
    kpByDate[p.date] = (kpByDate[p.date] || 0) + Math.round((p.gross_amount ?? p.total_net ?? 0) / 100)
  }

  let hpBalance = 0
  for (const d of allClosings) {
    const kpBev = Math.round(((d.halas_pg_cash || 0) + (d.bufe_pg_cash || 0)) / 100)
    const loan  = Math.round((d.member_loan || 0) / 100)
    const kpKiad = kpByDate[d.date] || 0
    const egyebKiad = ((d.daily_closing_expenses as any[]) || [])
      .reduce((s: number, e: any) => s + Math.round((e.amount || 0) / 100), 0)
    const egyebKifizetes = Math.round((d.petty_cash_movement || 0) / 100)
    hpBalance += kpBev + loan - kpKiad - egyebKiad - egyebKifizetes
  }

  // ── Utolsó 7 nap sorai ──────────────────────────────────────
  const recentList = (recentClosings as any[]) || []

  // Generáljuk az utolsó 7 napot (closingtól függetlenül)
  const last7: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() - i * 86400000)
    last7.push(d.toISOString().split('T')[0])
  }
  const closingByDate: Record<string, any> = {}
  for (const c of recentList) closingByDate[c.date] = c

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Fejléc */}
      <div className="border-b pb-5">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          {new Date().toLocaleDateString('hu-HU', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {/* Stat kártyák */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        {/* Mai bevétel */}
        <Link href={`/napi-elszamolas/${today}`} className="group rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-emerald-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mai PG bevétel</span>
            <CalendarDays className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{fmt(todayPgRevenue)}</div>
          <div className="mt-2 text-[11px] text-slate-400">
            {todayClosing
              ? <span className={`font-semibold ${todayClosing.status === 'final' ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {todayClosing.status === 'final' ? '✓ Véglegesítve' : '⏳ Vázlat'}
                </span>
              : <span className="text-slate-400">Még nincs rögzítve</span>
            }
          </div>
        </Link>

        {/* Havi eredmény */}
        <Link href="/penztar" className="group rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-blue-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Havi eredmény</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className={`text-2xl font-black ${monthBalance >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {monthBalance >= 0 ? '+' : ''}{fmt(monthBalance)}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {monthLabel(currentMonth)} · bev: {fmt(monthRevenue)} · kiad: {fmt(monthExpenses)}
          </div>
        </Link>

        {/* Házipénztár egyenleg */}
        <Link href="/penztar" className="group rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-orange-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Házipénztár</span>
            <Wallet className="w-4 h-4 text-orange-400" />
          </div>
          <div className={`text-2xl font-black ${hpBalance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {hpBalance >= 0 ? '' : ''}{new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(hpBalance)} Ft
          </div>
          <div className="mt-2 text-[11px] text-slate-400">Gördülő egyenleg az összes zárás alapján</div>
        </Link>

        {/* Nyitott számlák */}
        <Link href="/beszerzes" className="group rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-red-400">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nyitott számlák</span>
            <AlertCircle className={`w-4 h-4 ${overdueCount > 0 ? 'text-red-500' : 'text-slate-300'}`} />
          </div>
          <div className="text-2xl font-black text-slate-900">{openList.length} db</div>
          <div className="mt-2 text-[11px] text-slate-400">
            {fmt(openTotal)}
            {overdueCount > 0 && (
              <span className="ml-2 text-red-600 font-semibold">· {overdueCount} lejárt!</span>
            )}
          </div>
        </Link>
      </div>

      {/* Alsó két blokk */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Utolsó 7 nap */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="font-bold text-slate-700 text-sm">Utolsó 7 nap</p>
            <Link href="/napi-elszamolas" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
              Összes <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {last7.map(date => {
                const c = closingByDate[date]
                const pgBev = c
                  ? ((c.halas_27||0)+(c.halas_18||0)+(c.halas_am||0)+(c.bufe_27||0)+(c.bufe_5||0)+(c.bufe_am||0))
                  : null
                const displayDate = new Date(date + 'T12:00:00').toLocaleDateString('hu-HU', {
                  month: 'short', day: 'numeric', weekday: 'short',
                })
                const isToday = date === today
                return (
                  <tr key={date} className={`hover:bg-slate-50 transition-colors ${isToday ? 'bg-emerald-50/40' : ''}`}>
                    <td className="px-5 py-3">
                      <Link href={`/napi-elszamolas/${date}`} className="font-medium text-slate-700 hover:text-emerald-600 capitalize">
                        {displayDate}
                        {isToday && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">MA</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {pgBev !== null ? (
                        <span className={pgBev > 0 ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>{fmt(pgBev)}</span>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {c ? (
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          c.status === 'final'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {c.status === 'final' ? 'Végleges' : 'Vázlat'}
                        </span>
                      ) : (
                        <Link href={`/napi-elszamolas/${date}`} className="text-[11px] text-slate-400 hover:text-emerald-600 flex items-center gap-1 justify-end">
                          <PlusCircle className="w-3 h-3" /> Rögzítés
                        </Link>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Legutóbbi számlák */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <p className="font-bold text-slate-700 text-sm">Legutóbbi számlák</p>
            <Link href="/beszerzes" className="text-xs text-emerald-600 hover:underline flex items-center gap-1">
              Összes <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              {((recentPurchases as any[]) || []).map((p: any) => {
                const amt = p.gross_amount ?? p.total_net ?? 0
                const displayDate = new Date(p.date + 'T12:00:00').toLocaleDateString('hu-HU', {
                  month: 'short', day: 'numeric',
                })
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-700 truncate max-w-[180px]">{p.supplier_name}</div>
                      <div className="text-[11px] text-slate-400">{displayDate}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-slate-700 whitespace-nowrap">
                      {fmt(amt)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {p.is_settled
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />
                        : <Circle className="w-4 h-4 text-slate-300 ml-auto" />
                      }
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  )
}
