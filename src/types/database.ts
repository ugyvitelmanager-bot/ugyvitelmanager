// ============================================================
// Globális TypeScript típusok – az SQL séma alapján
// ============================================================

// --- Enum típusok ---
export type ProductType =
  | 'ingredient'
  | 'recipe_product'
  | 'stock_product'
  | 'service'
  | 'service_with_serial'
  | 'non_stock_sale'

export type SourceType = 'cash_register' | 'terminal' | 'invoice' | 'manual'
export type BusinessArea = 'buffet' | 'fish' | 'event' | 'other'
export type MovementType = 'purchase' | 'sale_recipe' | 'sale_stock' | 'inventory_adjustment' | 'manual' | 'waste' | 'other'
export type RecipeStatus = 'draft' | 'active' | 'archived'
export type EventStatus = 'draft' | 'quote_sent' | 'accepted' | 'completed' | 'closed' | 'cancelled'
export type InventoryStatus = 'draft' | 'finalized'
export type CategoryType = 'product' | 'sale' | 'purchase' | 'event'
export type LocationType = 'buffet' | 'shop' | 'warehouse' | 'other'

// --- Törzsadatok ---
export interface VatRate {
  id: string
  name: string
  rate_percent: number
  is_exempt: boolean
  is_active: boolean
  created_at: string
}

export interface Category {
  id: string
  name: string
  category_type: CategoryType
  parent_id: string | null
  is_active: boolean
  created_at: string
}

export interface Unit {
  id: string
  name: string
  symbol: string
  precision: number
  is_active: boolean
  created_at: string
}

export interface SalesSource {
  id: string
  name: string
  source_type: SourceType
  business_area: BusinessArea
  is_active: boolean
  created_at: string
}

export interface Supplier {
  id: string
  name: string
  tax_number: string | null
  contact_name: string | null
  email: string | null
  phone: string | null
  note: string | null
  is_active: boolean
  created_at: string
}

export interface StorageLocation {
  id: string
  name: string
  location_type: LocationType
  is_active: boolean
  created_at: string
}

// --- Termékek ---
export interface Product {
  id: string
  name: string
  sku: string | null
  product_type: ProductType
  category_id: string | null
  unit_id: string | null
  default_vat_rate_id: string | null
  is_stock_tracked: boolean
  has_serial_tracking: boolean
  default_storage_location_id: string | null
  packaging_description: string | null
  purchase_price_net: number | null
  calculated_unit_cost_net: number | null
  default_sale_price_net: number | null
  default_sale_price_gross: number | null
  note: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joins
  category?: Category
  unit?: Unit
  default_vat_rate?: VatRate
  default_storage_location?: StorageLocation
}

// --- Receptek ---
export interface Recipe {
  id: string
  product_id: string | null
  name: string
  vat_rate_id: string | null
  target_margin_percent: number | null
  status: RecipeStatus
  version_number: number
  is_active: boolean
  created_at: string
  updated_at: string
  // Joins
  product?: Product
  vat_rate?: VatRate
  items?: RecipeItem[]
}

export interface RecipeItem {
  id: string
  recipe_id: string
  ingredient_product_id: string
  quantity: number
  unit_id: string
  unit_cost_net_snapshot: number
  line_cost_net: number
  sort_order: number
  // Joins
  ingredient_product?: Product
  unit?: Unit
}

// --- Beszerzések ---
export interface PurchaseHeader {
  id: string
  purchase_date: string
  supplier_id: string | null
  invoice_number: string | null
  storage_location_id: string | null
  note: string | null
  recorded_at: string
  is_active: boolean
  created_at: string
  // Joins
  supplier?: Supplier
  storage_location?: StorageLocation
  items?: PurchaseItem[]
}

export interface PurchaseItem {
  id: string
  purchase_header_id: string
  product_id: string
  quantity: number
  unit_id: string
  unit_price_net: number
  vat_rate_id: string
  line_net_amount: number
  line_gross_amount: number
  is_stock_affecting: boolean
  // Joins
  product?: Product
  unit?: Unit
  vat_rate?: VatRate
}

// --- Bevételek ---
export interface SalesEntry {
  id: string
  sale_date: string
  recorded_at: string
  source_id: string
  source_type: SourceType
  vat_rate_id: string
  gross_amount: number
  net_amount: number
  category_id: string | null
  entry_type: string | null
  reference_type: string | null
  reference_id: string | null
  note: string | null
  is_active: boolean
  created_at: string
  // Joins
  source?: SalesSource
  vat_rate?: VatRate
  category?: Category
}

// --- Horgászjegy kontroll ---
export interface SerialDocument {
  id: string
  product_id: string
  document_type: string
  series_prefix: string | null
  range_start: number
  range_end: number
  issued_count: number
  note: string | null
  is_active: boolean
  created_at: string
  // Joins
  product?: Product
}

export interface SerialDocumentUsage {
  id: string
  serial_document_id: string
  sale_date: string
  source_id: string | null
  used_from: number
  used_to: number
  quantity: number
  note: string | null
  recorded_at: string
}

// --- Készletmozgások ---
export interface StockMovement {
  id: string
  product_id: string
  storage_location_id: string | null
  movement_type: MovementType
  quantity_change: number
  unit_id: string
  reference_type: string | null
  reference_id: string | null
  note: string | null
  created_at: string
  // Joins
  product?: Product
  storage_location?: StorageLocation
  unit?: Unit
}

// --- Leltár ---
export interface InventoryCount {
  id: string
  name: string
  count_date: string
  storage_location_id: string | null
  count_type: string
  status: InventoryStatus
  note: string | null
  created_at: string
  // Joins
  storage_location?: StorageLocation
  items?: InventoryCountItem[]
}

export interface InventoryCountItem {
  id: string
  inventory_count_id: string
  product_id: string
  system_quantity: number
  counted_quantity: number
  difference_quantity: number
  unit_id: string
  note: string | null
  // Joins
  product?: Product
  unit?: Unit
}

// --- Rendezvények ---
export interface Event {
  id: string
  name: string
  event_date: string | null
  status: EventStatus
  customer_name: string | null
  note: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  // Joins
  items?: EventItem[]
}

export interface EventItem {
  id: string
  event_id: string
  name: string
  product_id: string | null
  quantity: number
  unit_id: string
  unit_cost_net: number
  unit_sale_net: number
  vat_rate_id: string
  line_net_amount: number
  line_gross_amount: number
  sort_order: number
  // Joins
  product?: Product
  unit?: Unit
  vat_rate?: VatRate
}

// --- Felhasználók ---
export interface Profile {
  id: string
  full_name: string | null
  role: 'admin' | 'user'
  is_active: boolean
  created_at: string
}
