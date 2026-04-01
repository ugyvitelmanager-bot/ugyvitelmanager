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
  business_area: BusinessArea
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
  is_mohu_fee: boolean | null
  current_stock: number | null
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

// --- MVP táblák (purchases 4b, cash_transactions, daily_reports, purchase_line_items) ---

export type PaymentMethod = 'cash' | 'bank_transfer'

export interface Purchase {
  id: string
  created_at: string | null
  date: string
  invoice_number: string | null
  supplier_name: string
  total_net: number          // BIGINT — fillér
  payment_method: PaymentMethod
  note: string | null
  // Joins
  purchase_line_items?: PurchaseLineItem[]
}

export interface PurchaseLineItem {
  id: string
  purchase_id: string
  product_id: string | null  // NULL cost soroknál
  quantity: number           // NUMERIC(10,4); cost soroknál mindig 1
  unit_id: string | null     // NULL cost soroknál
  unit_price_net: number     // INTEGER — fillér
  line_total_net: number     // BIGINT — fillér
  description: string | null // cost soroknál kitöltött, termék soroknál NULL
  created_at: string | null
  // Joins
  product?: Product
  unit?: Unit
}

export interface CashTransaction {
  id: string
  created_at: string | null
  date: string
  amount: number             // BIGINT — fillér
  type: string               // 'expense' | 'income' | 'loan_in' | stb.
  source: string             // 'daily_kassza' | 'petty_cash' | stb.
  note: string | null
  purchase_id: string | null
}

export interface DailyReport {
  id: string
  created_at: string | null
  date: string
  business_area: string      // TEXT — nem enum, lásd schema megjegyzés
  z_total_gross: number      // BIGINT — fillér
  terminal_total_gross: number
  cash_total_gross: number
  vat_5_gross: number
  vat_27_gross: number
  vat_0_gross: number
  note: string | null
}

// --- Napi elszámolás (daily_closings + daily_closing_expenses) ---
// FÜGGETLEN a fenti DailyReport-tól (incomes modul / Z-report)

export type DailyClosingStatus = 'draft' | 'final'

export interface DailyClosing {
  id: string
  date: string
  // HALAS PG (AP A17710081) — adónem bontás, fillér
  halas_27: number
  halas_18: number
  halas_am: number
  // HALAS fizetési mód bontás (PG szerint), fillér
  halas_pg_cash: number
  halas_pg_card: number
  // HALAS terminál tényleges zárás, fillér
  halas_terminal_card: number
  // BÜFÉ PG (AP A19202513) — adónem bontás, fillér
  bufe_27: number
  bufe_5: number
  bufe_am: number
  // BÜFÉ fizetési mód bontás (PG szerint), fillér
  bufe_pg_cash: number
  bufe_pg_card: number
  // BÜFÉ terminál tényleges zárás, fillér
  bufe_terminal_card: number
  // Tagi kölcsön — fillér
  member_loan: number
  member_loan_note: string | null
  // Házipénztár mozgás — fillér
  petty_cash_movement: number
  petty_cash_note: string | null
  // Meta
  notes: string | null
  status: DailyClosingStatus
  created_at: string | null
  updated_at: string | null
}

export interface DailyClosingExpense {
  id: string
  daily_closing_id: string
  amount: number   // fillér
  note: string
  sort_order: number
  created_at: string | null
}

// RPC args típus — a record_purchase_core p_items JSONB payload-hoz
// product_id === null → cost sor (nincs készletfrissítés)
// product_id !== null → termék sor (készlet + ár frissítés)
export interface PurchaseCoreItemInput {
  product_id: string | null
  quantity: number           // cost soroknál mindig 1
  unit_id: string | null     // cost soroknál NULL
  unit_price_net: number     // INTEGER fillér — a TS oldal konvertálja
  description?: string       // cost soroknál kötelező
}

// --- Supabase Wrapper Type ---
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Partial<Profile>
        Update: Partial<Profile>
      }
      events: { Row: Event; Insert: Partial<Event>; Update: Partial<Event> }
      event_items: { Row: EventItem; Insert: Partial<EventItem>; Update: Partial<EventItem> }
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> }
      recipes: { Row: Recipe; Insert: Partial<Recipe>; Update: Partial<Recipe> }
      recipe_items: { Row: RecipeItem; Insert: Partial<RecipeItem>; Update: Partial<RecipeItem> }
      sales_entries: { Row: SalesEntry; Insert: Partial<SalesEntry>; Update: Partial<SalesEntry> }
      purchase_headers: { Row: PurchaseHeader; Insert: Partial<PurchaseHeader>; Update: Partial<PurchaseHeader> }
      purchase_items: { Row: PurchaseItem; Insert: Partial<PurchaseItem>; Update: Partial<PurchaseItem> }
      stock_movements: { Row: StockMovement; Insert: Partial<StockMovement>; Update: Partial<StockMovement> }
      inventory_counts: { Row: InventoryCount; Insert: Partial<InventoryCount>; Update: Partial<InventoryCount> }
      inventory_count_items: { Row: InventoryCountItem; Insert: Partial<InventoryCountItem>; Update: Partial<InventoryCountItem> }
      vat_rates: { Row: VatRate; Insert: Partial<VatRate>; Update: Partial<VatRate> }
      categories: { Row: Category; Insert: Partial<Category>; Update: Partial<Category> }
      units: { Row: Unit; Insert: Partial<Unit>; Update: Partial<Unit> }
      sales_sources: { Row: SalesSource; Insert: Partial<SalesSource>; Update: Partial<SalesSource> }
      suppliers: { Row: Supplier; Insert: Partial<Supplier>; Update: Partial<Supplier> }
      storage_locations: { Row: StorageLocation; Insert: Partial<StorageLocation>; Update: Partial<StorageLocation> }
      serial_documents: { Row: SerialDocument; Insert: Partial<SerialDocument>; Update: Partial<SerialDocument> }
      serial_document_usages: { Row: SerialDocumentUsage; Insert: Partial<SerialDocumentUsage>; Update: Partial<SerialDocumentUsage> }
      // MVP táblák
      purchases: { Row: Purchase; Insert: Partial<Purchase>; Update: Partial<Purchase> ;Relationships: []}
      purchase_line_items: { Row: PurchaseLineItem; Insert: Partial<PurchaseLineItem>; Update: Partial<PurchaseLineItem> ;Relationships: []}
      cash_transactions: { Row: CashTransaction; Insert: Partial<CashTransaction>; Update: Partial<CashTransaction> ;Relationships: []}
      daily_reports: { Row: DailyReport; Insert: Partial<DailyReport>; Update: Partial<DailyReport> ;Relationships: []}
      daily_closings: { Row: DailyClosing; Insert: Partial<DailyClosing>; Update: Partial<DailyClosing>; Relationships: [] }
      daily_closing_expenses: { Row: DailyClosingExpense; Insert: Partial<DailyClosingExpense>; Update: Partial<DailyClosingExpense>; Relationships: [] }
    }
    Functions: {
      record_purchase_core: {
        Args: {
          p_date: string
          p_supplier_name: string
          p_invoice_number: string | null
          p_payment_method: PaymentMethod
          p_total_net: number
          p_items: PurchaseCoreItemInput[]
        }
        Returns: string   // purchases.id UUID
      }
      increment_product_stock: {
        Args: {
          p_product_id: string
          p_quantity_delta: number
        }
        Returns: number   // új current_stock érték
      }
    }
  }
}

