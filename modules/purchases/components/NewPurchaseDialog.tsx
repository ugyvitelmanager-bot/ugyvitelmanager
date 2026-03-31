'use client'

import { useReducer, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle, ShoppingCart, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { purchaseFormReducer, getInitialState } from '../lib/purchaseFormReducer'
import { validatePurchaseForm } from '../lib/purchaseValidation'
import { recordPurchase } from '../actions'
import { PurchaseForm } from './PurchaseForm'
import { PurchaseLineItems } from './PurchaseLineItems'
import { QuickAddProductDialog } from './QuickAddProductDialog'
import { formatCurrency } from '@/lib/finance'
import type { ProductOption, UnitOption } from '../types'

interface Props {
  products: ProductOption[]
  units: UnitOption[]
}

export function NewPurchaseDialog({ products: initialProducts, units }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [localProducts, setLocalProducts] = useState<ProductOption[]>(initialProducts)

  const [state, dispatch] = useReducer(purchaseFormReducer, null, getInitialState)

  // Termék sorok: qty * unitPrice; cost sorok: amount
  const totalNet = state.items.reduce((sum, i) => {
    if (i.kind === 'product') return sum + Number(i.quantity) * Number(i.unitPrice)
    return sum + Number(i.amount)
  }, 0)

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (!open) dispatch({ type: 'RESET' })
  }

  const handleQuickAdd = (itemId: string) => {
    setActiveItemId(itemId)
    setIsQuickAddOpen(true)
  }

  const handleQuickAddSuccess = (product: { id: string; name: string; unit_id: string; unit_symbol: string }) => {
    setLocalProducts(prev => {
      if (prev.some(p => p.id === product.id)) return prev
      return [...prev, { id: product.id, name: product.name, unit_id: product.unit_id, unit_symbol: product.unit_symbol }]
    })
    if (activeItemId) {
      dispatch({ type: 'SELECT_PRODUCT', id: activeItemId, productId: product.id, unitId: product.unit_id })
    }
    setIsQuickAddOpen(false)
    setActiveItemId(null)
  }

  const handleSubmit = async () => {
    const error = validatePurchaseForm(state)
    if (error) {
      toast.error(error)
      return
    }

    setIsPending(true)
    try {
      const items = state.items.map(i => {
        if (i.kind === 'product') {
          return {
            kind: 'product' as const,
            product_id: i.productId,
            quantity: Number(i.quantity),
            unit_id: i.unitId,
            unit_price_net: Number(i.unitPrice),
          }
        } else {
          return {
            kind: 'cost' as const,
            description: i.description,
            unit_price_net: Number(i.amount),
          }
        }
      })

      const res = await recordPurchase(
        state.date,
        state.supplier,
        state.invoiceNumber,
        state.paymentMethod,
        items,
        totalNet
      )

      if (res.success) {
        toast.success('Beszerzés sikeresen rögzítve! Készlet és árak frissítve.')
        dispatch({ type: 'RESET' })
        setIsOpen(false)
        router.refresh()
      } else {
        toast.error(res.error ?? 'Hiba történt a mentés során.')
      }
    } catch {
      toast.error('Hiba történt a mentés során.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpen}>
        <DialogTrigger
          render={
            <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm gap-2">
              <PlusCircle className="w-4 h-4" />
              Új Beszerzés
            </Button>
          }
        />

        <DialogContent className="sm:max-w-5xl max-w-[95vw] max-h-[90vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-emerald-700">
              <ShoppingCart className="w-5 h-5" />
              Beszerzési Számla Rögzítése
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <PurchaseForm
              state={state}
              onDateChange={(v) => dispatch({ type: 'SET_DATE', value: v })}
              onSupplierChange={(v) => dispatch({ type: 'SET_SUPPLIER', value: v })}
              onInvoiceChange={(v) => dispatch({ type: 'SET_INVOICE', value: v })}
              onPaymentChange={(v) => dispatch({ type: 'SET_PAYMENT', value: v })}
            />

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
          </div>

          <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold mr-2">Összesen (Nettó):</span>
              <span className="text-2xl font-black text-slate-900">{formatCurrency(totalNet)}</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
                Mégse
              </Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700 min-w-[140px] shadow-md shadow-emerald-200"
                onClick={handleSubmit}
                disabled={isPending}
              >
                {isPending
                  ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  : <ShoppingCart className="w-4 h-4 mr-2" />}
                Számla mentése
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
