import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit3, Tag, BarChart } from 'lucide-react'
import { RecipeBuilderForm } from '@/modules/recipes/components/RecipeBuilderForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const supabase = await createClient()
  const { id } = await params

  // 1. Recept és Összetevők lekérése
  const { data: recipeRaw } = await supabase
    .from('recipes')
    .select(`
      *,
      product:products!recipes_product_id_fkey (id, name, purchase_price_net, default_sale_price_gross),
      recipe_items(
        id,
        quantity,
        unit_id,
        ingredient:products!recipe_items_ingredient_product_id_fkey (
          id, name, purchase_price_net, unit_id
        )
      )
    `)
    .eq('id', id)
    .single()

  if (!recipeRaw) notFound()
  const recipe = recipeRaw as any

  // 2. Törzsadatok: Összes elérhető Alapanyag és Egységek
  const { data: unitsRaw } = await supabase.from('units').select('id, symbol')
  const units = (unitsRaw as { id: string, symbol: string }[]) || []

  const { data: ingredientsRaw } = await supabase
    .from('products')
    .select('id, name, purchase_price_net, unit_id')
    .in('product_type', ['ingredient', 'stock_product'])
    .order('name')
  const availableIngredients = (ingredientsRaw as any[]) || []

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Fejléc és Vissza gomb */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-4">
          <Link href="/recipes" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors w-fit">
            <ArrowLeft className="w-4 h-4" /> Vissza a Receptekhez
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{recipe.name}</h1>
              <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-semibold text-orange-700 ring-1 ring-inset ring-orange-700/10">
                Receptúra
              </span>
            </div>
            <p className="mt-2 text-slate-500">
              Ez a recept a(z) <strong>{recipe.product?.name}</strong> étlap tételhez kapcsolódik. A mentés gombra nyomva frissül az étlap nettó beszerzési értéke.
            </p>
          </div>
        </div>
      </div>

      <div className="w-full">
        {/* Receptúra Szerkesztő Kliens Komponens */}
        <RecipeBuilderForm 
          recipeId={recipe.id}
          productId={recipe.product_id}
          initialItems={recipe.recipe_items || []}
          availableIngredients={availableIngredients}
          units={units}
        />
      </div>
    </div>
  )
}
