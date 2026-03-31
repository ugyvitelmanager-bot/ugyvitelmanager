'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Trash2, Sparkles } from 'lucide-react'
import type { PurchaseLineItem, ProductOption, UnitOption } from '../types'

interface Props {
  item: PurchaseLineItem
  index: number
  products: ProductOption[]
  units: UnitOption[]
  canRemove: boolean
  onProductSelect: (productId: string, unitId: string) => void
  onUpdate: (patch: Partial<Omit<PurchaseLineItem, 'id'>>) => void
  onRemove: () => void
  onQuickAdd: () => void
}

export function PurchaseLineRow({
  item,
  index,
  products,
  units,
  canRemove,
  onProductSelect,
  onUpdate,
  onRemove,
  onQuickAdd,
}: Props) {
  const showHeaders = index === 0

  const handleProductChange = (productId: string | null) => {
    if (!productId) return
    const product = products.find(p => p.id === productId)
    onProductSelect(productId, product?.unit_id ?? '')
  }

  return (
    <div className="grid grid-cols-12 gap-2 items-end bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
      {/* Termék */}
      <div className="col-span-4 space-y-1">
        {showHeaders && (
          <div className="flex items-center justify-between mb-1">
            <Label className="text-[10px] uppercase font-bold text-slate-400">Termék</Label>
          </div>
        )}
        <div className="flex gap-1">
          <Select
            value={item.productId}
            onValueChange={handleProductChange}
          >
            <SelectTrigger className="h-9 flex-1">
              <SelectValue placeholder="Válassz terméket..." />
            </SelectTrigger>
            <SelectContent>
              {products.map(p => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onQuickAdd}
            className="h-9 w-9 shrink-0 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            title="Új termék hozzáadása"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Mennyiség */}
      <div className="col-span-2 space-y-1">
        {showHeaders && <Label className="text-[10px] uppercase font-bold text-slate-400">Mennyiség</Label>}
        <Input
          type="number"
          step="0.01"
          min="0.01"
          value={item.quantity === 0 ? '' : item.quantity}
          onChange={(e) => onUpdate({ quantity: Number(e.target.value) })}
          className="h-9"
        />
      </div>

      {/* Egység */}
      <div className="col-span-2 space-y-1">
        {showHeaders && <Label className="text-[10px] uppercase font-bold text-slate-400">Egység</Label>}
        <Select
          value={item.unitId}
          onValueChange={(v: string | null) => v && onUpdate({ unitId: v })}
        >
          <SelectTrigger className="h-9">
            <SelectValue placeholder="Egység" />
          </SelectTrigger>
          <SelectContent>
            {units.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.symbol}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nettó Egységár */}
      <div className="col-span-3 space-y-1">
        {showHeaders && <Label className="text-[10px] uppercase font-bold text-slate-400">Nettó Egységár</Label>}
        <div className="relative">
          <Input
            type="number"
            step="1"
            min="1"
            value={item.unitPrice === 0 ? '' : item.unitPrice}
            onChange={(e) => onUpdate({ unitPrice: Number(e.target.value) })}
            className="h-9 pr-8"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Ft</span>
        </div>
      </div>

      {/* Törlés */}
      <div className="col-span-1 flex justify-center">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          disabled={!canRemove}
          className="h-9 w-9 text-slate-300 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
