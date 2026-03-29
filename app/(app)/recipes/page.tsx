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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { BookOpen, Utensils, Info, Printer, Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{
    q?: string
    category?: string
  }>
}

export default async function RecipesPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const params = await searchParams
  
  const queryStr = params.q || ''
  const categoryFilter = params.category || ''

  // Kategóriák lekérése a szűrőhöz
  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select('id, name')
    .order('name')

  const categories = (categoriesRaw as any[]) || []

  // Receptek lekérése szűrővel
  let query = supabase
    .from('recipes')
    .select(`
      *,
      product:products (id, name, default_sale_price_gross, category_id),
      recipe_items (
        id,
        quantity,
        ingredient:products (name, purchase_price_net),
        unit:units (symbol)
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  if (queryStr) {
    query = query.ilike('name', `%${queryStr}%`)
  }

  const { data: recipesRaw, error } = await query
  let recipes = (recipesRaw as any[]) || []

  // Kategória szűrés (mivel a product-on keresztül van)
  if (categoryFilter) {
    recipes = recipes.filter(r => r.product?.category_id === categoryFilter)
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
            Összesen {recipes.length} receptúra található. Tételes összetevők és önköltség elemzés.
          </p>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border">
        <div className="relative col-span-1 md:col-span-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <form action="/recipes" method="GET">
            <Input 
              name="q" 
              placeholder="Keresés étel szerint..." 
              defaultValue={queryStr}
              className="pl-10"
            />
            {categoryFilter && <input type="hidden" name="category" value={categoryFilter} />}
          </form>
        </div>
        
        <form action="/recipes" method="GET" className="col-span-1">
          {queryStr && <input type="hidden" name="q" value={queryStr} />}
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

      {recipes.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
          <Utensils className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Nincsenek találatok</h3>
          <p className="mt-1 text-sm text-gray-500">Próbálja módosítani a szűrési feltételeket.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {recipes.map((recipe) => {
            const totalCost = recipe.recipe_items?.reduce((sum: number, item: any) => {
              const itemCost = (item.quantity * (item.ingredient?.purchase_price_net || 0))
              return sum + itemCost
            }, 0) || 0
            
            const saleGross = recipe.product?.default_sale_price_gross || 0
            const profitStr = saleGross > totalCost ? formatCurrency(saleGross - totalCost) : 'Negatív árrés!'

            return (
              <Card key={recipe.id} className="overflow-hidden shadow-lg border-2 border-gray-100 hover:border-primary/20 transition-all">
                <CardHeader className="bg-gray-100/50 pb-6 border-b">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-xl">
                        <Utensils className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl font-bold text-gray-900">{recipe.name}</CardTitle>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 py-0.5 bg-gray-200 rounded">
                          Kalkulációs Lap
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
                      <Button variant="outline" size="icon" className="hidden md:flex" title="Letöltés (Hamarosan)">
                        <Printer className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white/50 hover:bg-white/50">
                        <TableHead className="w-[45%] text-[10px] font-bold uppercase tracking-tight py-4">Alapanyag</TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase tracking-tight py-4">Mennyiség</TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase tracking-tight py-4">Egységár (N.)</TableHead>
                        <TableHead className="text-right text-[10px] font-bold uppercase tracking-tight py-4">Érték (N.)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipe.recipe_items?.map((item: any) => {
                        const lineCost = item.quantity * (item.ingredient?.purchase_price_net || 0)
                        return (
                          <TableRow key={item.id} className="text-sm border-b hover:bg-gray-50/30">
                            <TableCell className="font-semibold text-gray-800">{item.ingredient?.name}</TableCell>
                            <TableCell className="text-right font-medium">
                              {item.quantity} {item.unit?.symbol}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground font-mono text-xs">
                              {formatCurrency(item.ingredient?.purchase_price_net || 0)}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-700 font-mono">
                              {formatCurrency(lineCost)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {/* Summary Row */}
                      <TableRow className="bg-gray-50/80 font-bold border-t-2">
                        <TableCell colSpan={3} className="text-right py-5 uppercase tracking-tighter text-gray-500">
                          Összesített Nettó Önköltség
                        </TableCell>
                        <TableCell className="text-right py-5 text-gray-900 border-l border-gray-100 font-mono">
                          {formatCurrency(totalCost)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className="p-4 bg-primary/5 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 text-primary font-bold">
                      <Info className="w-3.5 h-3.5" />
                      Az árrés jelenleg: <span className="bg-white px-2 py-0.5 rounded shadow-sm">{profitStr}</span>
                    </div>
                    <span className="text-muted-foreground italic">Feldolgozva: {new Date().toLocaleDateString('hu-HU')}</span>
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
