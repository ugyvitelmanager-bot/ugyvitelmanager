import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/finance'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Receipt, TrendingUp, Download, Calendar, ArrowUpRight, ArrowDownRight, BarChart3, Wallet, Landmark, Info } from 'lucide-react'
import { ZReportModal } from '@/modules/incomes/components/ZReportModal'

export const dynamic = 'force-dynamic'

export default async function BevetelPage() {
  const supabase = await createClient()

  // 1. Napi jelentések lekérése (utolsó 60 nap)
  const { data: reportsRaw, error } = await supabase
    .from('daily_reports')
    .select('*')
    .order('date', { ascending: false })
    .limit(60)

  const reports = (reportsRaw as any[]) || []

  // 2. Statisztikák (Egyszerű havi összesítő a lekérteken felül)
  const totalMonthlyGross = reports.reduce((sum, r) => sum + (r.z_total_gross || 0), 0)
  const totalCash = reports.reduce((sum, r) => sum + (r.cash_total_gross || 0), 0)
  const totalCard = reports.reduce((sum, r) => sum + (r.terminal_total_gross || 0), 0)

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-indigo-600" />
            Forgalom & Bevétel
          </h1>
          <p className="mt-2 text-gray-500">
            Napi Z-jelentések, Terminál zárások és ÁFA gyűjtők kezelése.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="hidden md:flex gap-2">
            <Download className="w-4 h-4" />
            Excel Export
          </Button>
          <ZReportModal />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Utolsó 60 nap</span>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Összbevétel (Bruttó)</p>
            <h2 className="text-3xl font-black text-slate-900">{formatCurrency(totalMonthlyGross)}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
           <div className="flex items-center justify-between">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-400">{(totalCash / (totalMonthlyGross || 1) * 100).toFixed(1)}%</span>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Készpénz Forgalom</p>
            <h2 className="text-3xl font-black text-slate-900">{formatCurrency(totalCash)}</h2>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border shadow-sm space-y-3">
           <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
              <Landmark className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-400">{(totalCard / (totalMonthlyGross || 1) * 100).toFixed(1)}%</span>
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Kártyás Forgalom</p>
            <h2 className="text-3xl font-black text-slate-900">{formatCurrency(totalCard)}</h2>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
            <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Napi zárások listája
            </h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow>
                <TableHead className="font-semibold px-6 py-4">Dátum</TableHead>
                <TableHead className="font-semibold px-6 py-4 text-center">Üzletág</TableHead>
                <TableHead className="font-semibold px-6 py-4 text-right">Z-Összesen</TableHead>
                <TableHead className="font-semibold px-6 py-4 text-right">Terminál</TableHead>
                <TableHead className="font-semibold px-6 py-4 text-right">KP</TableHead>
                <TableHead className="font-semibold px-6 py-4 text-right">Áfa (27% / 5% / 0%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                    Még nincs rögzített napi zárás.
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-6 py-4 font-bold text-slate-700">
                      {new Date(report.date).toLocaleDateString('hu-HU')}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-center">
                       <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase
                          ${report.business_area === 'fish'
                            ? 'bg-green-50 text-green-700 ring-green-600/20'
                            : 'bg-indigo-50 text-indigo-700 ring-indigo-600/20'}`}>
                          {report.business_area === 'fish' ? 'Halas' : 'Büfé'}
                        </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-black text-slate-900">
                      {formatCurrency(report.z_total_gross)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-mono text-sm text-emerald-600">
                      {formatCurrency(report.terminal_total_gross)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right font-mono text-sm text-orange-600">
                      {formatCurrency(report.cash_total_gross)}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[10px] text-slate-500 font-mono">27%: {formatCurrency(report.vat_27_gross)}</span>
                          <span className="text-[10px] text-slate-500 font-mono">5%: {formatCurrency(report.vat_5_gross)}</span>
                          <span className="text-[10px] text-slate-400 font-mono italic">0%: {formatCurrency(report.vat_0_gross)}</span>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

       {/* Footer Info */}
       <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
          <Info className="w-4 h-4 flex-shrink-0" />
          <p>A táblázat az utolsó 60 nap adatait mutatja. A teljes archivumhoz használd az Excel exportot.</p>
       </div>
    </div>
  )
}
