import type { PurchaseFormState } from '../types'

export function validatePurchaseForm(state: PurchaseFormState): string | null {
  if (!state.supplier.trim()) return 'Kérlek add meg a beszállítót!'
  if (!state.date) return 'Kérlek add meg a dátumot!'
  if (state.items.some(i => !i.productId)) return 'Minden sorban válassz terméket!'
  if (state.items.some(i => Number(i.quantity) <= 0)) return 'Minden sorban adj meg mennyiséget (> 0)!'
  if (state.items.some(i => !i.unitId)) return 'Minden sorban kötelező egységet megadni!'
  if (state.items.some(i => Number(i.unitPrice) <= 0)) return 'Minden sorban adj meg egységárat (> 0)!'
  return null
}
