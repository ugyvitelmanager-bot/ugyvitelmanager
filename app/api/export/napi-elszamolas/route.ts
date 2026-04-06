import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { createClient } from '@/lib/supabase/server'

function ft(filler: number | null | undefined): number {
  return Math.round((filler || 0) / 100)
}

const NUM_FMT = '#,##0'

const HEADER_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: 'FFFFFFFF' } },
  alignment: { horizontal: 'center', vertical: 'middle' },
}

const TOTALS_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true },
}

function styleHeaderRow(row: ExcelJS.Row, fillArgb: string) {
  row.height = 20
  row.eachCell(cell => {
    cell.style = {
      ...HEADER_STYLE,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: fillArgb } },
    }
  })
}

function addTotalsRow(sheet: ExcelJS.Worksheet, dataRowCount: number, startCol: number) {
  const lastDataRow = dataRowCount + 1 // +1 mert a header az 1. sor
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const row = sheet.addRow(
    Array.from({ length: sheet.columnCount }, (_, i) => {
      if (i === 0) return 'ÖSSZESEN'
      if (i < startCol - 1) return ''
      const col = letters[i]
      return { formula: `SUM(${col}2:${col}${lastDataRow})` }
    })
  )
  row.eachCell((cell, colNum) => {
    cell.style = {
      ...TOTALS_STYLE,
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } },
      numFmt: colNum > 1 ? NUM_FMT : undefined,
    }
  })
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const from = searchParams.get('from')
  const to   = searchParams.get('to')

  if (!from || !to) {
    return NextResponse.json({ error: 'from és to paraméter szükséges (YYYY-MM-DD)' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: rows, error } = await (supabase.from('daily_closings') as any)
    .select(`
      date,
      halas_27, halas_18, halas_am,
      halas_pg_cash, halas_pg_card, halas_terminal_card,
      bufe_27, bufe_5, bufe_am,
      bufe_pg_cash, bufe_pg_card, bufe_terminal_card
    `)
    .gte('date', from)
    .lte('date', to)
    .order('date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const closings: any[] = rows || []

  // ============================================================
  // ExcelJS munkafüzet
  // ============================================================
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Ügyvitel Manager'
  wb.created = new Date()

  // ------------------------------------------------------------
  // 1. lap: Bevételek – ÁFA bontás
  // ------------------------------------------------------------
  const s1 = wb.addWorksheet('Bevételek – ÁFA bontás')
  s1.columns = [
    { key: 'date',        header: 'Dátum',       width: 14 },
    { key: 'halas_27',    header: 'Halas 27%',   width: 15, style: { numFmt: NUM_FMT } },
    { key: 'halas_18',    header: 'Halas 18%',   width: 15, style: { numFmt: NUM_FMT } },
    { key: 'halas_am',    header: 'Halas ÁM',    width: 15, style: { numFmt: NUM_FMT } },
    { key: 'halas_total', header: 'Halas Össz',  width: 15, style: { numFmt: NUM_FMT } },
    { key: 'bufe_27',     header: 'Büfé 27%',    width: 15, style: { numFmt: NUM_FMT } },
    { key: 'bufe_5',      header: 'Büfé 5%',     width: 15, style: { numFmt: NUM_FMT } },
    { key: 'bufe_am',     header: 'Büfé ÁM',     width: 15, style: { numFmt: NUM_FMT } },
    { key: 'bufe_total',  header: 'Büfé Össz',   width: 15, style: { numFmt: NUM_FMT } },
    { key: 'total',       header: 'Napi Össz',   width: 15, style: { numFmt: NUM_FMT } },
  ]
  styleHeaderRow(s1.getRow(1), 'FF059669') // emerald-600

  for (const c of closings) {
    const h27    = ft(c.halas_27)
    const h18    = ft(c.halas_18)
    const ham    = ft(c.halas_am)
    const htotal = h27 + h18 + ham
    const b27    = ft(c.bufe_27)
    const b5     = ft(c.bufe_5)
    const bam    = ft(c.bufe_am)
    const btotal = b27 + b5 + bam
    s1.addRow({ date: c.date, halas_27: h27, halas_18: h18, halas_am: ham, halas_total: htotal, bufe_27: b27, bufe_5: b5, bufe_am: bam, bufe_total: btotal, total: htotal + btotal })
  }
  if (closings.length > 0) addTotalsRow(s1, closings.length, 2)

  // Összeg oszlopok igazítása
  s1.eachRow((row, rn) => {
    if (rn === 1) return
    row.eachCell((cell, cn) => { if (cn > 1) cell.alignment = { horizontal: 'right' } })
  })

  // ------------------------------------------------------------
  // 2. lap: Napi fizetési módok
  // ------------------------------------------------------------
  const s2 = wb.addWorksheet('Napi fizetési módok')
  s2.columns = [
    { key: 'date',   header: 'Dátum',               width: 14 },
    { key: 'bk',     header: 'Bankkártya (terminál)', width: 22, style: { numFmt: NUM_FMT } },
    { key: 'kp',     header: 'Készpénz',             width: 16, style: { numFmt: NUM_FMT } },
    { key: 'total',  header: 'Össz bevétel',         width: 16, style: { numFmt: NUM_FMT } },
  ]
  styleHeaderRow(s2.getRow(1), 'FF2563EB') // blue-600

  for (const c of closings) {
    const bk    = ft(c.halas_terminal_card) + ft(c.bufe_terminal_card)
    const kp    = ft(c.halas_pg_cash)       + ft(c.bufe_pg_cash)
    const total = ft(c.halas_27) + ft(c.halas_18) + ft(c.halas_am)
                + ft(c.bufe_27)  + ft(c.bufe_5)   + ft(c.bufe_am)
    s2.addRow({ date: c.date, bk, kp, total })
  }
  if (closings.length > 0) addTotalsRow(s2, closings.length, 2)

  s2.eachRow((row, rn) => {
    if (rn === 1) return
    row.eachCell((cell, cn) => { if (cn > 1) cell.alignment = { horizontal: 'right' } })
  })

  // ------------------------------------------------------------
  // Válasz
  // ------------------------------------------------------------
  const buffer = await wb.xlsx.writeBuffer()
  const filename = `konyvelesi_export_${from}_${to}.xlsx`

  return new NextResponse(new Uint8Array(buffer as Buffer), {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
