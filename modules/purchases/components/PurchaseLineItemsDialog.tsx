'use client'

import { useReducer, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { List, RefreshCw, Save, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { purchaseFormReducer, getInitialState } from '../lib/purchaseFormReducer'
import { applyPurchaseLineItems } from '../actions'
import { PurchaseLineItems } from './PurchaseLineItems'
import { QuickAddProductDialog } from './QuickAddProductDialog'
import { formatCurrency } from '@/lib/finance'
import type { ProductOption, UnitOption, PurchaseRow } from '../types'

interface Props {
  purchase: PurchaseRow
  products: ProductOption[]
  units: UnitOption[]
  onClose: () => void
}

export function PurchaseLineItemsDialog({ purchase, products: initialProducts, units, onClose }: Props) {
  const router = useRouter()
  const [isPending, setIsPending] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [localProducts, setLocalProducts] = useState<ProductOption[]>(initialProducts)

  const [state, dispatch] = useReducer(purchaseFormReducer, null, getInitialState)

  const totalNet = state.items.reduce((sum, i) => {
    if (i.kind === 'product') return sum + Number(i.quantity) * Number(i.unitPrice)
    return sum + Number(i.amount)
  }, 0)

  // Eltérés: a tételek nettó összege vs a fejléc nettó összege
  const headerNet = purchase.net_amount !== null ? purchase.net_amount / 100 : null
  const mismatch = headerNet !== null && state.items.length > 0 && Math.abs(totalNet - headerNet) > 1

  const handleQuickAdd = (itemId: string) => {
    setActiveItemId(itemId)
    setIsQuickAddOpen(true)
  }

  const handleQuickAddSuccess = (product: { id: string; name: string; unit_id: string; unit_symbol: string }) => {
    setLocalProducts(prev => {
      if (prev.some(p => p.id === product.id)) return prev
      return [...prev, product]
    })
    if (activeItemId) {
      dispatch({ type: 'SELECT_PRODUCT', id: activeItemId, productId: product.id, unitId: product.unit_id })
    }
    setIsQuickAddOpen(false)
    setActiveItemId(null)
  }

  const handleSave = async () => {
    if (state.items.length === 0) {
      toast.error('Legalább egy sort adj meg!')
      return
    }

    for (const item of state.items) {
      if (item.kind === 'product') {
        if (!item.productId) { toast.error('Minden termék sorban válassz terméket!'); return }
        if (Number(item.quantity) <= 0) { toast.error('Minden sorban adj meg mennyiséget!'); return }
        if (Number(item.unitPrice) <= 0) { toast.error('Minden sorban adj meg egységárat!'); return }
      } else {
        if (!item.description.trim()) { toast.error('Minden egyéb sor megnevezése kötelező!'); return }
        if (Number(item.amount) <= 0) { toast.error('Minden egyéb sorban adj meg összeget!'); return }
      }
    }

    setIsPending(true)
    try {
      const items = state.items.map(i => {
        if (i.kind === 'product') {
          return { kind: 'product' as const, product_id: i.productId, quantity: Number(i.quantity), unit_id: i.unitId, unit_price_net: Number(i.unitPrice) }
        } else {
          return { kind: 'cost' as const, description: i.description, unit_price_net: Number(i.amount) }
        }
      })

      const res = await applyPurchaseLineItems(purchase.id, items)

      if (res.success) {
        if (mismatch) {
          toast.warning(
            `Tételek mentve, de eltérés van: fejléc nettó ${formatCurrency(headerNet!)} vs tételek ${formatCurrency(totalNet)}`,
            { duration: 6000 }
          )
        } else {
          toast.success('Tételek mentve! Készlet és árak frissítve.')
        }
        onClose()
        router.refresh()
      } else {
        toast.error(res.error ?? 'Hiba történt.')
      }
    } catch {
      toast.error('Hiba történt a mentés során.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent className="sm:max-w-5xl max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-indigo-700">
              <List className="w-5 h-5" />
              Tételek — {purchase.supplier_name}
            </DialogTitle>
            <p className="text-xs text-slate-400 mt-1">
              A pénzügyi bejegyzés már megvan. A tételek mentése csak készletet és árakat frissít.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Fejléc összeg emlékeztető */}
            {headerNet !== null && (
              <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                <span className="text-slate-500">Fejléc nettó összeg:</span>
                <span className="font-mono font-bold text-slate-800">{formatCurrency(headerNet)}</span>
                {purchase.gross_amount !== null && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500">Bruttó:</span>
                    <span className="font-mono font-bold text-slate-800">{formatCurrency(purchase.gross_amount / 100)}</span>
                  </>
                )}
              </div>
            )}

            <PurchaseLineItems
              items={state.items}
              products={localProducts}
              units={units}
              onAddProduct={() => dispatch({ type: 'ADD_PRODUCT_ITEM' })}
              onAddCost={() => dispatch({ type: 'ADD_COST_ITEM' })}
              onRemove={(id) => dispatch({ type: 'REMOVE_ITEM', id })}
              onProductSelect={(id, productId, unitId) =>
                dispatch({ type: 'SELECT_PRODUCT', id, productId, unitId })
              }
              onUpdate={(id, patch) => dispatch({ type: 'UPDATE_ITEM', id, patch })}
              onQuickAdd={handleQuickAdd}
            />

            {/* Eltérés figyelmeztetés */}
            {mismatch && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-300 px-3 py-2.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-800">Összeg eltérés: </span>
                  <span className="text-amber-700">
                    Fejléc nettó {formatCurrency(headerNet!)} · Tételek összege {formatCurrency(totalNet)} · Eltérés {formatCurrency(Math.abs(totalNet - headerNet!))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              {state.items.length > 0 && (
                <>
                  <span className="text-xs text-slate-500 uppercase font-bold mr-2">Tételek összesen (Nettó):</span>
                  <span className={`text-2xl font-black ${mismatch ? 'text-amber-700' : 'text-slate-900'}`}>
                    {formatCurrency(totalNet)}
                  </span>
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isPending}>
                Mégse
              </Button>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 min-w-[140px]"
                onClick={handleSave}
                disabled={isPending}
              >
                {isPending
                  ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  : <Save className="w-4 h-4 mr-2" />}
                Tételek mentése
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <QuickAddProductDialog
        isOpen={isQuickAddOpen}
        onClose={() => { setIsQuickAddOpen(false); setActiveItemId(null) }}
        onSuccess={handleQuickAddSuccess}
        units={units}
      />
    </>
  )
}
