import { createClient } from '@/lib/supabase/server'
import { formatCurrency, fillerToForint } from '@/lib/finance'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Package, Tag, Layers, Home } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProductsPage() {
  const supabase = await createClient()

  // Lekérjük a termékeket a kapcsolt kategóriákkal és egységekkel
  const { data: productsRaw, error } = await supabase
    .from('products')
    .select(`
      *,
      categories (name, business_area),
      units (symbol)
    `)
    .order('name', { ascending: true })

  const products = productsRaw as any[]

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Hiba történt a termékek betöltésekor: {error.message}
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Terméklista
          </h1>
          <p className="mt-2 text-gray-500">
            Összesen {products?.length} termék található a rendszerben (Büfé, Halas, Rendezvény).
          </p>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-[300px] font-semibold">Termék név</TableHead>
              <TableHead className="font-semibold">Kategória</TableHead>
              <TableHead className="font-semibold text-center">Üzletág</TableHead>
              <TableHead className="font-semibold">Egység</TableHead>
              <TableHead className="text-right font-semibold">Beszerzési (Nettó)</TableHead>
              <TableHead className="text-right font-semibold">Eladási (Bruttó)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products?.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <TableCell className="font-medium">
                  <div>
                    {item.name}
                    {item.sku && <div className="text-xs text-muted-foreground font-light">{item.sku}</div>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-sm">{item.categories?.name || '-'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className={`
                    inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset
                    ${item.categories?.business_area === 'buffet' 
                      ? 'bg-blue-50 text-blue-700 ring-blue-700/10' 
                      : 'bg-green-50 text-green-700 ring-green-700/10'}
                  `}>
                    {item.categories?.business_area === 'buffet' ? 'Büfé' : 'Halas'}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {item.units?.symbol}
                </TableCell>
                <TableCell className="text-right font-mono text-sm">
                  {item.purchase_price_net ? formatCurrency(item.purchase_price_net) : '-'}
                </TableCell>
                <TableCell className="text-right font-bold text-primary font-mono">
                  {item.default_sale_price_gross ? formatCurrency(item.default_sale_price_gross) : '-'}
                </TableCell>
              </TableRow>
            ))}
            {products?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Nincsenek termékek az adatbázisban. 🏁✨
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
