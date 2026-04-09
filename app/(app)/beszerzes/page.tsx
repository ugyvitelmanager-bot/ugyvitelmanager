import { createClient } from '@/lib/supabase/server'
import { Truck } from 'lucide-react'
import { NewPurchaseDialog } from '@/modules/purchases/components/NewPurchaseDialog'
import { ImportDialog } from '@/modules/purchases/components/ImportDialog'
import { PurchaseList } from '@/modules/purchases/components/PurchaseList'
import type { ProductOption, UnitOption, PurchaseRow } from '@/modules/purchases/types'

export const dynamic = 'force-dynamic'

export default async function BeszerzesPage() {
  const supabase = await createClient()

  const [purchasesRes, productsRes, unitsRes] = await Promise.all([
    (supabase.from('purchases') as any)
      .select('id, date, supplier_name, invoice_number, payment_method, total_net, net_amount, vat_amount, gross_amount, performance_date, invoice_date, due_date, is_settled, purchase_line_items(id)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(2000),

    (supabase.from('products') as any)
      .select('id, name, unit_id, units(id, symbol)')
      .eq('is_active', true)
      .in('product_type', ['ingredient', 'stock_product'])
      .order('name'),

    (supabase.from('units') as any)
      .select('id, symbol, name')
      .order('symbol'),
  ])

  const purchases: PurchaseRow[] = purchasesRes.data ?? []

  const products: ProductOption[] = (productsRes.data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    unit_id: p.unit_id ?? '',
    unit_symbol: p.units?.symbol ?? '',
  }))

  const units: UnitOption[] = (unitsRes.data ?? []).map((u: any) => ({
    id: u.id,
    symbol: u.symbol,
    name: u.name ?? null,
  }))

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-emerald-600" />
            Beszerzések
          </h1>
          <p className="mt-1 text-gray-500 text-sm">
            Számlák és bizonylatok rögzítése · Készlet és árak automatikus frissítése
          </p>
        </div>
        <div className="flex gap-2">
          <ImportDialog />
          <NewPurchaseDialog products={products} units={units} />
        </div>
      </div>

      {/* Lista */}
      <PurchaseList purchases={purchases} products={products} units={units} />
    </div>
  )
}
