import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit3, Tag, BarChart, UtensilsCrossed } from 'lucide-react'
import { TermekPricingForm } from '@/modules/products/components/TermekPricingForm'
import { TermekBasicInfoForm } from '@/modules/products/components/TermekBasicInfoForm'
import { formatCurrency, MOHU_FEE_FILLER } from '@/lib/finance'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function EtlapItemPage({ params }: PageProps) {
  const supabase = await createClient()
  const { id } = await params

  // 1. Termék + törzs adatok párhuzamos lekérése
  const [{ data: productRaw }, { data: categoriesRaw }, { data: unitsRaw }, { data: vatRatesRaw }] =
    await Promise.all([
      supabase
        .from('products')
        .select('*, categories(id, name), vat_rates(id, rate_percent)')
        .eq('id', id)
        .single(),
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('units').select('id, symbol').order('symbol'),
      supabase.from('vat_rates').select('id, rate_percent').eq('is_active', true).order('rate_percent'),
    ])

  if (!productRaw) notFound()
  const product = productRaw as any

  const categories = (categoriesRaw as any[]) ?? []
  const units = (unitsRaw as any[]) ?? []
  const vatRates = (vatRatesRaw as any[]) ?? []

  // 2. Törzsadatok kinyerése
  const categoryName = product.categories?.name || 'Besorolatlan'
  const vatRate = parseFloat(product.vat_rates?.rate_percent || '27')
  const isRecipeProduct = product.product_type === 'recipe_product'

  // 3. Ha recipe_product, lekérjük a hozzá tartozó recept ID-t (navigációhoz)
  let recipeId: string | null = null
  if (isRecipeProduct) {
    const { data: recipeData } = await (supabase.from('recipes') as any)
      .select('id')
      .eq('product_id', id)
      .maybeSingle()
    recipeId = recipeData?.id ?? null
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Fejléc és Vissza gomb */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Link href="/etlap" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Vissza az étlaphoz
            </Link>
            {recipeId && (
              <Link href={`/recipes/${recipeId}`} className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1.5 transition-colors font-medium">
                <UtensilsCrossed className="w-4 h-4" /> Receptúra szerkesztése →
              </Link>
            )}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">{product.name}</h1>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-700/10">
                {categoryName}
              </span>
            </div>
            <p className="mt-2 text-slate-500 flex items-center gap-1.5">
              <Tag className="w-4 h-4" /> 
              {isRecipeProduct ? 'Recept alapján készült termék' : 'Egyszerű áru (viszonteladás)'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Bal oldal: Alap adatok + Árazó Kalkulátor (2 oszlop) */}
        <div className="md:col-span-2 space-y-6">
          <TermekBasicInfoForm
            productId={product.id}
            initialName={product.name}
            initialCategoryId={product.category_id ?? ''}
            initialUnitId={product.unit_id ?? ''}
            initialVatRateId={product.default_vat_rate_id ?? ''}
            productType={product.product_type}
            categories={categories}
            units={units}
            vatRates={vatRates}
          />
          <TermekPricingForm
            productId={product.id}
            initialNetCost={product.purchase_price_net || 0}
            initialGrossSale={product.default_sale_price_gross || 0}
            isMohuFee={product.is_mohu_fee}
            vatRatePercent={vatRate}
            hasRecipe={isRecipeProduct}
          />
        </div>

        {/* Információs Panel (1 oszlop) */}
        <div className="space-y-6">
          <div className="bg-white border rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <BarChart className="w-5 h-5 text-indigo-500" />
                Jelenlegi Árak
              </div>
            </div>
            
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Nettó beszerzési érték</span>
                <span className="font-mono text-sm font-medium">{formatCurrency(product.purchase_price_net)}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700">
                <span className="text-sm">Bruttó eladási ár</span>
                <span className="font-mono font-bold text-lg">{formatCurrency(product.default_sale_price_gross)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">MOHU díj (AAM)</span>
                <span className={`font-mono text-sm font-semibold ${product.is_mohu_fee ? 'text-orange-600' : 'text-slate-400'}`}>
                  {product.is_mohu_fee ? `+${formatCurrency(MOHU_FEE_FILLER)}` : 'Nincs'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-5 text-amber-800 text-sm space-y-2 leading-relaxed">
            <h4 className="font-semibold flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Tippek az árazáshoz
            </h4>
            <p className="text-amber-700/80">
              A haszonkulcs módosítása azonnal újraszámolja a bruttó árat, figyelembe véve a {vatRate}%-os ÁFA kulcsot. A kerekítést te tudod megadni a bruttó ár közvetlen átírásával.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
