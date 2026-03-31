import type { PurchaseFormState } from '../types'

export function validatePurchaseForm(state: PurchaseFormState): string | null {
  if (!state.supplier.trim()) return 'Kérlek add meg a beszállítót!'
  if (!state.date) return 'Kérlek add meg a dátumot!'
  if (state.items.length === 0) return 'Legalább egy sort adj meg!'

  for (const item of state.items) {
    if (item.kind === 'product') {
      if (!item.productId) return 'Minden termék sorban válassz terméket!'
      if (Number(item.quantity) <= 0) return 'Minden termék sorban adj meg mennyiséget (> 0)!'
      if (!item.unitId) return 'Minden termék sorban kötelező egységet megadni!'
      if (Number(item.unitPrice) <= 0) return 'Minden termék sorban adj meg egységárat (> 0)!'
    } else {
      if (!item.description.trim()) return 'Minden egyéb költség sorban adj meg megnevezést!'
      if (Number(item.amount) <= 0) return 'Minden egyéb költség sorban adj meg összeget (> 0)!'
    }
  }

  return null
}
