'use client'

import { useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Trash2, Receipt } from 'lucide-react'
import type { PurchaseLineItem } from '../types'

interface Props {
  item: PurchaseLineItem
  index: number
  canRemove: boolean
  onUpdate: (patch: Partial<Omit<PurchaseLineItem, 'id' | 'kind'>>) => void
  onRemove: () => void
}

export function CostLineRow({ item, index, canRemove, onUpdate, onRemove }: Props) {
  const descRef = useRef<HTMLInputElement>(null)
  const showHeaders = index === 0

  // Fókusz az új sor description inputjára
  useEffect(() => {
    descRef.current?.focus()
  }, [])

  return (
    <div className="grid grid-cols-12 gap-2 items-end bg-blue-50 p-3 rounded-lg border border-blue-100 shadow-sm">
      {/* Sor típus jelzés */}
      {showHeaders && (
        <div className="col-span-12 flex items-center gap-1.5 mb-1">
          <Receipt className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400">Egyéb költség sor</span>
        </div>
      )}
      {!showHeaders && (
        <div className="col-span-12 -mb-1">
          <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-blue-300">
            <Receipt className="w-2.5 h-2.5" /> Egyéb költség
          </span>
        </div>
      )}

      {/* Megnevezés */}
      <div className="col-span-8 space-y-1">
        {showHeaders && (
          <Label className="text-[10px] uppercase font-bold text-slate-400">Megnevezés</Label>
        )}
        <Input
          ref={descRef}
          placeholder="pl. Serpenyő, Takarítószer, Szalvéta..."
          value={item.description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          className="h-9 bg-white"
        />
      </div>

      {/* Nettó összeg */}
      <div className="col-span-3 space-y-1">
        {showHeaders && (
          <Label className="text-[10px] uppercase font-bold text-slate-400">Nettó összeg</Label>
        )}
        <div className="relative">
          <Input
            type="number"
            step="1"
            min="1"
            value={item.amount === 0 ? '' : item.amount}
            onChange={(e) => onUpdate({ amount: Number(e.target.value) })}
            className="h-9 pr-8 bg-white"
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
