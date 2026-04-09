'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/finance'
import {
  ShoppingBag, Pencil, Trash2, RefreshCw, X, Save,
  AlertTriangle, List, CheckCircle2, Circle, Search, SlidersHorizontal,
} from 'lucide-react'
import { PAYMENT_METHOD_LABELS } from '@/modules/daily/lib/labels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { deletePurchase, updatePurchaseHeader, togglePurchaseSettled } from '../actions'
import { PurchaseLineItemsDialog } from './PurchaseLineItemsDialog'
import type { PurchaseRow, ProductOption, UnitOption, PaymentMethod } from '../types'

interface Props {
  purchases: PurchaseRow[]
  products: ProductOption[]
  units: UnitOption[]
}

const PAYMENT_STYLE: Record<string, { border: string; badge: string }> = {
  cash:          { border: 'border-l-orange-400',  badge: 'bg-orange-50 text-orange-700 border border-orange-200' },
  bank_transfer: { border: 'border-l-emerald-400', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  card:          { border: 'border-l-blue-400',    badge: 'bg-blue-50 text-blue-700 border border-blue-200' },
}

const PAGE_SIZES = [25, 50, 100, 250, 500]

interface EditState {
  date: string
  supplierName: string
  invoiceNumber: string
  paymentMethod: PaymentMethod
}

function StatusBadge({ purchase }: { purchase: PurchaseRow }) {
  const hasItems = purchase.purchase_line_items.length > 0
  if (!hasItems) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
        Fejléc
      </span>
    )
  }
  if (purchase.net_amount !== null) {
    const mismatch = Math.abs(purchase.net_amount - purchase.total_net) > 100
    if (mismatch) {
      return (
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 cursor-help"
          title={`Fejléc: ${formatCurrency(purchase.net_amount)} · Tételek: ${formatCurrency(purchase.total_net)}`}
        >
          <AlertTriangle className="w-2.5 h-2.5" />
          Eltérés
        </span>
      )
    }
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
      Tételes
    </span>
  )
}

