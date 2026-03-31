'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { createNewMenuItem } from '@/modules/products/actions'
import type { UnitOption } from '../types'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: (product: { id: string; name: string; unit_id: string; unit_symbol: string }) => void
  units: UnitOption[]
}

export function QuickAddProductDialog({ isOpen, onClose, onSuccess, units }: Props) {
  const [name, setName] = useState('')
  const [unitId, setUnitId] = useState('')
  const [isPending, setIsPending] = useState(false)

  const canSave = name.trim().length > 0 && unitId.length > 0

  const handleClose = () => {
    setName('')
    setUnitId('')
    onClose()
  }

  const handleSave = async () => {
    if (!canSave) return

    setIsPending(true)
    try {
      const res = await createNewMenuItem(name.trim(), undefined, 'stock_product', undefined, unitId)

      if (res.success && res.product) {
        const unit = units.find(u => u.id === unitId)
        toast.success(`'${name.trim()}' sikeresen létrehozva!`)
        onSuccess({
          id: res.product.id,
          name: res.product.name,
          unit_id: unitId,
          unit_symbol: unit?.symbol ?? '',
        })
        setName('')
        setUnitId('')
      } else {
        toast.error(res.error ?? 'A termék rögzítése nem sikerült.')
      }
    } catch {
      toast.error('Hiba történt a termék létrehozásakor.')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-sm" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-700">
            <Sparkles className="w-4 h-4" />
            Új termék hozzáadása
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="qa-name">Termék neve</Label>
            <Input
              id="qa-name"
              placeholder="Pl. Liszt, Cukor, Olaj..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && canSave) handleSave() }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="qa-unit">Mértékegység <span className="text-red-500">*</span></Label>
            <Select
              value={unitId}
              onValueChange={(v: string | null) => v && setUnitId(v)}
              items={Object.fromEntries(units.map(u => [u.id, `${u.symbol}${u.name ? ` – ${u.name}` : ''}`]))}
            >
              <SelectTrigger id="qa-unit">
                <SelectValue placeholder="Válassz egységet..." />
              </SelectTrigger>
              <SelectContent>
                {units.map(u => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.symbol}{u.name ? ` – ${u.name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isPending}>
            Mégse
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={handleSave}
            disabled={!canSave || isPending}
          >
            {isPending
              ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              : <Sparkles className="w-4 h-4 mr-2" />}
            Létrehozás
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
