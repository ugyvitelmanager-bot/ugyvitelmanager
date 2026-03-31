import type { PurchaseFormState, PurchaseLineItem, PaymentMethod } from '../types'

function makeId(): string {
  return Math.random().toString(36).slice(2)
}

function makeProductItem(): PurchaseLineItem {
  return {
    id: makeId(),
    kind: 'product',
    productId: '',
    quantity: 1,
    unitId: '',
    unitPrice: 0,
    description: '',
    amount: 0,
  }
}

function makeCostItem(): PurchaseLineItem {
  return {
    id: makeId(),
    kind: 'cost',
    productId: '',
    quantity: 0,
    unitId: '',
    unitPrice: 0,
    description: '',
    amount: 0,
  }
}

export function getInitialState(): PurchaseFormState {
  return {
    date: new Date().toISOString().split('T')[0],
    supplier: '',
    invoiceNumber: '',
    paymentMethod: 'cash',
    items: [makeProductItem()],
  }
}

export type PurchaseFormAction =
  | { type: 'SET_DATE'; value: string }
  | { type: 'SET_SUPPLIER'; value: string }
  | { type: 'SET_INVOICE'; value: string }
  | { type: 'SET_PAYMENT'; value: PaymentMethod }
  | { type: 'ADD_PRODUCT_ITEM' }
  | { type: 'ADD_COST_ITEM' }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'UPDATE_ITEM'; id: string; patch: Partial<Omit<PurchaseLineItem, 'id' | 'kind'>> }
  | { type: 'SELECT_PRODUCT'; id: string; productId: string; unitId: string }
  | { type: 'RESET' }

export function purchaseFormReducer(
  state: PurchaseFormState,
  action: PurchaseFormAction
): PurchaseFormState {
  switch (action.type) {
    case 'SET_DATE':
      return { ...state, date: action.value }
    case 'SET_SUPPLIER':
      return { ...state, supplier: action.value }
    case 'SET_INVOICE':
      return { ...state, invoiceNumber: action.value }
    case 'SET_PAYMENT':
      return { ...state, paymentMethod: action.value }
    case 'ADD_PRODUCT_ITEM':
      return { ...state, items: [...state.items, makeProductItem()] }
    case 'ADD_COST_ITEM':
      return { ...state, items: [...state.items, makeCostItem()] }
    case 'REMOVE_ITEM':
      if (state.items.length <= 1) return state
      return { ...state, items: state.items.filter(i => i.id !== action.id) }
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id ? { ...i, ...action.patch } : i
        ),
      }
    case 'SELECT_PRODUCT':
      return {
        ...state,
        items: state.items.map(i =>
          i.id === action.id
            ? { ...i, productId: action.productId, unitId: action.unitId }
            : i
        ),
      }
    case 'RESET':
      return getInitialState()
    default:
      return state
  }
}
