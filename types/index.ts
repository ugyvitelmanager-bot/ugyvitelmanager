// Stable re-export layer — add manual types here, NOT in database.ts.
// database.ts is auto-generated and gets overwritten by:
//   npx supabase gen types typescript --project-id rjhqrniwmowqddaizufe --schema public > types/database.ts

import type { Database } from './database'

export type { Json, Database } from './database'

// ── Generic table helpers ────────────────────────────────────
type Tables = Database['public']['Tables']

export type DbRow<T extends keyof Tables> = Tables[T]['Row']
export type DbInsert<T extends keyof Tables> = Tables[T]['Insert']
export type DbUpdate<T extends keyof Tables> = Tables[T]['Update']

// ── Named row types (add new ones here as needed) ────────────
export type Profile        = DbRow<'profiles'>
export type DailyClosing   = DbRow<'daily_closings'>
export type Purchase       = DbRow<'purchases'>
export type PurchaseHeader = DbRow<'purchase_headers'>
export type Product        = DbRow<'products'>
export type Supplier       = DbRow<'suppliers'>
