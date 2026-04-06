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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, ShoppingCart, RefreshCw, Zap, List } from 'lucide-react'
import { toast } from 'sonner'
import { purchaseFormReducer, getInitialState } from '../lib/purchaseFormReducer'
import { validatePurchaseForm } from '../lib/purchaseValidation'
import { recordPurchase, recordPurchaseHeader } from '../actions'
import { PurchaseForm } from './PurchaseForm'
import { PurchaseLineItems } from './PurchaseLineItems'
import { QuickAddProductDialog } from './QuickAddProductDialog'
import { PaymentMethodSelect } from './PaymentMethodSelect'
import { formatCurrency } from '@/lib/finance'
import type { ProductOption, UnitOption, PaymentMethod } from '../types'

interface Props {
  products: ProductOption[]
  units: UnitOption[]
}

const today = new Date().toISOString().split('T')[0]

const EMPTY_SIMPLE = {
  date: today,
  supplierName: '',
  invoiceNumber: '',
  paymentMethod: 'cash' as PaymentMethod,
  netAmount: '',
  vatAmount: '',
  grossAmount: '',
  performanceDate: '',
  invoiceDate: '',
  dueDate: '',
}

export function NewPurchaseDialog({ products: initialProducts, units }: Props) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [mode, setMode] = useState<'simple' | 'itemized'>('simple')

  // Gyors mód állapot
  const [simple, setSimple] = useState(EMPTY_SIMPLE)

  // Tételes mód — extra fejléc mezők (ÁFA, bruttó, dátumok)
  const [itemizedHeader, setItemizedHeader] = useState({
    vatAmount: '',
    grossAmount: '',
    performanceDate: '',
    invoiceDate: '',
    dueDate: '',
  })

  // Tételes mód állapot (meglévő reducer)
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const [localProducts, setLocalProducts] = useState<ProductOption[]>(initialProducts)
  const [state, dispatch] = useReducer(purchaseFormReducer, null, getInitialState)

  const itemizedTotalNet = state.items.reduce((sum, i) => {
    if (i.kind === 'product') return sum + Number(i.quantity) * Number(i.unitPrice)
    return sum + Number(i.amount)
  }, 0)

  // Tételes mód: bruttó auto-kalkuláció nettó + ÁFA alapján
  const handleItemizedVatChange = (value: string) => {
    setItemizedHeader(prev => {
      const vat = parseFloat(value) || 0
      return {
        ...prev,
        vatAmount: value,
        grossAmount: (itemizedTotalNet + vat) > 0 ? String(itemizedTotalNet + vat) : prev.grossAmount,
      }
    })
  }

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      dispatch({ type: 'RESET' })
      setSimple(EMPTY_SIMPLE)
      setItemizedHeader({ vatAmount: '', grossAmount: '', performanceDate: '', invoiceDate: '', dueDate: '' })
    }
  }

  // Gyors mód: nettó + ÁFA → bruttó auto-kalkuláció
  const handleSimpleAmountChange = (field: 'netAmount' | 'vatAmount' | 'grossAmount', value: string) => {
    setSimple(prev => {
      const next = { ...prev, [field]: value }
      const net = parseFloat(field === 'netAmount' ? value : prev.netAmount) || 0
      const vat = parseFloat(field === 'vatAmount' ? value : prev.vatAmount) || 0
      if (field === 'netAmount' || field === 'vatAmount') {
        next.grossAmount = (net + vat) > 0 ? String(net + vat) : next.grossAmount
      }
      return next
    })
  }

  const handleSimpleSubmit = async () => {
    if (!simple.supplierName.trim()) { toast.error('Add meg a szállítót!'); return }
    if (!simple.date) { toast.error('Add meg a dátumot!'); return }
    const net = parseFloat(simple.netAmount)
    const gross = parseFloat(simple.grossAmount)
    if (!net || net <= 0) { toast.error('Add meg a nettó összeget!'); return }
    if (!gross || gross <= 0) { toast.error('Add meg a bruttó összeget!'); return }

    setIsPending(true)
    try {
      const vat = parseFloat(simple.vatAmount) || 0
      const res = await recordPurchaseHeader(
        simple.date,
        simple.supplierName,
        simple.invoiceNumber,
        simple.paymentMethod,
        net,
        vat,
        gross,
        simple.performanceDate || null,
        simple.invoiceDate || null,
        simple.dueDate || null,
      )
      if (res.success) {
        toast.success('Számla rögzítve!')
        setSimple(EMPTY_SIMPLE)
        setIsOpen(false)
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

  // Tételes mód
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

  const handleItemizedSubmit = async () => {
    const error = validatePurchaseForm(state)
    if (error) { toast.error(error); return }

    setIsPending(true)
    try {
      const items = state.items.map(i => {
        if (i.kind === 'product') {
          return { kind: 'product' as const, product_id: i.productId, quantity: Number(i.quantity), unit_id: i.unitId, unit_price_net: Number(i.unitPrice) }
        } else {
          return { kind: 'cost' as const, description: i.description, unit_price_net: Number(i.amount) }
        }
      })
      const res = await recordPurchase(
        state.date, state.supplier, state.invoiceNumber, state.paymentMethod, items, itemizedTotalNet,
        {
          vatAmountFt:     parseFloat(itemizedHeader.vatAmount) || 0,
          grossAmountFt:   parseFloat(itemizedHeader.grossAmount) || 0,
          performanceDate: itemizedHeader.performanceDate || null,
          invoiceDate:     itemizedHeader.invoiceDate || null,
          dueDate:         itemizedHeader.dueDate || null,
        }
      )
      if (res.success) {
        toast.success('Beszerzés rögzítve! Készlet és árak frissítve.')
        dispatch({ type: 'RESET' })
        setIsOpen(false)
        router.refresh()
      } else {
        toast.error(res.error ?? 'Hiba történt.')
      }
    } catch {
      toast.error('Hiba történt.')
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
              Új Beszerzés Rögzítése
            </DialogTitle>
          </DialogHeader>

          {/* Mód választó */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setMode('simple')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                mode === 'simple'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-sm'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              Gyors rögzítés
            </button>
            <button
              type="button"
              onClick={() => setMode('itemized')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                mode === 'itemized'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-800 shadow-sm'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Tételes rögzítés
            </button>
          </div>

          {/* Gyors mód form */}
          {mode === 'simple' && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-slate-400">Csak a számla adatait rögzíted — tételeket később bármikor hozzáadhatsz.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/60 p-4 rounded-lg border border-slate-100">
                <div className="space-y-2">
                  <Label>Szállító neve *</Label>
                  <Input
                    placeholder="Pl. METRO, Pek-Snack..."
                    value={simple.supplierName}
                    onChange={e => setSimple(p => ({ ...p, supplierName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bizonylatszám</Label>
                  <Input
                    placeholder="Számlaszám (opcionális)"
                    value={simple.invoiceNumber}
                    onChange={e => setSimple(p => ({ ...p, invoiceNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Teljesítés dátuma *</Label>
                  <Input
                    type="date"
                    value={simple.date}
                    onChange={e => setSimple(p => ({ ...p, date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kiállítás dátuma</Label>
                  <Input
                    type="date"
                    value={simple.invoiceDate}
                    onChange={e => setSimple(p => ({ ...p, invoiceDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fizetési határidő</Label>
                  <Input
                    type="date"
                    value={simple.dueDate}
                    onChange={e => setSimple(p => ({ ...p, dueDate: e.target.value }))}
                  />
                </div>
                <PaymentMethodSelect value={simple.paymentMethod} onChange={v => setSimple(p => ({ ...p, paymentMethod: v }))} />
              </div>

              <div className="grid grid-cols-3 gap-3 bg-slate-50/60 p-4 rounded-lg border border-slate-100">
                <div className="space-y-2">
                  <Label>Nettó összeg (Ft) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={simple.netAmount}
                    onChange={e => handleSimpleAmountChange('netAmount', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>ÁFA összeg (Ft)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={simple.vatAmount}
                    onChange={e => handleSimpleAmountChange('vatAmount', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bruttó összeg (Ft) *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={simple.grossAmount}
                    onChange={e => handleSimpleAmountChange('grossAmount', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tételes mód form */}
          {mode === 'itemized' && (
            <div className="space-y-6 py-2">
              <PurchaseForm
                state={state}
                onDateChange={(v) => dispatch({ type: 'SET_DATE', value: v })}
                onSupplierChange={(v) => dispatch({ type: 'SET_SUPPLIER', value: v })}
                onInvoiceChange={(v) => dispatch({ type: 'SET_INVOICE', value: v })}
                onPaymentChange={(v) => dispatch({ type: 'SET_PAYMENT', value: v })}
              />

              {/* Extra dátumok + ÁFA/bruttó — ugyanaz mint gyors módban */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/60 px-4 py-3 rounded-lg border border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-bold text-slate-400">Teljesítés dátuma</Label>
                  <Input type="date" value={itemizedHeader.performanceDate} onChange={e => setItemizedHeader(p => ({ ...p, performanceDate: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-bold text-slate-400">Kiállítás dátuma</Label>
                  <Input type="date" value={itemizedHeader.invoiceDate} onChange={e => setItemizedHeader(p => ({ ...p, invoiceDate: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-bold text-slate-400">Fizetési határidő</Label>
                  <Input type="date" value={itemizedHeader.dueDate} onChange={e => setItemizedHeader(p => ({ ...p, dueDate: e.target.value }))} className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-bold text-slate-400">ÁFA összeg (Ft)</Label>
                  <Input type="number" min="0" step="1" placeholder="0" value={itemizedHeader.vatAmount} onChange={e => handleItemizedVatChange(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] uppercase font-bold text-slate-400">Bruttó összeg (Ft)</Label>
                  <Input type="number" min="0" step="1" placeholder="auto: nettó + ÁFA" value={itemizedHeader.grossAmount} onChange={e => setItemizedHeader(p => ({ ...p, grossAmount: e.target.value }))} className="h-8 text-sm" />
                </div>
              </div>

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
          )}

          <DialogFooter className="border-t pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {mode === 'itemized' && (
              <div>
                <span className="text-xs text-slate-500 uppercase font-bold mr-2">Összesen (Nettó):</span>
                <span className="text-2xl font-black text-slate-900">{formatCurrency(itemizedTotalNet)}</span>
              </div>
            )}
            {mode === 'simple' && (
              <div>
                {simple.grossAmount && (
                  <>
                    <span className="text-xs text-slate-500 uppercase font-bold mr-2">Fizetendő (Bruttó):</span>
                    <span className="text-2xl font-black text-slate-900">
                      {formatCurrency(parseFloat(simple.grossAmount) || 0)}
                    </span>
                  </>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
                Mégse
              </Button>
              <Button
                className={`min-w-[140px] shadow-md ${mode === 'simple' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
                onClick={mode === 'simple' ? handleSimpleSubmit : handleItemizedSubmit}
                disabled={isPending}
              >
                {isPending
                  ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  : <ShoppingCart className="w-4 h-4 mr-2" />}
                {mode === 'simple' ? 'Számla rögzítése' : 'Mentés'}
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
