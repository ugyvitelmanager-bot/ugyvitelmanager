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
import { ShoppingBag, Truck, CheckCircle2, ChevronRight, Search, FileText, Wallet, Landmark, UserPlus } from 'lucide-react'
import { RecordPurchaseModal } from '@/modules/purchases/components/RecordPurchaseModal'

export const dynamic = 'force-dynamic'

export default async function BeszerzesPage() {
  const supabase = await createClient()

  // 1. Beszerzések lekérése
  const { data: purchasesRaw, error: purchaseError } = await supabase
    .from('purchases')
    .select(`
      *,
      purchase_items (
        id,
        quantity,
        unit_price_net,
        total_net,
        product:products (name)
      )
    `)
    .order('date', { ascending: false })
    .limit(100)

  // 2. Termékek és Mértékegységek a modalhoz
  const { data: productsRaw } = await supabase.from('products').select('id, name, unit_id, units(symbol)').eq('is_active', true).order('name')
  const { data: unitsRaw } = await supabase.from('units').select('id, symbol').order('symbol')

  const purchases = (purchasesRaw as any[]) || []
  const products = (productsRaw as any[]) || []
  const units = (unitsRaw as any[]) || []

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash_daily': return <Wallet className="w-3.5 h-3.5 text-orange-600" />
      case 'cash_petty': return <Wallet className="w-3.5 h-3.5 text-orange-600" />
      case 'member_loan_cash': return <UserPlus className="w-3.5 h-3.5 text-blue-600" />
      case 'bank_transfer': return <Landmark className="w-3.5 h-3.5 text-emerald-600" />
      default: return null
    }
  }

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case 'cash_daily': return 'Napi Kassza (KP)'
      case 'cash_petty': return 'Házipénztár (KP)'
      case 'member_loan_cash': return 'Tagi Kölcsön (KP)'
      case 'bank_transfer': return 'Banki Utalás'
      default: return method
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-emerald-600" />
            Beszerzés & Készletfeltöltés
          </h1>
          <p className="mt-2 text-gray-500">
            {purchases.length} rögzített számla / bizonylat. Készlet és árak automatikus kezelése.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RecordPurchaseModal products={products} units={units} />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="font-semibold px-6 py-4">Dátum</TableHead>
                  <TableHead className="font-semibold px-6 py-4">Beszállító</TableHead>
                  <TableHead className="font-semibold px-6 py-4">Fizetés / Forrás</TableHead>
                  <TableHead className="font-semibold px-6 py-4">Tételek száma</TableHead>
                  <TableHead className="text-right font-semibold px-6 py-4">Végösszeg (Net.)</TableHead>
                  <TableHead className="w-[100px] px-6 py-4"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <ShoppingBag className="w-8 h-8 opacity-20" />
                        <span>Még nincs rögzített beszerzés.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  purchases.map((purchase) => (
                    <TableRow key={purchase.id} className="hover:bg-slate-50/50 transition-colors group">
                      <TableCell className="px-6 py-4 font-medium text-slate-700">
                        {new Date(purchase.date).toLocaleDateString('hu-HU')}
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{purchase.supplier_name}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{purchase.invoice_number || 'Nincs bizonylatszám'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-slate-100 rounded text-[11px] font-bold text-slate-600 uppercase tracking-tighter shadow-sm border border-slate-200">
                          {getPaymentIcon(purchase.payment_method)}
                          {getPaymentLabel(purchase.payment_method)}
                        </div>
                      </TableCell>
                      <TableCell className="px-6 py-4 text-sm text-slate-600">
                         {purchase.purchase_items?.length || 0} tétel
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(purchase.total_net)}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 group-hover:text-emerald-600 group-hover:bg-emerald-50">
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5 flex items-start gap-4">
        <div className="bg-emerald-100 p-2 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-emerald-900 uppercase text-xs tracking-wider">Készlet automatizmus</h4>
          <p className="text-sm text-emerald-800 leading-relaxed">
            A beszerzés rögzítésekor a rendszer automatikusan **növeli az aktuális készletet** és **frissíti a beszerzési árat** a legfrissebb értékre.
            A készpénzes vásárlások azonnal megjelennek a Pénztár naplóban is.
          </p>
        </div>
      </div>
    </div>
  )
}
