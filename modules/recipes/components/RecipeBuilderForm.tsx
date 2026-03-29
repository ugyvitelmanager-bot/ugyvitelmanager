'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2, Plus, Save, RefreshCw, ChefHat, Search } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/finance'
import { saveRecipeItems, RecipeItemPayload } from '../actions'

interface AvailableIngredient {
  id: string
  name: string
  purchase_price_net: number // In fillér per default unit
  unit_id: string
}

interface Unit {
  id: string
  symbol: string
}

interface RecipeItemFormState {
  _tempId: string
  ingredient_product_id: string
  quantity: number | string
  unit_id: string
}

interface BuilderProps {
  recipeId: string
  productId: string
  initialItems: any[]
  availableIngredients: AvailableIngredient[]
  units: Unit[]
}

export function RecipeBuilderForm({
  recipeId,
  productId,
  initialItems,
  availableIngredients,
  units
}: BuilderProps) {
  // Inicializálás meglévő tételekből
  const [items, setItems] = useState<RecipeItemFormState[]>(() => {
    return initialItems.map(item => ({
      _tempId: Math.random().toString(36).substring(7),
      ingredient_product_id: item.ingredient?.id || '',
      quantity: item.quantity || 0,
      unit_id: item.unit_id || ''
    }))
  })

  const [isSaving, setIsSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Gombok és Célmértékegység varázsló
  const getDisplayUnitAndCost = (item: RecipeItemFormState) => {
    const ingredient = availableIngredients.find(i => i.id === item.ingredient_product_id)
    if (!ingredient) return { symbol: '?', costTotal: 0 }

    const ingrUnit = units.find(u => u.id === ingredient.unit_id)?.symbol.toLowerCase() || ''
    const itemUnit = units.find(u => u.id === item.unit_id)?.symbol.toLowerCase() || ''
    const qty = parseFloat(item.quantity as string) || 0
    const priceGrossPerUnit = ingredient.purchase_price_net / 100 // To Forints

    let costTotal = 0
    let displaySymbol = itemUnit || ingrUnit

    // Automatikus konverziós logika (Beszerzés vs. Recept)
    // Ha mi kg-ban vesszük (ingredient.unit), de az űrlap 'gr'-ben tette be
    if (ingrUnit === 'kg' && itemUnit === 'gr') {
      costTotal = priceGrossPerUnit * (qty / 1000)
    } 
    else if (ingrUnit === 'l' && itemUnit === 'ml') {
      costTotal = priceGrossPerUnit * (qty / 1000)
    } 
    // Minden más esetben, vagy ha egyezik a kettő
    else {
      costTotal = priceGrossPerUnit * qty
    }

    return { symbol: displaySymbol, costTotal }
  }

  // Összes nettó beszerzési érték
  const totalNetCost = useMemo(() => {
    return items.reduce((sum, item) => sum + getDisplayUnitAndCost(item).costTotal, 0)
  }, [items, availableIngredients, units])

  // UI Eseménykezelők
  const handleAddItem = (ingredientId: string) => {
    const ingredient = availableIngredients.find(i => i.id === ingredientId)
    if (!ingredient) return

    const ingrUnit = units.find(u => u.id === ingredient.unit_id)?.symbol.toLowerCase() || ''
    
    // Alapértelmezett választás recepthez
    let defaultRecipeUnitId = ingredient.unit_id
    if (ingrUnit === 'kg') {
      const gUnit = units.find(u => u.symbol.toLowerCase() === 'gr' || u.symbol.toLowerCase() === 'g')
      if (gUnit) defaultRecipeUnitId = gUnit.id
    } else if (ingrUnit === 'l') {
      const mlUnit = units.find(u => u.symbol.toLowerCase() === 'ml')
      if (mlUnit) defaultRecipeUnitId = mlUnit.id
    }

    setItems([...items, {
      _tempId: Math.random().toString(36).substring(7),
      ingredient_product_id: ingredientId,
      quantity: '', // üres az induláshoz, hogy a user beírhassa
      unit_id: defaultRecipeUnitId
    }])
    setSearchTerm('')
  }

  const handleRemoveItem = (tempId: string) => {
    setItems(items.filter(i => i._tempId !== tempId))
  }

  const handleUpdateQuantity = (tempId: string, value: string) => {
    setItems(items.map(i => i._tempId === tempId ? { ...i, quantity: value } : i))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Validáció
      if (items.some(i => !i.quantity || parseFloat(i.quantity as string) <= 0)) {
        toast.error('Kérlek adj meg érvényes mennyiséget minden sorhoz!')
        setIsSaving(false)
        return
      }

      const payload: RecipeItemPayload[] = items.map(i => ({
        ingredient_product_id: i.ingredient_product_id,
        quantity: parseFloat(i.quantity as string),
        unit_id: i.unit_id
      }))

      // Filléres mentés a Supabase-be
      const totalNetCents = Math.round(totalNetCost * 100)
      const res = await saveRecipeItems(recipeId, productId, payload, totalNetCents)

      if (res.success) toast.success('Receptúra sikeresen mentve! Étlap árazó frissítve.')
      else toast.error('Hiba: ' + res.error)

    } catch (err) {
      toast.error('Váratlan hiba mentés közben.')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredIngredients = availableIngredients.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !items.some(item => item.ingredient_product_id === i.id) // Csak ami nincs még a listában
  )

  return (
    <Card className="border-2 shadow-sm">
      <CardHeader className="bg-slate-50 border-b pb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-primary">
              <ChefHat className="w-5 h-5" />
              <CardTitle>Recept Összetevők</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Add hozzá az eladandó termék alapanyagait. A nyersanyagköltséget a rendszer élőben számolja és szinkronizálja az Étlap felé.
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Nettó Anyagköltség (Σ)</p>
            <p className="text-3xl font-bold font-mono text-indigo-700">{formatCurrency(totalNetCost * 100)}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6 pt-6 bg-slate-50/30">
        
        {/* Alapanyag Választó */}
        <div className="bg-white border rounded-xl p-4 shadow-sm">
          <Label className="text-sm font-semibold text-slate-700 mb-2 block">Új alapanyag hozzáadása a raktárból</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Keress alapanyagra (pl. Liszt, Mozzarella...)" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 h-12 text-base border-slate-300 focus-visible:ring-indigo-500"
            />
          </div>
          
          {/* Találati lista */}
          {searchTerm && filteredIngredients.length > 0 && (
            <div className="absolute z-10 w-full max-w-2xl mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
              {filteredIngredients.map(ing => (
                <button
                  key={ing.id}
                  onClick={() => handleAddItem(ing.id)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 border-b last:border-0 flex justify-between items-center group transition-colors"
                >
                  <span className="font-medium text-slate-700">{ing.name}</span>
                  <span className="text-xs text-slate-400 group-hover:text-indigo-600 transition-colors">Hozzáadás +</span>
                </button>
              ))}
            </div>
          )}
          {searchTerm && filteredIngredients.length === 0 && (
            <div className="mt-2 text-sm text-slate-500 italic px-2">Nincs találat.</div>
          )}
        </div>

        {/* Kiválasztott Összetevők Listája */}
        <div className="space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-400 border-2 border-dashed rounded-xl border-slate-200">
              Még nincs kiválasztva alapanyag. Keress a fenti mezőben!
            </div>
          ) : (
            items.map((item, idx) => {
              const ingr = availableIngredients.find(i => i.id === item.ingredient_product_id)
              const { symbol, costTotal } = getDisplayUnitAndCost(item)

              return (
                <div key={item._tempId} className="flex flex-col sm:flex-row gap-4 items-center bg-white p-3 rounded-lg border shadow-sm group">
                  <div className="flex-1 w-full">
                    <p className="font-semibold text-slate-800">{ingr?.name}</p>
                    <p className="text-xs text-slate-400 uppercase tracking-widest">{ingr ? formatCurrency(ingr.purchase_price_net) : ''}/{units.find(u => u.id === ingr?.unit_id)?.symbol}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Input 
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity}
                      onChange={e => handleUpdateQuantity(item._tempId, e.target.value)}
                      className="w-24 font-mono text-center border-indigo-200 focus-visible:ring-indigo-500"
                      placeholder="0.00"
                    />
                    <span className="w-10 text-xs font-bold text-slate-400 uppercase">{symbol}</span>
                  </div>

                  <div className="w-32 text-right">
                    <p className="font-mono font-bold text-slate-700">{formatCurrency(costTotal * 100)}</p>
                  </div>

                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleRemoveItem(item._tempId)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )
            })
          )}
        </div>

        {/* Mentés Gomb */}
        <div className="pt-6 border-t flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || items.length === 0}
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8 h-12 shadow-lg transition-all"
          >
            {isSaving ? <RefreshCw className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Receptúra & Költség Mentése
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
