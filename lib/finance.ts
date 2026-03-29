// ============================================================
// Pénzügyi utility függvények
// Minden ár/összeg FILLÉRBEN (integer) van tárolva.
// 1 Ft = 100 fillér
// ============================================================

/**
 * Bruttó összegből ÁFA összeg kiszámítása (fillérben)
 */
export function calculateVatFromGross(grossAmount: number, vatRatePercent: number): number {
  if (vatRatePercent === 0) return 0
  return roundCurrency(grossAmount - grossAmount / (1 + vatRatePercent / 100))
}

/**
 * Nettó összegből bruttó összeg kiszámítása (fillérben)
 */
export function calculateGrossFromNet(netAmount: number, vatRatePercent: number): number {
  return roundCurrency(netAmount * (1 + vatRatePercent / 100))
}

/**
 * Bruttó összegből nettó összeg kiszámítása (fillérben)
 */
export function calculateNetFromGross(grossAmount: number, vatRatePercent: number): number {
  if (vatRatePercent === 0) return grossAmount
  return roundCurrency(grossAmount / (1 + vatRatePercent / 100))
}

/**
 * Kerekítés egész fillérre (integer) - Beszerzési árakhoz és számításokhoz
 */
export function roundCurrency(value: number): number {
  return Math.round(value)
}

/**
 * Kerekítés egész Forintra (100 fillérre) - Eladási árakhoz
 */
export function roundToForint(valueInFiller: number): number {
  return Math.round(valueInFiller / 100) * 100
}

/**
 * Fillér → Forint megjelenítés
 */
export function formatCurrency(amountInFiller: number): string {
  const forint = amountInFiller / 100
  return new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: 'HUF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(forint)
}

/**
 * Forint → Fillér konverzió (input mezőkből)
 */
export function forintToFiller(forint: number): number {
  return Math.round(forint * 100)
}

/**
 * Fillér → Forint konverzió (megjelenítéshez)
 */
export function fillerToForint(filler: number): number {
  return filler / 100
}

// --- Recept kalkuláció ---

/**
 * Egy recept sor költségének kiszámítása
 */
export function calculateRecipeItemCost(quantity: number, unitCostNet: number): number {
  return roundCurrency(quantity * unitCostNet)
}

/**
 * Teljes recept önköltség (fillérben)
 */
export function calculateRecipeTotalCost(items: Array<{ quantity: number; unit_cost_net_snapshot: number }>): number {
  return items.reduce((sum, item) => sum + calculateRecipeItemCost(item.quantity, item.unit_cost_net_snapshot), 0)
}

/**
 * Javasolt nettó ár (önköltség + margin)
 */
export function calculateSuggestedNetPrice(costNet: number, marginPercent: number): number {
  return roundCurrency(costNet * (1 + marginPercent / 100))
}

/**
 * Javasolt bruttó ár (Eladási ár egész Forintra kerekítve!)
 */
export function calculateSuggestedGrossPrice(netPrice: number, vatRatePercent: number): number {
  const gross = calculateGrossFromNet(netPrice, vatRatePercent)
  return roundToForint(gross)
}

// --- Bevétel csoportosítás ---

export function groupSalesByVat(entries: Array<{ vat_rate_id: string; net_amount: number; gross_amount: number }>): Map<string, { net: number; gross: number; vat: number }> {
  const map = new Map<string, { net: number; gross: number; vat: number }>()
  for (const entry of entries) {
    const current = map.get(entry.vat_rate_id) || { net: 0, gross: 0, vat: 0 }
    current.net += entry.net_amount
    current.gross += entry.gross_amount
    current.vat += entry.gross_amount - entry.net_amount
    map.set(entry.vat_rate_id, current)
  }
  return map
}

export function groupSalesBySource(entries: Array<{ source_id: string; net_amount: number; gross_amount: number }>): Map<string, { net: number; gross: number }> {
  const map = new Map<string, { net: number; gross: number }>()
  for (const entry of entries) {
    const current = map.get(entry.source_id) || { net: 0, gross: 0 }
    current.net += entry.net_amount
    current.gross += entry.gross_amount
    map.set(entry.source_id, current)
  }
  return map
}

export type PeriodType = 'day' | 'week' | 'month' | 'year'

export function groupSalesByPeriod(
  entries: Array<{ sale_date: string; net_amount: number; gross_amount: number }>,
  periodType: PeriodType
): Map<string, { net: number; gross: number }> {
  const map = new Map<string, { net: number; gross: number }>()
  for (const entry of entries) {
    const date = new Date(entry.sale_date)
    let key: string
    switch (periodType) {
      case 'day':
        key = entry.sale_date
        break
      case 'week': {
        const startOfWeek = new Date(date)
        startOfWeek.setDate(date.getDate() - date.getDay() + 1) // Monday
        key = startOfWeek.toISOString().split('T')[0]
        break
      }
      case 'month':
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        break
      case 'year':
        key = String(date.getFullYear())
        break
    }
    const current = map.get(key) || { net: 0, gross: 0 }
    current.net += entry.net_amount
    current.gross += entry.gross_amount
    map.set(key, current)
  }
  return map
}

// --- Rendezvény kalkuláció ---

export function calculateEventLineTotal(
  quantity: number,
  unitPriceNet: number,
  vatRatePercent: number
): { lineNet: number; lineGross: number } {
  const lineNet = roundCurrency(quantity * unitPriceNet)
  const lineGross = calculateGrossFromNet(lineNet, vatRatePercent)
  return { lineNet, lineGross }
}

export function calculateEventTotals(
  items: Array<{ line_net_amount: number; line_gross_amount: number }>
): { totalNet: number; totalGross: number; totalVat: number } {
  const totalNet = items.reduce((sum, item) => sum + item.line_net_amount, 0)
  const totalGross = items.reduce((sum, item) => sum + item.line_gross_amount, 0)
  return { totalNet, totalGross, totalVat: totalGross - totalNet }
}

// --- Készlet ---

export interface StockMovementInput {
  product_id: string
  storage_location_id: string | null
  movement_type: string
  quantity_change: number
  unit_id: string
  reference_type?: string
  reference_id?: string
  note?: string
}

export function createStockMovementRecord(input: StockMovementInput) {
  return {
    ...input,
    created_at: new Date().toISOString(),
  }
}

export function calculateInventoryDifference(systemQty: number, countedQty: number): number {
  return countedQty - systemQty
}
