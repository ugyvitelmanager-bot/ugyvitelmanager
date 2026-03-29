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
import { BookOpen, Utensils, Info } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function RecipesPage() {
  const supabase = await createClient()

  // Lekérjük a recepteket a hozzájuk tartozó termékekkel és összetevőkkel
  const { data: recipesRaw, error } = await supabase
    .from('recipes')
    .select(`
      *,
      product:products (name, default_sale_price_gross),
      recipe_items (
        id,
        quantity,
        ingredient:products (name, purchase_price_net),
        unit:units (symbol)
      )
    `)
    .eq('is_active', true)
    .order('name', { ascending: true })

  const recipes = recipesRaw as any[]

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Hiba történt a receptek betöltésekor: {error.message}
      </div>
    )
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-primary" />
            Receptböngésző
          </h1>
          <p className="mt-2 text-gray-500">
            Ellenőrizze az importált ételek összetételét és önköltségét.
          </p>
        </div>
      </div>

      {recipes?.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-xl border-2 border-dashed">
          <Utensils className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Nincsenek receptek</h3>
          <p className="mt-1 text-sm text-gray-500">Az importálás során nem találtunk receptúra adatokat.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {recipes?.map((recipe) => {
            // Önköltség számítás a betöltött adatok alapján
            const totalCost = recipe.recipe_items?.reduce((sum: number, item: any) => {
              const itemCost = (item.quantity * (item.ingredient?.purchase_price_net || 0))
              return sum + itemCost
            }, 0) || 0

            return (
              <Card key={recipe.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow border-l-4 border-l-primary">
                <CardHeader className="bg-gray-50/50 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900">{recipe.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Késztermék: <span className="font-medium text-gray-700">{recipe.product?.name}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Végfelhasználói ár</div>
                      <div className="text-lg font-bold text-primary">
                        {recipe.product?.default_sale_price_gross ? formatCurrency(recipe.product.default_sale_price_gross) : '-'}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white hover:bg-white">
                        <TableHead className="w-[40%] text-xs font-bold uppercase py-3">Összetevő</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase py-3">Mennyiség</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase py-3">Beszerzési ár</TableHead>
                        <TableHead className="text-right text-xs font-bold uppercase py-3">Sor költsége</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recipe.recipe_items?.map((item: any) => {
                        const lineCost = item.quantity * (item.ingredient?.purchase_price_net || 0)
                        return (
                          <TableRow key={item.id} className="text-sm border-b last:border-0">
                            <TableCell className="font-medium">{item.ingredient?.name}</TableCell>
                            <TableCell className="text-right">
                              {item.quantity} {item.unit?.symbol}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {item.ingredient?.purchase_price_net ? formatCurrency(item.ingredient.purchase_price_net) : '-'}
                            </TableCell>
                            <TableCell className="text-right font-mono">
                              {formatCurrency(lineCost)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {/* Summary Row */}
                      <TableRow className="bg-primary/5 font-bold border-t-2">
                        <TableCell colSpan={3} className="text-right py-4 uppercase tracking-tight">Összesített önköltség (Nettó)</TableCell>
                        <TableCell className="text-right py-4 text-primary text-base">
                          {formatCurrency(totalCost)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className="p-4 bg-blue-50/50 flex items-start gap-2 border-t">
                    <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Az önköltség az importálás pillanatában érvényes beszerzési árak alapján lett kalkulálva. 
                      A haszonkulcs a bruttó eladási ár és a nettó önköltség különbségéből fakad.
                    </p>
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
