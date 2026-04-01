'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/finance'
import { ShoppingBag, Pencil, Trash2, RefreshCw, X, Save, AlertTriangle } from 'lucide-react'
import { PAYMENT_METHOD_LABELS } from '@/modules/daily/lib/labels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { deletePurchase, updatePurchaseHeader } from '../actions'
import type { PurchaseRow } from '../types'

interface Props {
  purchases: PurchaseRow[]
  fromDate: string
}

const PAYMENT_STYLE: Record<string, { border: string; badge: string }> = {
  cash:          { border: 'border-l-orange-400',  badge: 'bg-orange-50 text-orange-700 border border-orange-200' },
  bank_transfer: { border: 'border-l-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
}

interface EditState {
  date: string
  supplierName: string
  invoiceNumber: string
  paymentMethod: 'cash' | 'bank_transfer'
}

export function PurchaseList({ purchases, fromDate }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleEditOpen = (p: PurchaseRow) => {
    setEditingId(p.id)
    setEditState({
      date: p.date,
      supplierName: p.supplier_name,
      invoiceNumber: p.invoice_number ?? '',
      paymentMethod: (p.payment_method as 'cash' | 'bank_transfer') ?? 'cash',
    })
  }

  const handleEditSave = async () => {
    if (!editingId || !editState) return
    setIsSaving(true)
    try {
      const res = await updatePurchaseHeader(
        editingId,
        editState.date,
        editState.supplierName,
        editState.invoiceNumber,
        editState.paymentMethod
      )
      if (res.success) {
        toast.success('Beszerzés frissítve!')
        setEditingId(null)
        setEditState(null)
        router.refresh()
      } else {
        toast.error(res.error ?? 'Hiba történt.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await deletePurchase(id)
      if (res.success) {
        toast.success('Beszerzés törölve.')
        router.refresh()
      } else {
        toast.error(res.error ?? 'Hiba történt.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-xl border shadow-sm flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
        <ShoppingBag className="w-10 h-10 opacity-20" />
        <p className="text-sm">Nincs rögzített beszerzés ebben az időszakban.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Fejléc — csak desktop */}
      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <div className="col-span-2">Dátum</div>
        <div className="col-span-3">Beszállító</div>
        <div className="col-span-2">Fizetés</div>
        <div className="col-span-1 text-center">Tételek</div>
        <div className="col-span-2 text-right">Összeg (Nettó)</div>
        <div className="col-span-2"></div>
      </div>

      {/* Sorok */}
      <div className="divide-y divide-slate-100">
        {purchases.map((p) => {
          const style = PAYMENT_STYLE[p.payment_method] ?? PAYMENT_STYLE.bank_transfer
          const label = PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method
          const dateStr = new Date(p.date + 'T12:00:00').toLocaleDateString('hu-HU', {
            year: 'numeric', month: '2-digit', day: '2-digit'
          })
          const isEditing = editingId === p.id
          const isDeleting = deletingId === p.id

          if (isEditing && editState) {
            return (
              <div key={p.id} className="px-4 py-4 bg-indigo-50/50 border-l-4 border-l-indigo-400 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
                  <Pencil className="w-3.5 h-3.5" /> Fejléc szerkesztése
                  <span className="ml-auto text-[10px] text-slate-400 normal-case font-normal">A tételek és összegek nem módosíthatók. Hibás tételhez törölj és rögzíts újra.</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Dátum</label>
                    <Input type="date" value={editState.date} onChange={e => setEditState({ ...editState, date: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Beszállító</label>
                    <Input value={editState.supplierName} onChange={e => setEditState({ ...editState, supplierName: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Számlaszám</label>
                    <Input value={editState.invoiceNumber} onChange={e => setEditState({ ...editState, invoiceNumber: e.target.value })} className="h-8 text-sm" placeholder="Opcionális" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Fizetés</label>
                    <Select
                      value={editState.paymentMethod}
                      onValueChange={(v: string | null) => v && setEditState({ ...editState, paymentMethod: v as 'cash' | 'bank_transfer' })}
                      items={{ cash: 'Készpénz', bank_transfer: 'Átutalás' }}
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Készpénz</SelectItem>
                        <SelectItem value="bank_transfer">Átutalás</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2 justify-end pt-1">
                  <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setEditState(null) }} disabled={isSaving}>
                    <X className="w-3.5 h-3.5 mr-1" /> Mégse
                  </Button>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleEditSave} disabled={isSaving}>
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    Mentés
                  </Button>
                </div>
              </div>
            )
          }

          const actionButtons = (
            <>
              <Button
                variant="ghost" size="icon"
                onClick={() => handleEditOpen(p)}
                className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                title="Szerkesztés"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost" size="icon"
                onClick={() => handleDelete(p.id)}
                disabled={isDeleting}
                className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                title="Törlés"
              >
                {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              </Button>
            </>
          )

          return (
            <div
              key={p.id}
              className={`border-l-4 ${style.border} hover:bg-slate-50/50 transition-colors ${isDeleting ? 'opacity-40' : ''}`}
            >
              {/* Mobile kártya layout */}
              <div className="sm:hidden flex items-start justify-between px-4 py-3 gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-sm font-medium text-slate-600 tabular-nums">{dateStr}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${style.badge}`}>{label}</span>
                  </div>
                  <p className="font-semibold text-slate-900 text-sm truncate">{p.supplier_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{p.invoice_number ?? '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-slate-900 text-sm whitespace-nowrap">{formatCurrency(p.total_net)}</p>
                  <div className="flex gap-1 mt-1 justify-end">{actionButtons}</div>
                </div>
              </div>

              {/* Desktop grid layout */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 items-center">
                <div className="col-span-2 text-sm font-medium text-slate-600 tabular-nums">
                  {dateStr}
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-slate-900 text-sm truncate">{p.supplier_name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{p.invoice_number ?? '—'}</p>
                </div>
                <div className="col-span-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${style.badge}`}>{label}</span>
                </div>
                <div className="col-span-1 text-center text-sm text-slate-500">
                  {p.purchase_line_items.length}
                </div>
                <div className="col-span-2 text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                  {formatCurrency(p.total_net)}
                </div>
                <div className="col-span-2 flex justify-end gap-1">{actionButtons}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Időablak jelzés */}
      <div className="px-4 py-2 bg-slate-50 border-t text-[11px] text-slate-400 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          Törléskor a készletváltozás nem kerül visszaállításra — csak a bizonylat és a pénztári tétel törlődik.
        </span>
        <span>{fromDate} óta · {purchases.length} bizonylat</span>
      </div>
    </div>
  )
}
