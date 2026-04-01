import { createClient } from '@/lib/supabase/server'
import { formatCurrency, MOHU_FEE_FILLER } from '@/lib/finance'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { FilterSelect } from '@/components/ui/filter-select'
import { UtensilsCrossed, Search, Info, ChevronRight, Calculator, PlusCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { CreateItemModal } from '@/modules/products/components/CreateItemModal'
import { ArchiveProductButton } from '@/modules/products/components/ArchiveProductButton'
import { Button } from '@/components/ui/button'
import { getJoined, deduplicateByName } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string; area?: string; archived?: string }>
}

export default async function EtlapPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams

  const queryStr = params.q || ''
  const categoryFilter = params.category || ''
  const areaFilter = params.area || ''
  const showArchived = params.archived === 'true'

  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('id, name, business_area')
    .order('name')
  // Duplikátumok szűrése
  const categories = deduplicateByName((categoriesRaw as any[]) || [])

  // Csak eladható termékek (recipe_product + stock_product), de nem alapanyagok
  let query = supabase
    .from('products')
    .select(`*, categories (id, name, business_area), units (symbol)`)
    .in('product_type', ['recipe_product', 'stock_product'])
    .neq('categories.name', 'Alapanyag')
    .order('name')

  if (queryStr) query = query.ilike('name', `%${queryStr}%`)
  if (categoryFilter) query = query.eq('category_id', categoryFilter)

  // Arhivált szűrés
  if (!showArchived) {
    query = query.eq('is_active', true)
  }

  const { data: productsRaw, error: dbError } = await query
  
  if (dbError) {
    return (
      <div className="p-8 text-red-600 bg-red-50 rounded-xl m-8">
        <strong>Adatbázis hiba:</strong> {dbError.message}
      </div>
    )
  }

  let products = (productsRaw as any[]) || []

  // Áfa kulcsok lekérése a létrehozó űrlaphoz
  const { data: vatRatesRaw } = await supabase.from('vat_rates').select('id, rate_percent').order('rate_percent')
  const vatRates = (vatRatesRaw as any[]) || []

  // Üzletág szűrés
  if (areaFilter) {
    products = products.filter(p => getJoined(p.categories)?.business_area === areaFilter)
  }

  const MOHU_FEE = MOHU_FEE_FILLER
  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
  const currentParams: Record<string, string> = {
    ...(queryStr && { q: queryStr }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(areaFilter && { area: areaFilter }),
    ...(showArchived && { archived: 'true' })
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <UtensilsCrossed className="w-8 h-8 text-primary" />
            Termékek (Étlap)
          </h1>
          <p className="mt-2 text-gray-500">
            {products.length} eladható termék kezelése.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={showArchived ? '/etlap' : '/etlap?archived=true'}>
            <Button variant={showArchived ? 'default' : 'outline'} size="sm" className={showArchived ? 'bg-orange-600 hover:bg-orange-700' : ''}>
              {showArchived ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showArchived ? 'Archiváltak elrejtése' : 'Archiváltak mutatása'}
            </Button>
          </Link>
          <CreateItemModal 
            categories={categories} 
            vatRates={vatRates} 
            defaultType="stock_product"
            triggerLabel="Új Tétel" 
          />
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
            {showArchived && <input type="hidden" name="archived" value="true" />}
          </form>
        </div>
        <FilterSelect name="area" value={areaFilter} placeholder="Összes üzletág" basePath="/etlap"
          currentParams={currentParams} options={[{ value: 'buffet', label: 'Büfé' }, { value: 'fish', label: 'Halas' }]} />
        <FilterSelect name="category" value={categoryFilter} placeholder="Összes kategória"
          basePath="/etlap" currentParams={currentParams} options={categoryOptions} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-semibold min-w-[200px]">Megnevezés</TableHead>
                <TableHead className="font-semibold">Kategória</TableHead>
                <TableHead className="text-right font-semibold">Anyagköltség (Σ)</TableHead>
                <TableHead className="text-right font-semibold">Tiszta Ár (Br.)</TableHead>
                <TableHead className="text-right font-semibold">Végösszeg (Br.)</TableHead>
                <TableHead className="w-[120px]"></TableHead>
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
                const isActive = item.is_active !== false

                return (
                  <TableRow key={item.id} className={`hover:bg-gray-50/50 transition-colors ${!isActive ? 'bg-slate-50 opacity-60' : ''}`}>
                    <TableCell className="font-medium">
                      <div className={!isActive ? 'line-through text-slate-400' : ''}>{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">{unit?.symbol}</div>
                      {!isActive && <div className="text-[9px] font-bold text-orange-600 uppercase mt-0.5">Archivált</div>}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase
                        ${cat?.business_area === 'fish' ? 'bg-green-50 text-green-700 ring-green-700/10' : 'bg-blue-50 text-blue-700 ring-blue-700/10'}`}>
                        {cat?.name || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground whitespace-nowrap">
                      {item.purchase_price_net ? formatCurrency(item.purchase_price_net) : '-'}
                    </TableCell>
                    <TableCell className={`text-right font-semibold font-mono whitespace-nowrap ${isMohu ? 'text-blue-600' : ''}`}>
                      {formatCurrency(cleanGross)}
                    </TableCell>
                    <TableCell className="text-right font-bold font-mono whitespace-nowrap">
                      <div>{formatCurrency(totalGross)}</div>
                      {isMohu && <div className="text-[10px] text-blue-700">+MOHU</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/etlap/${item.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-100">
                          <Calculator className="w-4 h-4" />
                        </Link>
                        <ArchiveProductButton productId={item.id} isActive={isActive} />
                      </div>
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
