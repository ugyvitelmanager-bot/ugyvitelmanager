'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Search, RefreshCw, X, Box, UtensilsCrossed, Wheat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createNewMenuItem } from '../actions'

interface Category { id: string, name: string }
interface VatRate { id: string, rate_percent: string }

interface CreateItemModalProps {
  categories: Category[]
  vatRates: VatRate[]
  defaultType?: 'ingredient' | 'recipe_product' | 'stock_product'
  triggerLabel?: string
  triggerIcon?: React.ReactNode
  triggerClassName?: string
}

export function CreateItemModal({
  categories,
  vatRates,
  defaultType = 'recipe_product',
  triggerLabel = 'Új Tétel',
  triggerIcon = <PlusCircle className="mr-2 h-4 w-4" />,
  triggerClassName
}: CreateItemModalProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [vatRateId, setVatRateId] = useState(vatRates.find(v => parseFloat(v.rate_percent) === 27)?.id || vatRates[0]?.id || '')
  const [productType, setProductType] = useState<'ingredient' | 'recipe_product' | 'stock_product'>(defaultType)

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Kérlek add meg a termék nevét!')
      return
    }

    setIsSaving(true)
    try {
      const res = await createNewMenuItem(name.trim(), categoryId, productType, vatRateId)
      
      if (res.success && res.redirectUrl) {
        toast.success('Sikeresen létrehozva! Átirányítás...')
        setIsOpen(false)
        window.location.href = res.redirectUrl
      } else {
        toast.error('Hiba: ' + res.error)
      }
    } catch (err) {
      toast.error('Váratlan hiba történt.')
    } finally {
      setIsSaving(false)
    }
  }

  // Esemény az ablak kinyitásakor
  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      // Reset form
      setName('')
      setProductType(defaultType)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <Button className={triggerClassName} onClick={() => setIsOpen(true)}>
        {triggerIcon}
        {triggerLabel}
      </Button>
      
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <PlusCircle className="w-6 h-6 text-primary" />
            Új Tétel Létrehozása
          </DialogTitle>
          <DialogDescription className="text-base text-slate-500">
            Itt viheted fel az új eladandó termékeket az Étlapra. Ha Receptes ételt választasz, akkor egyből a Receptúra építőhöz kerülsz!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Név */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">Tétel Neve (Étlapon megjelenő név)</Label>
            <Input 
              id="name" 
              placeholder="pl. Dupla Sajtburger, Kézműves Sör 0.5L..." 
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-lg py-6 shadow-xs border-slate-300 focus-visible:ring-indigo-500"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kategória */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Kategória</Label>
              <select 
                value={categoryId} 
                onChange={e => setCategoryId(e.target.value)}
                className="flex h-12 w-full items-center justify-between rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            {/* ÁFA */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">ÁFA Kulcs</Label>
              <select 
                value={vatRateId} 
                onChange={e => setVatRateId(e.target.value)}
                className="flex h-12 w-full items-center justify-between rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {vatRates.map(v => <option key={v.id} value={v.id}>{v.rate_percent}%</option>)}
              </select>
            </div>
          </div>

          {/* Típus Választó — alapanyagnál rögzített, étlapnál választható */}
          {defaultType === 'ingredient' ? (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-4">
                <div className="rounded-full p-2 bg-green-100 shrink-0">
                  <Wheat className="w-6 h-6 text-green-700" />
                </div>
                <div>
                  <h4 className="font-bold text-green-900">Alapanyag</h4>
                  <p className="text-xs text-green-700 mt-0.5">Receptúrákhoz és beszerzésekhez használt nyersanyag</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3 pt-4 border-t">
              <Label className="text-sm font-semibold text-slate-700">Milyen típusú tétel ez?</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setProductType('recipe_product')}
                  className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all ${
                    productType === 'recipe_product'
                    ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-md ring-1 ring-orange-500'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`rounded-full p-2 ${productType === 'recipe_product' ? 'bg-orange-100' : 'bg-slate-100'}`}>
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">Saját Készítésű</h4>
                    <p className="text-xs opacity-80 mt-1">Receptúra alapján, alapanyagokból</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setProductType('stock_product')}
                  className={`relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 text-center transition-all ${
                    productType === 'stock_product'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-md ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`rounded-full p-2 ${productType === 'stock_product' ? 'bg-indigo-100' : 'bg-slate-100'}`}>
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold">Késztermék (Áru)</h4>
                    <p className="text-xs opacity-80 mt-1">Viszonteladás, nincs saját készítés</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4 sm:justify-between items-center sm:space-x-4">
          <p className="text-sm text-slate-500 hidden sm:block">
            {productType === 'ingredient'
              ? 'Visszatér a raktárlistára →'
              : productType === 'recipe_product'
              ? 'Tovább a Receptura szerkesztőhöz →'
              : 'Tovább az Árazó Kalkulátorhoz →'}
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto h-12">
              Mégsem
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || !name.trim()}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 shadow-md transition-all"
            >
              {isSaving && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
              Mentés & Folytatás
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
