import type { DailyClosingStatus } from '../types'

export const CLOSING_STATUS_LABELS: Record<DailyClosingStatus, string> = {
  draft: 'Vázlat',
  final: 'Végleges',
}

export const CLOSING_STATUS_BADGE: Record<DailyClosingStatus, string> = {
  draft: 'bg-yellow-100 text-yellow-800 border border-yellow-300',
  final: 'bg-green-100 text-green-800 border border-green-300',
}

// Ezek a payment_method értékek számítanak KP kiadásnak
export const CASH_PAYMENT_METHODS = [
  'cash',
] as const

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash:          'Készpénz (KP)',
  bank_transfer: 'Banki Utalás',
  card:          'PG Bankkártya',
}
