'use client'

import { Button } from '@/components/ui/button'
import { PlusCircle, Package, Receipt, Layers } from 'lucide-react'
import { PurchaseLineRow } from './PurchaseLineRow'
import { CostLineRow } from './CostLineRow'
import type { PurchaseLineItem, ProductOption, UnitOption } from '../types'

interface Props {
  items: PurchaseLineItem[]
  products: ProductOption[]
  units: UnitOption[]
  onAddProduct: () => void
  onAddCost: () => void
  onRemove: (id: string) => void
  onProductSelect: (id: string, productId: string, unitId: string) => void
  onUpdate: (id: string, patch: Partial<Omit<PurchaseLineItem, 'id' | 'kind'>>) => void
  onQuickAdd: (itemId: string) => void
}

export function PurchaseLineItems({
  items,
  products,
  units,
  onAddProduct,
  onAddCost,
  onRemove,
  onProductSelect,
  onUpdate,
  onQuickAdd,
}: Props) {
  // Fejléc indexek: az első termék sor és az első cost sor mutat fejlécet
  const firstProductIdx = items.findIndex(i => i.kind === 'product')
  const firstCostIdx = items.findIndex(i => i.kind === 'cost')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700 flex items-center gap-2 text-sm">
          <Layers className="w-4 h-4" />
          Tételek
        </h3>
      </div>

      <div className="space-y-2">
        {items.map((item, idx) => {
          if (item.kind === 'product') {
            // Fejléc mutatása az első termék sornál
            const isFirstOfKind = idx === firstProductIdx
            return (
              <PurchaseLineRow
                key={item.id}
                item={item}
                index={isFirstOfKind ? 0 : 1}
                products={products}
                units={units}
                canRemove={items.length > 1}
                onProductSelect={(productId, unitId) => onProductSelect(item.id, productId, unitId)}
                onUpdate={(patch) => onUpdate(item.id, patch)}
                onRemove={() => onRemove(item.id)}
                onQuickAdd={() => onQuickAdd(item.id)}
              />
            )
          } else {
            // Fejléc mutatása az első cost sornál
            const isFirstOfKind = idx === firstCostIdx
            return (
              <CostLineRow
                key={item.id}
                item={item}
                index={isFirstOfKind ? 0 : 1}
                canRemove={items.length > 1}
                onUpdate={(patch) => onUpdate(item.id, patch)}
                onRemove={() => onRemove(item.id)}
              />
            )
          }
        })}
      </div>

      {/* Két külön hozzáadás gomb */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          onClick={onAddProduct}
          className="text-xs h-8 border-slate-300 text-slate-600 hover:border-slate-400"
        >
          <Package className="w-3 h-3 mr-1.5" />
          Termék hozzáadása
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddCost}
          className="text-xs h-8 border-blue-200 text-blue-600 hover:border-blue-400 hover:bg-blue-50"
        >
          <Receipt className="w-3 h-3 mr-1.5" />
          Egyéb költség
        </Button>
      </div>
    </div>
  )
}
