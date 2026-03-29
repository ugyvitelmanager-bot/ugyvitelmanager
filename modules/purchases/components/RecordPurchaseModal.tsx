'use client'

import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { PlusCircle, Trash2, ShoppingCart, RefreshCw, Layers } from 'lucide-react'
import { recordPurchase } from '../actions'

interface ProductRecord {
  id: string
  name: string
  unit_id: string
  units: { symbol: string } | null
}

interface RecordPurchaseModalProps {
  products: ProductRecord[]
  units: { id: string, symbol: string }[]
}

export function RecordPurchaseModal({ products, units }: RecordPurchaseModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  // Form states
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [supplier, setSupplier] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash_daily'|'cash_petty'|'bank_transfer'|'member_loan_cash'>('cash_daily')
  
  const [items, setItems] = useState<Array<{ 
    id: string; 
    productId: string; 
    quantity: number; 
    unitId: string; 
    unitPrice: number 
  }>>([
    { id: Math.random().toString(), productId: '', quantity: 1, unitId: '', unitPrice: 0 }
  ])

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), productId: '', quantity: 1, unitId: '', unitPrice: 0 }])
  }

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(i => i.id !== id))
    }
  }

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        let updated = { ...item, [field]: value }
        
        // Ha terméket választunk, töltsük be az alapértelmezett mértékegységet
        if (field === 'productId') {
          const prod = products.find(p => p.id === value)
          if (prod) updated.unitId = prod.unit_id
        }
        
        return updated
      }
      return item
    }))
  }

  const totalNet = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unitPrice)), 0)

  const handleSubmit = async () => {
    if (!supplier) return toast.error('Kérlek add meg a beszállítót!')
    if (items.some(i => !i.productId || i.quantity <= 0)) return toast.error('Minden sorban válassz terméket és adj meg mennyiséget!')

    setIsPending(true)
    try {
      const res = await recordPurchase(
        date,
        supplier,
        invoiceNumber,
        paymentMethod,
        items.map(i => ({
          product_id: i.productId,
          quantity: Number(i.quantity),
          unit_id: i.unitId,
          unit_price_net: Number(i.unitPrice)
        })),
        totalNet
      )

      if (res.success) {
        toast.success('Beszerzés sikeresen rögzítve! Készlet és árak frissítve.')
        setIsOpen(false)
        setItems([{ id: Math.random().toString(), productId: '', quantity: 1, unitId: '', unitPrice: 0 }])
        setSupplier('')
        setInvoiceNumber('')
      } else {
        toast.error(res.error)
      }
    } catch (err) {
      toast.error('Hiba történt a mentés során.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 shadow-sm gap-2">
          <PlusCircle className="w-4 h-4" />
          Új Beszerzés Rögzítése
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-emerald-700">
            <ShoppingCart className="w-6 h-6" />
            Beszerzési Számla Rögzítése
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 py-6 border-b bg-slate-50/50 p-4 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="date">Dátum</Label>
            <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2 col-span-1 md:col-span-1">
            <Label htmlFor="supplier">Beszállító</Label>
            <Input 
              id="supplier" 
              placeholder="Pl. METRO, Pek-Snack..." 
              value={supplier} 
              onChange={(e) => setSupplier(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invoice">Bizonylatszám</Label>
            <Input 
              id="invoice" 
              placeholder="Számlaszám (opcionális)" 
              value={invoiceNumber} 
              onChange={(e) => setInvoiceNumber(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment">Kifizetés módja</Label>
            <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
              <SelectTrigger id="payment" className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash_daily">Napi Kasszából (KP)</SelectItem>
                <SelectItem value="cash_petty">Házipénztárból (KP)</SelectItem>
                <SelectItem value="member_loan_cash">Tagi Kölcsönből (KP)</SelectItem>
                <SelectItem value="bank_transfer">Utalás (Bank)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4 py-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Tételek
            </h3>
            <Button variant="outline" size="sm" onClick={addItem} className="text-xs h-8">
              <PlusCircle className="w-3 h-3 mr-1" /> Sor hozzáadása
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end bg-white p-2 rounded border border-slate-100 shadow-sm animate-in fade-in transition-all">
                <div className="col-span-4 space-y-1">
                  {idx === 0 && <Label className="text-[10px] uppercase font-bold text-slate-400">Termék</Label>}
                  <select 
                    value={item.productId}
                    onChange={(e) => updateItem(item.id, 'productId', e.target.value)}
                    className="w-full h-9 rounded-md border border-input px-3 py-1 text-sm bg-white"
                  >
                    <option value="">Válassz terméket...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-[10px] uppercase font-bold text-slate-400">Mennyiség</Label>}
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={item.quantity} 
                    onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} 
                    className="h-9"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  {idx === 0 && <Label className="text-[10px] uppercase font-bold text-slate-400">Egység</Label>}
                  <Select value={item.unitId} onValueChange={(v) => updateItem(item.id, 'unitId', v)}>
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

                <div className="col-span-3 space-y-1">
                  {idx === 0 && <Label className="text-[10px] uppercase font-bold text-slate-400">Nettó Egységár</Label>}
                  <div className="relative">
                    <Input 
                      type="number" 
                      value={item.unitPrice} 
                      onChange={(e) => updateItem(item.id, 'unitPrice', e.target.value)} 
                      className="h-9 pr-8"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">Ft</span>
                  </div>
                </div>

                <div className="col-span-1 flex justify-center pb-1">
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeItem(item.id)}
                    className="h-8 w-8 text-slate-300 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="bg-slate-50 -mx-6 -mb-6 p-6 mt-4 border-t flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-right sm:text-left">
             <span className="text-sm text-slate-500 uppercase font-bold block sm:inline mr-2">Összesen (Nettó):</span>
             <span className="text-2xl font-black text-slate-900">{new Intl.NumberFormat('hu-HU', { style: 'currency', currency: 'HUF', maximumFractionDigits: 0 }).format(totalNet)}</span>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>Mégse</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 min-w-[150px] shadow-md shadow-emerald-200"
              onClick={handleSubmit} 
              disabled={isPending}
            >
              {isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
              Számla mentése
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
