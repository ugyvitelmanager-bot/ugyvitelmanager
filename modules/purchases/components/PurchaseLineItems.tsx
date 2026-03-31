'use client'

import { Button } from '@/components/ui/button'
import { PlusCircle, Layers } from 'lucide-react'
import { PurchaseLineRow } from './PurchaseLineRow'
import type { PurchaseLineItem, ProductOption, UnitOption } from '../types'

interface Props {
  items: PurchaseLineItem[]
  products: ProductOption[]
  units: UnitOption[]
  onAdd: () => void
  onRemove: (id: string) => void
  onProductSelect: (id: string, productId: string, unitId: string) => void
  onUpdate: (id: string, patch: Partial<Omit<PurchaseLineItem, 'id'>>) => void
  onQuickAdd: (itemId: string) => void
}

export function PurchaseLineItems({
  items,
  products,
  units,
  onAdd,
  onRemove,
  onProductSelect,
  onUpdate,
  onQuickAdd,
}: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
          <Layers className="w-4 h-4" />
          Tételek
        </h3>
        <Button variant="outline" size="sm" onClick={onAdd} className="text-xs h-8">
          <PlusCircle className="w-3 h-3 mr-1" />
          Sor hozzáadása
        </Button>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => (
          <PurchaseLineRow
            key={item.id}
            item={item}
            index={idx}
            products={products}
            units={units}
            canRemove={items.length > 1}
            onProductSelect={(productId, unitId) => onProductSelect(item.id, productId, unitId)}
            onUpdate={(patch) => onUpdate(item.id, patch)}
            onRemove={() => onRemove(item.id)}
            onQuickAdd={() => onQuickAdd(item.id)}
          />
        ))}
      </div>
    </div>
  )
}
