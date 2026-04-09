'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'
import { importPurchaseHeaders } from '../actions'
import type { ParsedInvoiceRow } from '@/app/api/import/szamlak/route'

type EditableRow = ParsedInvoiceRow & { selected: boolean }

const FT = (n: number) =>
  new Intl.NumberFormat('hu-HU', { maximumFractionDigits: 0 }).format(n) + ' Ft'

export function ImportDialog() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [isOpen, setIsOpen]       = useState(false)
  const [isParsing, setIsParsing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [rows, setRows]           = useState<EditableRow[]>([])
  const [result, setResult]       = useState<{ imported: number; errors: string[] } | null>(null)

  const reset = () => {
    setRows([])
    setResult(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleOpen = (open: boolean) => {
    setIsOpen(open)
    if (!open) reset()
  }

  const handleFile = async (file: File) => {
    setIsParsing(true)
    setRows([])
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/import/szamlak', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) { toast.error(json.error ?? 'Parse hiba'); return }
      setRows((json.rows as ParsedInvoiceRow[]).map(r => ({ ...r, selected: true })))
      toast.success(`${json.total} számla beolvasva`)
    } catch {
      toast.error('Fájl feldolgozási hiba')
    } finally {
      setIsParsing(false)
    }
  }

  const toggleAll = (val: boolean) =>
    setRows(prev => prev.map(r => ({ ...r, selected: val })))

  const toggleRow = (i: number) =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, selected: !r.selected } : r))

  const setPayment = (i: number, method: 'cash' | 'bank_transfer') =>
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, paymentMethod: method, isUnknownPayment: false } : r))

  const selectedRows = rows.filter(r => r.selected)

  const handleImport = async () => {
    if (selectedRows.length === 0) { toast.error('Nincs kijelölt sor'); return }
    setIsImporting(true)
    try {
      const res = await importPurchaseHeaders(selectedRows.map(r => ({
        invoiceNumber:   r.invoiceNumber,
        supplierName:    r.supplierName,
        performanceDate: r.performanceDate,
        invoiceDate:     r.invoiceDate,
        dueDate:         r.dueDate,
        netAmount:       r.netAmount,
        vatAmount:       r.vatAmount,
        grossAmount:     r.grossAmount,
        paymentMethod:   r.paymentMethod,
      })))
      setResult(res)
      if (res.imported > 0) {
        toast.success(`${res.imported} számla importálva`)
        router.refresh()
      }
      if (res.errors.length > 0) {
        toast.error(`${res.errors.length} hiba az importban`)
      }
    } catch {
      toast.error('Import hiba')
    } finally {
      setIsImporting(false)
    }
  }

  const allSelected = rows.length > 0 && rows.every(r => r.selected)
  const unknownCount = selectedRows.filter(r => r.isUnknownPayment).length

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            XLSX import
          </Button>
        }
      />

      <DialogContent className="sm:max-w-6xl max-w-[98vw] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <DialogHeader className="border-b pb-3 shrink-0">
          <DialogTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            Számlalista importálása
          </DialogTitle>
        </DialogHeader>

        {/* Result view */}
        {result && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
            <div className="flex items-center gap-3 text-emerald-700 bg-emerald-50 px-6 py-4 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
              <div>
                <p className="text-xl font-bold">{result.imported} számla importálva</p>
                {result.errors.length > 0 && (
                  <p className="text-sm text-amber-700 mt-1">{result.errors.length} hiba</p>
                )}
              </div>
            </div>
            {result.errors.length > 0 && (
              <div className="w-full max-h-40 overflow-y-auto bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 space-y-1">
                {result.errors.map((e, i) => <p key={i}>{e}</p>)}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>Új import</Button>
              <Button onClick={() => setIsOpen(false)}>Bezárás</Button>
            </div>
          </div>
        )}

        {/* File picker — no file yet */}
        {!result && rows.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">
            {isParsing ? (
              <div className="flex items-center gap-3 text-slate-500">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-sm">Fájl feldolgozása...</span>
              </div>
            ) : (
              <>
                <div
                  className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/40 transition-colors"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const f = e.dataTransfer.files[0]
                    if (f) handleFile(f)
                  }}
                >
                  <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-slate-600">Húzd ide az XLSX fájlt</p>
                  <p className="text-xs text-slate-400 mt-1">vagy kattints a kiválasztáshoz</p>
                  <p className="text-xs text-slate-300 mt-2">Számlázó program: Bejövő számlák export (.xlsx)</p>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </>
            )}
          </div>
        )}

        {/* Preview table */}
        {!result && rows.length > 0 && (
          <>
            {/* Warning bar */}
            {unknownCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span><strong>{unknownCount} sornál</strong> ismeretlen fizetési mód — alapértelmezett: Banki utalás. Ellenőrizd és módosítsd az alábbi táblában.</span>
              </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-slate-100 z-10">
                  <tr>
                    <th className="px-2 py-2 border-b text-center w-8">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={e => toggleAll(e.target.checked)}
                        className="w-3.5 h-3.5"
                      />
                    </th>
                    <th className="px-2 py-2 border-b text-left font-semibold text-slate-600 whitespace-nowrap">Számlaszám</th>
                    <th className="px-2 py-2 border-b text-left font-semibold text-slate-600">Kiállító</th>
                    <th className="px-2 py-2 border-b text-center font-semibold text-slate-600 whitespace-nowrap">Teljesítés</th>
                    <th className="px-2 py-2 border-b text-center font-semibold text-slate-600 whitespace-nowrap">Határidő</th>
                    <th className="px-2 py-2 border-b text-right font-semibold text-slate-600">Nettó</th>
                    <th className="px-2 py-2 border-b text-right font-semibold text-slate-600">ÁFA</th>
                    <th className="px-2 py-2 border-b text-right font-semibold text-slate-600">Bruttó</th>
                    <th className="px-2 py-2 border-b text-center font-semibold text-slate-600 whitespace-nowrap">Fiz. mód</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b last:border-0 ${
                        !row.selected
                          ? 'opacity-40 bg-slate-50'
                          : row.isUnknownPayment
                          ? 'bg-amber-50'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          checked={row.selected}
                          onChange={() => toggleRow(i)}
                          className="w-3.5 h-3.5"
                        />
                      </td>
                      <td className="px-2 py-1.5 font-mono text-slate-600 whitespace-nowrap">{row.invoiceNumber || '—'}</td>
                      <td className="px-2 py-1.5 font-medium text-slate-800 max-w-[200px] truncate">{row.supplierName}</td>
                      <td className="px-2 py-1.5 text-center text-slate-500 whitespace-nowrap">{row.performanceDate || '—'}</td>
                      <td className="px-2 py-1.5 text-center text-slate-500 whitespace-nowrap">{row.dueDate || '—'}</td>
                      <td className="px-2 py-1.5 text-right font-mono whitespace-nowrap">{FT(row.netAmount)}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-slate-400 whitespace-nowrap">{FT(row.vatAmount)}</td>
                      <td className="px-2 py-1.5 text-right font-mono font-semibold whitespace-nowrap">{FT(row.grossAmount)}</td>
                      <td className="px-2 py-1.5 text-center">
                        <div className="flex items-center gap-1 justify-center">
                          {row.isUnknownPayment && (
                            <span title={`Eredeti: ${row.paymentMethodRaw}`}>
                              <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0" />
                            </span>
                          )}
                          <select
                            value={row.paymentMethod}
                            onChange={e => setPayment(i, e.target.value as 'cash' | 'bank_transfer')}
                            disabled={!row.selected}
                            className="text-xs border border-slate-200 rounded px-1.5 py-0.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                          >
                            <option value="bank_transfer">Utalás</option>
                            <option value="cash">Készpénz</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t shrink-0">
              <div className="text-xs text-slate-500">
                <span className="font-semibold text-slate-700">{selectedRows.length}</span> / {rows.length} kijelölve
                {selectedRows.length > 0 && (
                  <span className="ml-2 text-slate-400">
                    · Bruttó összesen: <span className="font-mono font-semibold text-slate-700">
                      {FT(selectedRows.reduce((s, r) => s + r.grossAmount, 0))}
                    </span>
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { reset(); if (fileRef.current) fileRef.current.value = '' }} className="gap-1.5">
                  <X className="w-3.5 h-3.5" />
                  Új fájl
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={isImporting || selectedRows.length === 0}
                  className="bg-emerald-600 hover:bg-emerald-700 gap-2 min-w-[160px]"
                >
                  {isImporting
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Importálás...</>
                    : <><Upload className="w-4 h-4" /> {selectedRows.length} számla importálása</>
                  }
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
