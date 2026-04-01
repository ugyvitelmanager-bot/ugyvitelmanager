'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Settings2, Save, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { updateProductBasicInfo } from '../actions'

const PRODUCT_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  recipe_product: { label: 'Saját készítésű', className: 'bg-orange-50 text-orange-700 ring-orange-700/10' },
  stock_product:  { label: 'Készáru (viszonteladás)', className: 'bg-indigo-50 text-indigo-700 ring-indigo-700/10' },
  ingredient:     { label: 'Alapanyag', className: 'bg-green-50 text-green-700 ring-green-700/10' },
}

interface Category { id: string; name: string }
interface Unit { id: string; symbol: string }
interface VatRate { id: string; rate_percent: string }

interface Props {
  productId: string
  initialName: string
  initialCategoryId: string
  initialUnitId: string
  initialVatRateId: string
  productType: string
  categories: Category[]
  units: Unit[]
  vatRates: VatRate[]
}

export function TermekBasicInfoForm({
  productId,
  initialName,
  initialCategoryId,
  initialUnitId,
  initialVatRateId,
  productType,
  categories,
  units,
  vatRates,
}: Props) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [unitId, setUnitId] = useState(initialUnitId)
  const [vatRateId, setVatRateId] = useState(initialVatRateId)
  const [isSaving, setIsSaving] = useState(false)

  const isRecipe = productType === 'recipe_product'
  const typeInfo = PRODUCT_TYPE_LABELS[productType] ?? { label: productType, className: 'bg-slate-50 text-slate-700 ring-slate-700/10' }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('A termék neve nem lehet üres.')
      return
    }
    setIsSaving(true)
    try {
      const result = await updateProductBasicInfo(productId, name, categoryId, unitId, vatRateId)
      if (result.success) {
        toast.success('Adatok frissítve.')
        router.refresh()
      } else {
        toast.error('Hiba: ' + result.error)
      }
    } catch {
      toast.error('Váratlan hiba történt.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="border shadow-sm">
      <CardHeader className="bg-slate-50 border-b py-4 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-700">
            <Settings2 className="w-4 h-4" />
            <CardTitle className="text-base font-semibold">Termék adatok</CardTitle>
          </div>
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${typeInfo.className}`}>
            {typeInfo.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pt-5 pb-5 px-6 space-y-4">
        {/* Név */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Megnevezés</Label>
          <Input
            value={name}
            onChange={e => setName(e.target.value)}
            className="font-medium"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Kategória */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">Kategória</Label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Egység — recipe_product esetén csak olvasható */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">
              Egység {isRecipe && <span className="text-xs text-slate-400 font-normal">(recept határozza meg)</span>}
            </Label>
            <select
              value={unitId}
              onChange={e => setUnitId(e.target.value)}
              disabled={isRecipe}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {units.map(u => (
                <option key={u.id} value={u.id}>{u.symbol}</option>
              ))}
            </select>
          </div>

          {/* ÁFA */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-slate-700">ÁFA kulcs</Label>
            <select
              value={vatRateId}
              onChange={e => setVatRateId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {vatRates.map(v => (
                <option key={v.id} value={v.id}>{v.rate_percent}%</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            variant="outline"
            className="gap-2"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Mentés
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
