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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Package, Search, RotateCcw, Info, AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    area?: string
  }>
}

export default async function ProductsPage({ searchParams }: PageProps) {
  try {
    const supabase = await createClient()
    const params = await searchParams
    
    const queryStr = params.q || ''
    const categoryFilter = params.category || ''
    const areaFilter = params.area || ''

    // Kategóriák lekérése a szűrőhöz
    const { data: categoriesRaw } = await supabase
      .from('categories')
      .select('id, name, business_area')
      .order('name')
    
    const categories = (categoriesRaw as any[]) || []

    // Termékek lekérése (biztonságos Join-nal)
    // Megjegyzés: Ha üzletágra szűrünk, az inner join (!inner) stabilabb
    let selectQuery = `
      *,
      categories${areaFilter ? '!inner' : ''} (id, name, business_area),
      units (symbol)
    `

    let query = supabase
      .from('products')
      .select(selectQuery)
      .order('name', { ascending: true })

    if (queryStr) {
      query = query.ilike('name', `%${queryStr}%`)
    }
    if (categoryFilter) {
      query = query.eq('category_id', categoryFilter)
    }
    if (areaFilter) {
      query = query.eq('categories.business_area', areaFilter)
    }

    const { data: productsRaw, error } = await query
    
    if (error) throw error

    const products = (productsRaw as any[]) || []

    // MOHU konstans (50 Ft = 5000 fillér)
    const MOHU_FEE = 5000

    // Segédfüggvény a joined adatok biztonságos eléréséhez (néha tömbként jön vissza)
    const getSafeJoinedData = (data: any) => {
      if (!data) return null
      return Array.isArray(data) ? data[0] : data
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
              Összesen {products.length} termék. Szűrés üzletágra és kategóriára.
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/settings/import">
              <Button variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Adatok frissítése
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border">
          <div className="relative col-span-1 md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <form action="/products" method="GET">
              <Input 
                name="q" 
                placeholder="Keresés név alapján..." 
                defaultValue={queryStr}
                className="pl-10"
              />
              {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
              {areaFilter && <input type="hidden" name="area" value={areaFilter} />}
            </form>
          </div>
          
          <form action="/products" method="GET" className="flex gap-2 col-span-1 md:col-span-2">
            {queryStr && <input type="hidden" name="q" value={queryStr} />}
            
            <select 
              name="area" 
              defaultValue={areaFilter}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onChange={(e) => e.target.form?.submit()}
            >
              <option value="">Összes üzletág</option>
              <option value="buffet">Büfé</option>
              <option value="fish">Halas</option>
            </select>

            <select 
              name="category" 
              defaultValue={categoryFilter}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onChange={(e) => e.target.form?.submit()}
            >
              <option value="">Összes kategória</option>
              {categories?.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </form>
        </div>

        {/* Info Banner for MOHU */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-700">
          <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            <strong>MOHU Betétdíj:</strong> A betétdíjas termékeknél a Bruttó ár már tartalmazza az 50 Ft-os fix állami díjat. 
            Az önköltség számításakor és árrésnél a betétdíj nélküli árat vesszük alapul.
          </p>
        </div>

        {/* Table container with overflow-x-auto for mobile */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="font-semibold min-w-[200px]">Termék név</TableHead>
                  <TableHead className="font-semibold text-center">Üzletág</TableHead>
                  <TableHead className="font-semibold">Kategória</TableHead>
                  <TableHead className="text-right font-semibold">Beszerzési (N.)</TableHead>
                  <TableHead className="text-right font-semibold">Tiszta Ár (Br.)</TableHead>
                  <TableHead className="text-right font-semibold">Bruttó ár</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      Nincsenek találatok a szűrésnek megfelelően.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((item) => {
                    const totalGross = item.default_sale_price_gross || 0
                    const isMohu = item.is_mohu_fee
                    const cleanGross = isMohu ? totalGross - MOHU_FEE : totalGross
                    
                    const catObj = getSafeJoinedData(item.categories)
                    const unitObj = getSafeJoinedData(item.units)

                    return (
                      <TableRow key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span>{item.name}</span>
                            <span className="text-[10px] text-muted-foreground uppercase">{unitObj?.symbol || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`
                            inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold ring-1 ring-inset uppercase
                            ${catObj?.business_area === 'fish' 
                              ? 'bg-green-50 text-green-700 ring-green-700/10' 
                              : 'bg-blue-50 text-blue-700 ring-blue-700/10'}
                          `}>
                            {catObj?.business_area === 'fish' ? 'Halas' : 'Büfé'}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          {catObj?.name || '-'}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm opacity-80 whitespace-nowrap">
                          {item.purchase_price_net ? formatCurrency(item.purchase_price_net) : '-'}
                        </TableCell>
                        <TableCell className={`text-right font-semibold font-mono whitespace-nowrap ${isMohu ? 'text-blue-600' : ''}`}>
                          {formatCurrency(cleanGross)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900 font-mono whitespace-nowrap">
                          <div className="flex flex-col items-end">
                            <span>{formatCurrency(totalGross)}</span>
                            {isMohu && (
                              <span className="text-[9px] bg-blue-100 text-blue-800 px-1 rounded font-bold uppercase">
                                +50 Ft Betétdíj
                              </span>
                            )}
                          </div>
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
  } catch (error: any) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="bg-red-50 border border-red-200 p-6 rounded-xl max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-red-800 mb-2">Hiba történt az adatok betöltésekor</h2>
          <p className="text-sm text-red-600 mb-4">{error.message || 'Ismeretlen hiba lépett fel.'}</p>
          <Button onClick={() => window.location.reload()} variant="outline">Próbálja újra</Button>
        </div>
      </div>
    )
  }
}
