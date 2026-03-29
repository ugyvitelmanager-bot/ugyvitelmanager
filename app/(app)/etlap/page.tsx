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
import { FilterSelect } from '@/components/ui/filter-select'
import { UtensilsCrossed, Search, Info, ChevronRight, Calculator } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; area?: string }>
}

export default async function EtlapPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const queryStr = params.q || ''
  const categoryFilter = params.category || ''
  const areaFilter = params.area || ''

  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('id, name, business_area')
    .order('name')
  // Duplikátumok szűrése
  const seen = new Set<string>()
  const categories = ((categoriesRaw as any[]) || []).filter(c => {
    const key = c.name.toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Csak eladható termékek (recipe_product + stock_product), de nem alapanyagok
  let query = supabase
    .from('products')
    .select(`*, categories (id, name, business_area), units (symbol)`)
    .in('product_type', ['recipe_product', 'stock_product'])
    .neq('categories.name', 'Alapanyag')
    .order('name')

  if (queryStr) query = query.ilike('name', `%${queryStr}%`)
  if (categoryFilter) query = query.eq('category_id', categoryFilter)

  const { data: productsRaw } = await query
  let products = (productsRaw as any[]) || []

  // Üzletág szűrés
  const getJoined = (data: any) => (Array.isArray(data) ? data[0] : data)
  if (areaFilter) {
    products = products.filter(p => getJoined(p.categories)?.business_area === areaFilter)
  }

  const MOHU_FEE = 5000
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
  const currentParams: Record<string, string> = {}
  if (queryStr) currentParams.q = queryStr
  if (categoryFilter) currentParams.category = categoryFilter
  if (areaFilter) currentParams.area = areaFilter

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
            Étlap
          </h1>
          <p className="mt-2 text-gray-500">
            {products.length} eladható termék. Árak, betétdíj és kategóriák.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border">
        <div className="relative col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <form action="/etlap" method="GET">
            <input name="q" placeholder="Keresés..." defaultValue={queryStr}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
            {areaFilter && <input type="hidden" name="area" value={areaFilter} />}
          </form>
        </div>
        <FilterSelect name="area" value={areaFilter} placeholder="Összes üzletág" basePath="/etlap"
          currentParams={currentParams} options={[{ value: 'buffet', label: 'Büfé' }, { value: 'fish', label: 'Halas' }]} />
        <FilterSelect name="category" value={categoryFilter} placeholder="Összes kategória"
          basePath="/etlap" currentParams={currentParams} options={categoryOptions} />
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p><strong>Betétdíj:</strong> A „Tiszta Ár" a betétdíj nélküli eladási ár. Az „Összes Br." tartalmazza az 50 Ft-os MOHU díjat is.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-semibold min-w-[200px]">Termék</TableHead>
                <TableHead className="font-semibold">Kategória</TableHead>
                <TableHead className="font-semibold text-center">ÁFA</TableHead>
                <TableHead className="text-right font-semibold">Nettó önköltség</TableHead>
                <TableHead className="text-right font-semibold">Tiszta Ár (Br.)</TableHead>
                <TableHead className="text-right font-semibold">Összes Br.</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nincs találat.</TableCell></TableRow>
              ) : products.map((item) => {
                const totalGross = item.default_sale_price_gross || 0
                const isMohu = item.is_mohu_fee
                const cleanGross = isMohu ? totalGross - MOHU_FEE : totalGross
                const cat = getJoined(item.categories)
                const unit = getJoined(item.units)

                return (
                  <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    <TableCell className="font-medium">
                      <div>{item.name}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{unit?.symbol}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase
                        ${cat?.business_area === 'fish' ? 'bg-green-50 text-green-700 ring-green-700/10' : 'bg-blue-50 text-blue-700 ring-blue-700/10'}`}>
                        {cat?.name || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-xs font-mono text-muted-foreground">
                      {item.default_vat_rate_id ? '27% / 5%' : '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground whitespace-nowrap">
                      {item.purchase_price_net ? formatCurrency(item.purchase_price_net) : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-semibold font-mono whitespace-nowrap ${isMohu ? 'text-blue-600' : ''}`}>
                      {formatCurrency(cleanGross)}
                    </TableCell>
                    <TableCell className="text-right font-bold font-mono whitespace-nowrap">
                      <div>{formatCurrency(totalGross)}</div>
                      {isMohu && <div className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded font-bold uppercase">+50 Ft MOHU</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/etlap/${item.id}`} className="inline-flex h-8 items-center justify-center rounded-md bg-indigo-50 px-3 text-sm font-medium text-indigo-600 transition-colors hover:bg-indigo-100 uppercase tracking-widest gap-2">
                        <Calculator className="w-4 h-4" />
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
