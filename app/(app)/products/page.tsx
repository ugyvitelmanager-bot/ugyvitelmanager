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
import { Button } from '@/components/ui/button'
import { FilterSelect } from '@/components/ui/filter-select'
import { Package, Search, RotateCcw, Info, Eye, EyeOff, PlusCircle } from 'lucide-react'
import Link from 'next/link'
import { ProductUnitEditor } from '@/modules/products/components/ProductUnitEditor'
import { ArchiveProductButton } from '@/modules/products/components/ArchiveProductButton'
import { CreateItemModal } from '@/modules/products/components/CreateItemModal'
import { getJoined, deduplicateByName } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    area?: string
    archived?: string
  }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
  const queryStr = params.q || ''
  const categoryFilter = params.category || ''
  const areaFilter = params.area || ''
  const showArchived = params.archived === 'true'

  // Kategóriák lekérése a szűrőhöz
  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('id, name, business_area')
    .order('name')
  
  const categories = deduplicateByName((categoriesRaw as any[]) || [])

  // Mértékegységek + ÁFA kulcsok lekérése
  const [{ data: unitsRaw }, { data: vatRatesRaw }] = await Promise.all([
    supabase.from('units').select('id, symbol').order('symbol'),
    supabase.from('vat_rates').select('id, rate_percent').eq('is_active', true).order('rate_percent'),
  ])
  const allUnits = (unitsRaw as any[]) || []
  const vatRates = (vatRatesRaw as any[]) || []

  // Termékek lekérése — csak ingredient típus
  let query = supabase
    .from('products')
    .select(`
      *,
      categories (id, name, business_area),
      units (id, symbol)
    `)
    .eq('product_type', 'ingredient')
    .order('name', { ascending: true })

  if (queryStr) query = query.ilike('name', `%${queryStr}%`)
  if (categoryFilter) query = query.eq('category_id', categoryFilter)
  
  // Archivált szűrés
  if (!showArchived) {
    query = query.eq('is_active', true)
  }

  const { data: productsRaw, error } = await query
  
  if (error) {
    return (
      <div className="p-8 text-red-600 bg-red-50 rounded-xl m-8">
        <p className="font-bold flex items-center gap-2 mb-2">
          <Info className="w-5 h-5" /> Adatbázis hiba
        </p>
        <p className="text-sm">{error.message}</p>
        {error.message.includes('is_active') && (
          <div className="mt-4 p-3 bg-white border border-red-200 rounded text-xs">
            <strong>Megoldás:</strong> Úgy tűnik hiányzik az `is_active` oszlop. 
            Futtasd ezt az SQL-t a Supabase SQL Editorban:
            <code className="block mt-1 p-1 bg-gray-100 rounded">
              ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
            </code>
          </div>
        )}
      </div>
    )
  }

  let products = (productsRaw as any[]) || []

  if (areaFilter) {
    products = products.filter((p) => {
      const cat = Array.isArray(p.categories) ? p.categories[0] : p.categories
      return cat?.business_area === areaFilter
    })
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-primary" />
            Alapanyagok
          </h1>
          <p className="mt-2 text-gray-500">
            {products.length} alapanyag — receptúrákhoz és beszerzésekhez.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={showArchived ? '/products' : '/products?archived=true'}>
            <Button variant={showArchived ? 'default' : 'outline'} size="sm" className={showArchived ? 'bg-orange-600 hover:bg-orange-700' : ''}>
              {showArchived ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showArchived ? 'Archiváltak elrejtése' : 'Archiváltak mutatása'}
            </Button>
          </Link>
          <Link href="/settings/import">
            <Button variant="outline" size="sm">
              <RotateCcw className="w-4 h-4 mr-2" />
              Frissítés CSV-ből
            </Button>
          </Link>
          <CreateItemModal
            categories={categories}
            vatRates={vatRates}
            defaultType="ingredient"
            triggerLabel="Új Alapanyag"
            triggerIcon={<PlusCircle className="mr-2 h-4 w-4" />}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <form action="/products" method="GET">
            <input
              name="q"
              placeholder="Keresés név alapján..."
              defaultValue={queryStr}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
            {areaFilter && <input type="hidden" name="area" value={areaFilter} />}
            {showArchived && <input type="hidden" name="archived" value="true" />}
          </form>
        </div>

        <FilterSelect
          name="area"
          value={areaFilter}
          placeholder="Összes üzletág"
          basePath="/products"
          currentParams={currentParams}
          options={[
            { value: 'buffet', label: 'Büfé' },
            { value: 'fish', label: 'Halas' },
          ]}
        />

        <FilterSelect
          name="category"
          value={categoryFilter}
          placeholder="Összes kategória"
          basePath="/products"
          currentParams={currentParams}
          options={categoryOptions}
        />
      </div>

      {/* MOHU info */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-700">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <p>
          <strong>Mértékegység javítás:</strong> Ha a raktárba bekerült termék mértékegysége (pl. hús) tévesen "DB", itt átállíthatod "KG"-ra, hogy a receptúra grammban számoljon.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow>
                <TableHead className="font-semibold min-w-[200px]">Megnevezés</TableHead>
                <TableHead className="font-semibold text-center">Egység</TableHead>
                <TableHead className="font-semibold">Kategória</TableHead>
                <TableHead className="text-right font-semibold">Beszerzési Ár</TableHead>
                <TableHead className="text-right font-semibold">Eladási Ár (Br.)</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nincsenek találatok.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((item) => {
                  const totalGross = item.default_sale_price_gross || 0
                  const isMohu = item.is_mohu_fee
                  const cat = getJoined(item.categories)
                  const unit = getJoined(item.units)
                  const isActive = item.is_active !== false

                  return (
                    <TableRow key={item.id} className={`hover:bg-gray-50/50 transition-colors ${!isActive ? 'bg-slate-50 opacity-60' : ''}`}>
                      <TableCell className="font-medium px-6 py-4">
                        <div className="flex flex-col">
                          <span className={!isActive ? 'line-through text-slate-400' : ''}>{item.name}</span>
                          {!isActive && <span className="text-[10px] font-bold text-orange-600 uppercase tracking-tighter">Archivált</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center px-4">
                        <div className="inline-block">
                          <ProductUnitEditor 
                            productId={item.id} 
                            currentUnitId={item.unit_id} 
                            units={allUnits} 
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                         <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ring-inset uppercase mr-2
                          ${cat?.business_area === 'fish'
                            ? 'bg-green-50 text-green-700 ring-green-700/10'
                            : 'bg-blue-50 text-blue-700 ring-blue-700/10'}`}>
                          {cat?.business_area === 'fish' ? 'Halas' : 'Büfé'}
                        </span>
                        {cat?.name || '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm opacity-80 whitespace-nowrap">
                        {item.purchase_price_net ? formatCurrency(item.purchase_price_net) : '0 Ft'}
                      </TableCell>
                      <TableCell className="text-right font-bold text-gray-900 font-mono whitespace-nowrap">
                         {formatCurrency(totalGross)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ArchiveProductButton productId={item.id} isActive={isActive} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
