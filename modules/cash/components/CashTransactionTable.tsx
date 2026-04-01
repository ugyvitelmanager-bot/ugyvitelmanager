'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/finance'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  PlusCircle, MinusCircle, UserPlus, RefreshCw, Landmark, ShoppingCart,
  Pencil, Trash2, X, Save,
} from 'lucide-react'
import { toast } from 'sonner'
import { deleteCashTransaction, updateCashTransaction } from '../actions'

interface Transaction {
  id: string
  date: string
  amount: number
  type: string
  source: string
  note: string | null
  purchase_id: string | null
}

interface Props {
  transactions: Transaction[]
}

type TxType = 'expense' | 'income' | 'loan_in' | 'loan_out' | 'transfer'
type TxSource = 'daily_kassza' | 'petty_cash'

interface EditState {
  date: string
  amount: number
  type: TxType
  source: TxSource
  note: string
}

const TYPE_LABELS: Record<string, string> = {
  income:   'Bevétel',
  expense:  'Kiadás',
  loan_in:  'Tagi Befizetés',
  loan_out: 'Tagi Kivét',
  transfer: 'Átvezetés',
}

const SOURCE_LABELS: Record<string, string> = {
  daily_kassza: 'Napi Kassza',
  petty_cash:   'Házipénztár',
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'income':   return <PlusCircle  className="w-4 h-4 text-emerald-600" />
    case 'expense':  return <MinusCircle className="w-4 h-4 text-red-600" />
    case 'loan_in':  return <UserPlus    className="w-4 h-4 text-blue-600" />
    case 'loan_out': return <UserPlus    className="w-4 h-4 text-orange-600" />
    case 'transfer': return <Landmark    className="w-4 h-4 text-slate-500" />
    default: return null
  }
}

export function CashTransactionTable({ transactions }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleEditOpen = (t: Transaction) => {
    setEditingId(t.id)
    setEditState({
      date: t.date,
      amount: t.amount / 100, // fillér → forint
      type: t.type as TxType,
      source: t.source as TxSource,
      note: t.note ?? '',
    })
  }

  const handleEditSave = async () => {
    if (!editingId || !editState) return
    setIsSaving(true)
    try {
      const res = await updateCashTransaction(editingId, editState)
      if (res.success) {
        toast.success('Tranzakció frissítve!')
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
      const res = await deleteCashTransaction(id)
      if (res.success) {
        toast.success('Tranzakció törölve.')
        router.refresh()
      } else {
        toast.error(res.error ?? 'Hiba történt.')
      }
    } finally {
      setDeletingId(null)
    }
  }

  if (transactions.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">
          Nincs még rögzített pénztári mozgás.
        </TableCell>
      </TableRow>
    )
  }

  return (
    <>
      {transactions.map((t) => {
        const isNegative = t.type === 'expense' || t.type === 'loan_out' || t.type === 'transfer'
        const isLinkedToPurchase = !!t.purchase_id
        const isEditing = editingId === t.id
        const isDeleting = deletingId === t.id

        if (isEditing && editState) {
          return (
            <TableRow key={t.id} className="bg-indigo-50/50">
              <TableCell colSpan={5} className="px-6 py-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Dátum</label>
                    <Input type="date" value={editState.date} onChange={e => setEditState({ ...editState, date: e.target.value })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Összeg (Ft)</label>
                    <Input type="number" value={editState.amount} onChange={e => setEditState({ ...editState, amount: Number(e.target.value) })} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Típus</label>
                    <Select value={editState.type} onValueChange={(v: string | null) => v && setEditState({ ...editState, type: v as TxType })} items={TYPE_LABELS}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(TYPE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Forrás</label>
                    <Select value={editState.source} onValueChange={(v: string | null) => v && setEditState({ ...editState, source: v as TxSource })} items={SOURCE_LABELS}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(SOURCE_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Megjegyzés</label>
                    <Input value={editState.note} onChange={e => setEditState({ ...editState, note: e.target.value })} className="h-8 text-sm" placeholder="Opcionális" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-3">
                  <Button variant="outline" size="sm" onClick={() => { setEditingId(null); setEditState(null) }} disabled={isSaving}>
                    <X className="w-3.5 h-3.5 mr-1" /> Mégse
                  </Button>
                  <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={handleEditSave} disabled={isSaving}>
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                    Mentés
                  </Button>
                </div>
              </TableCell>
              <TableCell />
            </TableRow>
          )
        }

        return (
          <TableRow key={t.id} className={`hover:bg-slate-50/50 transition-colors ${isDeleting ? 'opacity-40' : ''}`}>
            <TableCell className="px-6 py-4 font-medium text-slate-600">
              {new Date(t.date + 'T12:00:00').toLocaleDateString('hu-HU')}
            </TableCell>
            <TableCell className="px-6 py-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-tight">
                {getTypeIcon(t.type)}
                <span className={t.type === 'loan_in' || t.type === 'loan_out' ? 'text-blue-700' : ''}>
                  {TYPE_LABELS[t.type] ?? t.type}
                </span>
              </div>
            </TableCell>
            <TableCell className="px-6 py-4">
              <span className="text-[10px] bg-slate-100 px-2 py-1 rounded font-bold text-slate-500 uppercase">
                {SOURCE_LABELS[t.source] ?? t.source}
              </span>
            </TableCell>
            <TableCell className="px-6 py-4 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                {t.purchase_id && <ShoppingCart className="w-3 h-3 text-emerald-600" />}
                {t.note || '—'}
              </div>
            </TableCell>
            <TableCell className={`px-6 py-4 text-right font-mono font-bold whitespace-nowrap ${isNegative ? 'text-red-500' : 'text-emerald-600'}`}>
              {isNegative ? '−' : '+'}{formatCurrency(t.amount)}
            </TableCell>
            <TableCell className="px-4 py-4">
              {!isLinkedToPurchase && (
                <div className="flex gap-1 justify-end">
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => handleEditOpen(t)}
                    className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                    title="Szerkesztés"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon"
                    onClick={() => handleDelete(t.id)}
                    disabled={isDeleting}
                    className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                    title="Törlés"
                  >
                    {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}
            </TableCell>
          </TableRow>
        )
      })}
    </>
  )
}
