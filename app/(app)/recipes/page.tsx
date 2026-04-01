import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/finance'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { FilterSelect } from '@/components/ui/filter-select'
import { BookOpen, Utensils, Info, Printer, Search, ChefHat, PlusCircle, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'
import { CreateItemModal } from '@/modules/products/components/CreateItemModal'
import { ArchiveProductButton } from '@/modules/products/components/ArchiveProductButton'
import { getJoined, deduplicateByName } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    archived?: string
  }>
}

export default async function RecipesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
  const queryStr = params.q || ''
  const categoryFilter = params.category || ''
  const showArchived = params.archived === 'true'

  // Kategóriák (duplikátumok szűrése)
  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')
  const categories = deduplicateByName((categoriesRaw as any[]) || [])

  // Receptek
  let query = supabase
    .from('recipes')
    .select(`
      *,
      product:products (id, name, default_sale_price_gross, category_id, is_active),
      recipe_items (
        id,
        quantity,
        ingredient:products (name, purchase_price_net),
        unit:units (symbol)
      )
    `)
    .order('name', { ascending: true })

  if (queryStr) query = query.ilike('name', `%${queryStr}%`)
  
  // Archivált szűrés
  if (!showArchived) {
    query = query.eq('is_active', true)
  }

  const { data: recipesRaw, error } = await query
  
  if (error) {
    return (
      <div className="p-8 text-red-600 bg-red-50 rounded-xl m-8">
        <strong>Adatbázis hiba:</strong> {error.message}
      </div>
    )
  }

  let recipes = (recipesRaw as any[]) || []

  // Áfa kulcsok lekérése a létrehozó űrlaphoz
  const { data: vatRatesRaw } = await supabase.from('vat_rates').select('id, rate_percent').order('rate_percent')
  const vatRates = (vatRatesRaw as any[]) || []

  if (categoryFilter) {
    recipes = recipes.filter(r => {
      const prod = getJoined(r.product)
      return prod?.category_id === categoryFilter
    })
  }

  const categoryOptions = categories.map(c => ({ value: c.id, label: c.name }))
  const currentParams: Record<string, string> = {
    ...(queryStr && { q: queryStr }),
    ...(categoryFilter && { category: categoryFilter }),
    ...(showArchived && { archived: 'true' })
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Receptúrák & Kalkulációk
          </h1>
          <p className="mt-2 text-gray-500">
            {recipes.length} receptúra kezelése.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={showArchived ? '/recipes' : '/recipes?archived=true'}>
            <Button variant={showArchived ? 'default' : 'outline'} size="sm" className={showArchived ? 'bg-orange-600 hover:bg-orange-700' : ''}>
              {showArchived ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showArchived ? 'Archiváltak elrejtése' : 'Archiváltak mutatása'}
            </Button>
          </Link>
          <CreateItemModal 
            categories={categories} 
            vatRates={vatRates} 
            defaultType="recipe_product"
            triggerLabel="Új Receptúra" 
          />
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border">
        <div className="relative col-span-1 md:col-span-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <form action="/recipes" method="GET">
            <input
              name="q"
              placeholder="Keresés étel szerint..."
              defaultValue={queryStr}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
            {showArchived && <input type="hidden" name="archived" value="true" />}
          </form>
        </div>

        <FilterSelect
          name="category"
          value={categoryFilter}
          placeholder="Összes kategória"
          basePath="/recipes"
          currentParams={currentParams}
          options={categoryOptions}
        />
      </div>

      {recipes.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
          <Utensils className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Nincsenek találatok</h3>
          <p className="mt-1 text-sm text-gray-500">Próbálja módosítani a szűrési feltételeket.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {recipes.map((recipe) => {
            const items = recipe.recipe_items || []
            const prod = getJoined(recipe.product)
            const isActive = recipe.is_active !== false

            const totalCost = items.reduce((sum: number, item: any) => {
              const ingredient = getJoined(item.ingredient)
              return sum + (item.quantity * (ingredient?.purchase_price_net || 0))
            }, 0)
            
            const saleGross = prod?.default_sale_price_gross || 0
            const profit = saleGross - totalCost
            const profitLabel = profit >= 0 ? formatCurrency(profit) : 'Negatív árrés!'

            return (
              <Card key={recipe.id} className={`overflow-hidden shadow-lg border-2 transition-all ${!isActive ? 'border-orange-100 bg-slate-50 opacity-80' : 'border-gray-100 hover:border-primary/20'}`}>
                <CardHeader className={`${!isActive ? 'bg-orange-50' : 'bg-gray-100/50'} pb-6 border-b`}>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`${!isActive ? 'bg-orange-200' : 'bg-primary/10'} p-3 rounded-xl`}>
                        <Utensils className={`w-6 h-6 ${!isActive ? 'text-orange-700' : 'text-primary'}`} />
                      </div>
                      <div>
                        <CardTitle className={`text-2xl font-bold ${!isActive ? 'text-orange-900 line-through' : 'text-gray-900'}`}>{recipe.name}</CardTitle>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 py-0.5 bg-gray-200 rounded">
                          {isActive ? 'Kalkulációs Lap' : 'Archivált Recept'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 pr-4">
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Önköltség</div>
                        <div className="text-lg font-bold text-gray-700">{formatCurrency(totalCost)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Eladási Ár</div>
                        <div className="text-xl font-black text-primary">{formatCurrency(saleGross)}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`/recipes/${recipe.id}`} className="inline-flex h-10 items-center justify-center rounded-md bg-orange-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-orange-700 uppercase tracking-widest gap-2">
                          <ChefHat className="w-4 h-4" />
                          Szerkesztés
                        </Link>
                        <ArchiveProductButton productId={recipe.product_id} isActive={isActive} />
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white/50 hover:bg-white/50">
                        <TableHead className="w-[45%] text-[10px] font-bold uppercase tracking-tight py-4 px-6 text-slate-500">Alapanyag</TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase tracking-tight py-4 text-slate-500">Mennyiség</TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase tracking-tight py-4 text-slate-500">Egységár (N.)</TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase tracking-tight py-4 px-6 text-slate-500">Érték (N.)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item: any) => {
                        const ingredient = getJoined(item.ingredient)
                        const unit = getJoined(item.unit)
                        const lineCost = item.quantity * (ingredient?.purchase_price_net || 0)
                        return (
                          <TableRow key={item.id} className="text-sm border-b hover:bg-gray-50/30">
                            <TableCell className="font-semibold text-gray-800 px-6 py-4">{ingredient?.name || '-'}</TableCell>
                            <TableCell className="text-right font-medium">
                              {item.quantity} {unit?.symbol || ''}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground font-mono text-xs whitespace-nowrap">
                              {formatCurrency(ingredient?.purchase_price_net || 0)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-700 font-mono whitespace-nowrap px-6">
                              {formatCurrency(lineCost)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="bg-gray-50/80 font-bold border-t-2">
                        <TableCell colSpan={3} className="text-right py-5 px-6 uppercase tracking-tighter text-gray-400">
                          Összesített Nettó Anyagdíj
                        </TableCell>
                        <TableCell className="text-right py-5 text-indigo-700 border-l border-gray-100 font-mono whitespace-nowrap px-6 text-lg">
                          {formatCurrency(totalCost)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className={`p-4 flex justify-between items-center text-xs ${!isActive ? 'bg-orange-50/50' : 'bg-primary/5'}`}>
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <span className="text-gray-500 uppercase">Haszonkulcs kalkuláció:</span>
                      <span className={`bg-white px-2 py-1 rounded shadow-sm border ${profit < 0 ? 'text-red-600 border-red-200' : 'text-emerald-700 border-emerald-100'}`}>{profitLabel}</span>
                    </div>
                    <span className="text-muted-foreground italic">Frissítve: {new Date().toLocaleDateString('hu-HU')}</span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