export function PurchaseList({ purchases, products, units }: Props) {
  const router = useRouter()

  // Edit / delete state
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [editState, setEditState]         = useState<EditState | null>(null)
  const [deletingId, setDeletingId]       = useState<string | null>(null)
  const [togglingId, setTogglingId]       = useState<string | null>(null)
  const [isSaving, setIsSaving]           = useState(false)
  const [lineItemsPurchase, setLineItemsPurchase] = useState<PurchaseRow | null>(null)

  // Szűrők
  const [search, setSearch]               = useState('')
  const [payFilter, setPayFilter]         = useState('all')
  const [statusFilter, setStatusFilter]   = useState('all')
  const [settledFilter, setSettledFilter] = useState('all')
  const [dateFrom, setDateFrom]           = useState('')
  const [dateTo, setDateTo]               = useState('')
  const [showFilters, setShowFilters]     = useState(false)

  // Lapozás
  const [pageSize, setPageSize] = useState(50)
  const [page, setPage]         = useState(0)

  // Szűrt lista
  const filtered = useMemo(() => {
    return purchases.filter(p => {
      if (search && !p.supplier_name.toLowerCase().includes(search.toLowerCase()) &&
          !(p.invoice_number ?? '').toLowerCase().includes(search.toLowerCase())) return false
      if (payFilter !== 'all' && p.payment_method !== payFilter) return false
      if (statusFilter !== 'all') {
        const hasItems = p.purchase_line_items.length > 0
        const mismatch = hasItems && p.net_amount !== null && Math.abs(p.net_amount - p.total_net) > 100
        if (statusFilter === 'fejlec'  && hasItems) return false
        if (statusFilter === 'teteles' && (!hasItems || mismatch)) return false
        if (statusFilter === 'elteres' && !mismatch) return false
      }
      if (settledFilter === 'yes' && !p.is_settled) return false
      if (settledFilter === 'no'  && p.is_settled)  return false
      if (dateFrom && p.date < dateFrom) return false
      if (dateTo   && p.date > dateTo)   return false
      return true
    })
  }, [purchases, search, payFilter, statusFilter, settledFilter, dateFrom, dateTo])

  const pageCount  = Math.ceil(filtered.length / pageSize)
  const safePage   = Math.min(page, Math.max(0, pageCount - 1))
  const paged      = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize)

  const resetPage = () => setPage(0)

  // Handlers
  const handleEditOpen = (p: PurchaseRow) => {
    setEditingId(p.id)
    setEditState({
      date: p.date,
      supplierName: p.supplier_name,
      invoiceNumber: p.invoice_number ?? '',
      paymentMethod: (p.payment_method as PaymentMethod) ?? 'cash',
    })
  }

  const handleEditSave = async () => {
    if (!editingId || !editState) return
    setIsSaving(true)
    try {
      const res = await updatePurchaseHeader(
        editingId, editState.date, editState.supplierName,
        editState.invoiceNumber, editState.paymentMethod
      )
      if (res.success) {
        toast.success('Beszerzés frissítve!')
        setEditingId(null); setEditState(null)
        router.refresh()
      } else {
        toast.error(res.error ?? 'Hiba történt.')
      }
    } finally { setIsSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await deletePurchase(id)
      if (res.success) { toast.success('Törölve.'); router.refresh() }
      else toast.error(res.error ?? 'Hiba.')
    } finally { setDeletingId(null) }
  }

  const handleToggleSettled = async (p: PurchaseRow) => {
    setTogglingId(p.id)
    try {
      const res = await togglePurchaseSettled(p.id, !p.is_settled)
      if (res.success) router.refresh()
      else toast.error(res.error ?? 'Hiba.')
    } finally { setTogglingId(null) }
  }

  const activeFilterCount = [
    search, payFilter !== 'all', statusFilter !== 'all',
    settledFilter !== 'all', dateFrom, dateTo,
  ].filter(Boolean).length

  return (
    <>
      <div className="space-y-3">
        {/* Szűrő sáv */}
        <div className="bg-white rounded-xl border shadow-sm p-3 space-y-3">
          {/* Sor 1: keresés + szűrők gomb */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Szállító vagy számlaszám..."
                value={search}
                onChange={e => { setSearch(e.target.value); resetPage() }}
                className="pl-8 h-8 text-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(p => !p)}
              className={`gap-1.5 h-8 text-xs ${activeFilterCount > 0 ? 'border-emerald-400 text-emerald-700 bg-emerald-50' : ''}`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Szűrők
              {activeFilterCount > 0 && (
                <span className="bg-emerald-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </div>

          {/* Kibővített szűrők */}
          {showFilters && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Fizetési mód</label>
                <select
                  value={payFilter}
                  onChange={e => { setPayFilter(e.target.value); resetPage() }}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="all">Mind</option>
                  <option value="cash">Készpénz</option>
                  <option value="bank_transfer">Utalás</option>
                  <option value="card">Bankkártya</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Állapot</label>
                <select
                  value={statusFilter}
                  onChange={e => { setStatusFilter(e.target.value); resetPage() }}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="all">Mind</option>
                  <option value="fejlec">Fejléc</option>
                  <option value="teteles">Tételes</option>
                  <option value="elteres">Eltérés</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Kiegyenlített</label>
                <select
                  value={settledFilter}
                  onChange={e => { setSettledFilter(e.target.value); resetPage() }}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                >
                  <option value="all">Mind</option>
                  <option value="no">Nyitott</option>
                  <option value="yes">Kiegyenlített</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dátumtól</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => { setDateFrom(e.target.value); resetPage() }}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dátumig</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => { setDateTo(e.target.value); resetPage() }}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline" size="sm"
                  onClick={() => {
                    setSearch(''); setPayFilter('all'); setStatusFilter('all')
                    setSettledFilter('all'); setDateFrom(''); setDateTo('')
                    resetPage()
                  }}
                  className="w-full h-[30px] text-xs text-slate-500"
                >
                  <X className="w-3 h-3 mr-1" /> Törlés
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Lista */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <ShoppingBag className="w-10 h-10 opacity-20" />
              <p className="text-sm">Nincs a szűrőknek megfelelő bizonylat.</p>
            </div>
          ) : (
            <>
              {/* Desktop fejléc */}
              <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 bg-slate-50 border-b text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <div className="col-span-2">Dátum</div>
                <div className="col-span-3">Beszállító</div>
                <div className="col-span-1">Fizetés</div>
                <div className="col-span-1 text-center">Állapot</div>
                <div className="col-span-3 text-right">Összegek</div>
                <div className="col-span-2"></div>
              </div>

              <div className="divide-y divide-slate-100">
                {paged.map((p) => {
                  const style = PAYMENT_STYLE[p.payment_method] ?? PAYMENT_STYLE.bank_transfer
                  const label = PAYMENT_METHOD_LABELS[p.payment_method] ?? p.payment_method
                  const dateStr = new Date(p.date + 'T12:00:00').toLocaleDateString('hu-HU', {
                    year: 'numeric', month: '2-digit', day: '2-digit'
                  })
                  const isEditing  = editingId === p.id
                  const isDeleting = deletingId === p.id
                  const isToggling = togglingId === p.id
                  const displayNet = p.net_amount !== null ? p.net_amount : p.total_net
                  const isNegative = displayNet < 0
                  const hasItems   = p.purchase_line_items.length > 0

                  if (isEditing && editState) {
                    return (
                      <div key={p.id} className="px-4 py-4 bg-indigo-50/50 border-l-4 border-l-indigo-400 space-y-3">
                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">
                          <Pencil className="w-3.5 h-3.5" /> Fejléc szerkesztése
                          <span className="ml-auto text-[10px] text-slate-400 normal-case font-normal hidden sm:block">
                            A tételek és összegek nem módosíthatók.
                          </span>
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
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Fizetési mód</label>
                            <Select
                              value={editState.paymentMethod}
                              onValueChange={(v: string | null) => v && setEditState({ ...editState, paymentMethod: v as PaymentMethod })}
                              items={{ cash: 'Készpénz', bank_transfer: 'Utalás', card: 'Bankkártya' }}
                            >
                              <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="cash">Készpénz</SelectItem>
                                <SelectItem value="bank_transfer">Utalás</SelectItem>
                                <SelectItem value="card">Bankkártya</SelectItem>
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

                  const settledBtn = (
                    <Button
                      variant="ghost" size="icon"
                      onClick={() => handleToggleSettled(p)}
                      disabled={isToggling}
                      className={`h-7 w-7 ${p.is_settled ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-slate-300 hover:text-emerald-500 hover:bg-emerald-50'}`}
                      title={p.is_settled ? 'Kiegyenlített — kattints a visszavonáshoz' : 'Jelöld kiegyenlítettnek'}
                    >
                      {isToggling
                        ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        : p.is_settled
                        ? <CheckCircle2 className="w-3.5 h-3.5" />
                        : <Circle className="w-3.5 h-3.5" />}
                    </Button>
                  )

                  const actionButtons = (
                    <>
                      {settledBtn}
                      {!hasItems && (
                        <Button variant="ghost" size="icon" onClick={() => setLineItemsPurchase(p)}
                          className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Tételek hozzáadása">
                          <List className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" onClick={() => handleEditOpen(p)}
                        className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Szerkesztés">
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} disabled={isDeleting}
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50" title="Törlés">
                        {isDeleting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </>
                  )

                  return (
                    <div key={p.id}
                      className={`border-l-4 ${style.border} transition-colors ${isDeleting ? 'opacity-40' : ''} ${p.is_settled ? 'bg-slate-50/60' : 'hover:bg-slate-50/50'}`}
                    >
                      {/* Mobile */}
                      <div className="sm:hidden flex items-start justify-between px-4 py-3 gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className="text-sm font-medium text-slate-600 tabular-nums">{dateStr}</span>
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${style.badge}`}>{label}</span>
                            <StatusBadge purchase={p} />
                            {p.is_settled && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-2.5 h-2.5" />Kieg.</span>}
                          </div>
                          <p className={`font-semibold text-sm truncate ${isNegative ? 'text-red-700' : 'text-slate-900'}`}>{p.supplier_name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{p.invoice_number ?? '—'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-mono font-bold text-sm whitespace-nowrap ${isNegative ? 'text-red-600' : 'text-slate-900'}`}>{formatCurrency(displayNet)}</p>
                          {p.gross_amount !== null && <p className="text-[10px] text-slate-500 font-mono whitespace-nowrap">Br: {formatCurrency(p.gross_amount)}</p>}
                          <div className="flex gap-0.5 mt-1 justify-end">{actionButtons}</div>
                        </div>
                      </div>

                      {/* Desktop */}
                      <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-3 items-center">
                        <div className="col-span-2 text-sm font-medium text-slate-600 tabular-nums">{dateStr}</div>
                        <div className="col-span-3">
                          <p className={`font-semibold text-sm truncate ${isNegative ? 'text-red-700' : 'text-slate-900'}`}>{p.supplier_name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{p.invoice_number ?? '—'}</p>
                        </div>
                        <div className="col-span-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${style.badge}`}>{label}</span>
                        </div>
                        <div className="col-span-1 flex justify-center">
                          <StatusBadge purchase={p} />
                        </div>
                        <div className="col-span-3 text-right">
                          <p className={`font-mono font-bold text-sm whitespace-nowrap ${isNegative ? 'text-red-600' : 'text-slate-900'}`}>{formatCurrency(displayNet)}</p>
                          {p.vat_amount !== null && <p className="text-[10px] text-slate-400 font-mono whitespace-nowrap">ÁFA: {formatCurrency(p.vat_amount)}</p>}
                          {p.gross_amount !== null && <p className={`text-[10px] font-mono font-semibold whitespace-nowrap ${isNegative ? 'text-red-500' : 'text-slate-500'}`}>Bruttó: {formatCurrency(p.gross_amount)}</p>}
                        </div>
                        <div className="col-span-2 flex justify-end gap-0.5">{actionButtons}</div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Lapozó + darabszám */}
              <div className="px-4 py-3 bg-slate-50 border-t flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                  <span>Törléskor a készletváltozás nem kerül visszaállításra.</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums">
                    {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, filtered.length)} / {filtered.length} bizonylat
                    {filtered.length < purchases.length && <span className="text-slate-400"> (össz: {purchases.length})</span>}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(0, p - 1))}
                      disabled={safePage === 0}
                      className="px-2 py-1 rounded border border-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >‹</button>
                    {pageCount <= 7
                      ? Array.from({ length: pageCount }, (_, i) => (
                          <button key={i} onClick={() => setPage(i)}
                            className={`px-2 py-1 rounded border ${i === safePage ? 'bg-emerald-600 text-white border-emerald-600' : 'border-slate-200 hover:bg-white'}`}>
                            {i + 1}
                          </button>
                        ))
                      : (
                        <span className="px-2 py-1 text-slate-600 font-medium">{safePage + 1} / {pageCount}</span>
                      )
                    }
                    <button
                      onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
                      disabled={safePage >= pageCount - 1}
                      className="px-2 py-1 rounded border border-slate-200 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed"
                    >›</button>
                  </div>
                  <select
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); resetPage() }}
                    className="text-xs border border-slate-200 rounded px-1.5 py-1 bg-white"
                  >
                    {PAGE_SIZES.map(s => <option key={s} value={s}>{s} / oldal</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {lineItemsPurchase && (
        <PurchaseLineItemsDialog
          purchase={lineItemsPurchase}
          products={products}
          units={units}
          onClose={() => setLineItemsPurchase(null)}
        />
      )}
    </>
  )
}
