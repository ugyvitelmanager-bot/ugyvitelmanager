import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'

export interface ParsedInvoiceRow {
  invoiceNumber: string
  supplierName: string
  performanceDate: string   // purchases.date is based on this
  invoiceDate: string
  dueDate: string
  netAmount: number         // Ft (rounded)
  vatAmount: number         // Ft (rounded)
  grossAmount: number       // Ft (rounded)
  paymentMethod: 'cash' | 'bank_transfer' | 'card'
  paymentMethodRaw: string  // original value for warning display
  isUnknownPayment: boolean
}

function isoDate(val: any): string {
  if (!val) return ''
  if (val instanceof Date) return val.toISOString().split('T')[0]
  if (typeof val === 'string' && val.includes('T')) return val.split('T')[0]
  return String(val).slice(0, 10)
}

function mapPayment(raw: string): { method: 'cash' | 'bank_transfer' | 'card'; isUnknown: boolean } {
  const s = (raw ?? '').toLowerCase()
  if (s.includes('készpénz') || s === 'kp') return { method: 'cash', isUnknown: false }
  if (s.includes('átutalás') || s.includes('utalás')) return { method: 'bank_transfer', isUnknown: false }
  if (s.includes('bankkártya') || s.includes('kártya') || s.includes('card')) return { method: 'card', isUnknown: false }
  // ismeretlen, egyéb → bank_transfer, jelöljük
  return { method: 'bank_transfer', isUnknown: true }
}

export async function POST(request: NextRequest) {
  const form = await request.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Nincs fájl csatolva.' }, { status: 400 })

  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(await file.arrayBuffer())

  const ws = wb.worksheets[0]
  if (!ws) return NextResponse.json({ error: 'A fájlban nincs munkalap.' }, { status: 400 })

  // Fejléc sor → oszlop index map
  const hdr: Record<string, number> = {}
  ws.getRow(1).eachCell((cell, col) => { hdr[String(cell.value).trim()] = col })

  const required = ['Számlaszám', 'Kiállító', 'Teljesítés', 'Kelt', 'Fiz.határidő', 'Nettó', 'Áfa', 'Bruttó', 'Fiz.mód', 'Típus']
  const missing = required.filter(h => !hdr[h])
  if (missing.length > 0) {
    return NextResponse.json({ error: `Hiányzó oszlopok: ${missing.join(', ')}` }, { status: 422 })
  }

  const rows: ParsedInvoiceRow[] = []

  ws.eachRow((row, rn) => {
    if (rn === 1) return

    const type = String(row.getCell(hdr['Típus'])?.value ?? '').trim()
    const ACCEPTED_TYPES = ['Számla', 'Elektronikus számla', 'Helyesbítő számla']
    if (!ACCEPTED_TYPES.includes(type)) return  // Sztornó, összesítő sorok: kihagyás

    const supplierName = String(row.getCell(hdr['Kiállító'])?.value ?? '').trim()
    if (!supplierName) return

    const grossAmount = Math.round(Number(row.getCell(hdr['Bruttó'])?.value) || 0)
    if (grossAmount === 0) return  // Pontosan 0: kihagyás; negatív (helyesbítő) OK

    const paymentMethodRaw = String(row.getCell(hdr['Fiz.mód'])?.value ?? '').trim()
    const { method, isUnknown } = mapPayment(paymentMethodRaw)

    rows.push({
      invoiceNumber:   String(row.getCell(hdr['Számlaszám'])?.value ?? '').trim(),
      supplierName,
      performanceDate: isoDate(row.getCell(hdr['Teljesítés'])?.value),
      invoiceDate:     isoDate(row.getCell(hdr['Kelt'])?.value),
      dueDate:         isoDate(row.getCell(hdr['Fiz.határidő'])?.value),
      netAmount:       Math.round(Number(row.getCell(hdr['Nettó'])?.value) || 0),
      vatAmount:       Math.round(Number(row.getCell(hdr['Áfa'])?.value) || 0),
      grossAmount,
      paymentMethod:    method,
      paymentMethodRaw,
      isUnknownPayment: isUnknown,
    })
  })

  return NextResponse.json({ rows, total: rows.length })
}
