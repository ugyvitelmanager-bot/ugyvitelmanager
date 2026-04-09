import { createClient } from '@/lib/supabase/server'
import { Receipt } from 'lucide-react'
import { VatAnalyticsTable } from '@/modules/vat/components/VatAnalyticsTable'

export const dynamic = 'force-dynamic'

export default async function AfaPage() {
  const supabase = await createClient()

  const [closingsRes, purchasesRes] = await Promise.all([
    // Összes végleges napi zárás — bevételi ÁFA számításhoz
    (supabase.from('daily_closings') as any)
      .select('date, halas_27, halas_18, halas_am, bufe_27, bufe_5, bufe_am')
      .eq('status', 'final')
      .order('date', { ascending: true }),

    // Összes vásárlás ÁFA adata — teljesítés dátuma szerint
    (supabase.from('purchases') as any)
      .select('performance_date, vat_amount, net_amount')
      .not('performance_date', 'is', null)
      .order('performance_date', { ascending: true }),
  ])

  const closings = (closingsRes.data as any[]) || []
  const purchases = (purchasesRes.data as any[]) || []

  // ─── Bevételi ÁFA havi csoportosítás ───────────────────────────────────────
  // Visszaszámolás: bruttó összegekből ÁFA = bruttó - bruttó/1.xx
  type RevenueVatRow = {
    base27: number; vat27: number
    base18: number; vat18: number
    base5: number;  vat5: number
    baseAm: number
  }
  const revenueByMonth = new Map<string, RevenueVatRow>()

  for (const d of closings) {
    const month = (d.date as string).slice(0, 7)
    if (!revenueByMonth.has(month)) {
      revenueByMonth.set(month, { base27: 0, vat27: 0, base18: 0, vat18: 0, base5: 0, vat5: 0, baseAm: 0 })
    }
    const r = revenueByMonth.get(month)!
    const gross27 = ((d.halas_27 || 0) + (d.bufe_27 || 0)) / 100  // fillér → Ft
    const gross18 = (d.halas_18 || 0) / 100
    const gross5  = (d.bufe_5 || 0) / 100
    const grossAm = ((d.halas_am || 0) + (d.bufe_am || 0)) / 100

    r.base27 += gross27 / 1.27
    r.vat27  += gross27 - gross27 / 1.27
    r.base18 += gross18 / 1.18
    r.vat18  += gross18 - gross18 / 1.18
    r.base5  += gross5 / 1.05
    r.vat5   += gross5 - gross5 / 1.05
    r.baseAm += grossAm
  }

  // ─── Visszaigényelhető ÁFA havi csoportosítás ──────────────────────────────
  type InputVatRow = { netAmount: number; vatAmount: number }
  const inputByMonth = new Map<string, InputVatRow>()

  for (const p of purchases) {
    if (!p.performance_date || p.vat_amount == null) continue
    const month = (p.performance_date as string).slice(0, 7)
    if (!inputByMonth.has(month)) inputByMonth.set(month, { netAmount: 0, vatAmount: 0 })
    const r = inputByMonth.get(month)!
    r.netAmount += (p.net_amount || 0) / 100   // fillér → Ft
    r.vatAmount += (p.vat_amount || 0) / 100
  }

  // ─── Összes hónap union ─────────────────────────────────────────────────────
  const allMonths = Array.from(new Set([
    ...revenueByMonth.keys(),
    ...inputByMonth.keys(),
  ])).sort()

  const rows = allMonths.map(month => {
    const rev = revenueByMonth.get(month) ?? { base27: 0, vat27: 0, base18: 0, vat18: 0, base5: 0, vat5: 0, baseAm: 0 }
    const inp = inputByMonth.get(month) ?? { netAmount: 0, vatAmount: 0 }
    const fizetendo = rev.vat27 + rev.vat18 + rev.vat5
    const visszaigenylheto = inp.vatAmount
    return { month, ...rev, ...inp, fizetendo, visszaigenylheto, netto: fizetendo - visszaigenylheto }
  })

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
          <Receipt className="w-8 h-8 text-violet-600" />
          ÁFA Analitika
        </h1>
        <p className="mt-1 text-gray-500 text-sm">
          Havi bevételi és visszaigényelhető ÁFA összesítő · Nettó fizetendő ÁFA
        </p>
      </div>

      <VatAnalyticsTable rows={rows} />
    </div>
  )
}
