export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      cash_transactions: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          id: string
          note: string | null
          purchase_id: string | null
          source: string
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          id?: string
          note?: string | null
          purchase_id?: string | null
          source: string
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          id?: string
          note?: string | null
          purchase_id?: string | null
          source?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_transactions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      catch_images: {
        Row: {
          catch_id: string
          created_at: string
          id: string
          image_url: string
          uploaded_by: string
        }
        Insert: {
          catch_id: string
          created_at?: string
          id?: string
          image_url: string
          uploaded_by: string
        }
        Update: {
          catch_id?: string
          created_at?: string
          id?: string
          image_url?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "catch_images_catch_id_fkey"
            columns: ["catch_id"]
            isOneToOne: false
            referencedRelation: "catches"
            referencedColumns: ["id"]
          },
        ]
      }
      catches: {
        Row: {
          angler_first_name: string
          approved: boolean
          caught_at: string
          created_at: string
          created_by: string
          fish_id: string
          id: string
          notes: string | null
          station: string
          weight_grams: number
        }
        Insert: {
          angler_first_name: string
          approved?: boolean
          caught_at: string
          created_at?: string
          created_by: string
          fish_id: string
          id?: string
          notes?: string | null
          station: string
          weight_grams: number
        }
        Update: {
          angler_first_name?: string
          approved?: boolean
          caught_at?: string
          created_at?: string
          created_by?: string
          fish_id?: string
          id?: string
          notes?: string | null
          station?: string
          weight_grams?: number
        }
        Relationships: [
          {
            foreignKeyName: "catches_fish_id_fkey"
            columns: ["fish_id"]
            isOneToOne: false
            referencedRelation: "fish"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          business_area: Database["public"]["Enums"]["business_area"]
          category_type: Database["public"]["Enums"]["category_type"]
          created_at: string
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
        }
        Insert: {
          business_area?: Database["public"]["Enums"]["business_area"]
          category_type: Database["public"]["Enums"]["category_type"]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
        }
        Update: {
          business_area?: Database["public"]["Enums"]["business_area"]
          category_type?: Database["public"]["Enums"]["category_type"]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_closing_expenses: {
        Row: {
          amount: number
          created_at: string | null
          daily_closing_id: string
          id: string
          note: string
          sort_order: number
        }
        Insert: {
          amount: number
          created_at?: string | null
          daily_closing_id: string
          id?: string
          note?: string
          sort_order?: number
        }
        Update: {
          amount?: number
          created_at?: string | null
          daily_closing_id?: string
          id?: string
          note?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_closing_expenses_daily_closing_id_fkey"
            columns: ["daily_closing_id"]
            isOneToOne: false
            referencedRelation: "daily_closings"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_closings: {
        Row: {
          bufe_18: number
          bufe_27: number
          bufe_5: number
          bufe_am: number
          bufe_bk_terminal: number
          bufe_pg_card: number
          bufe_pg_cash: number
          bufe_terminal_card: number
          created_at: string | null
          date: string
          expected_cash_closing: number | null
          halas_18: number
          halas_27: number
          halas_5: number
          halas_am: number
          halas_bk_terminal: number
          halas_pg_card: number
          halas_pg_cash: number
          halas_terminal_card: number
          id: string
          member_loan: number
          member_loan_note: string | null
          notes: string | null
          petty_cash_movement: number
          petty_cash_note: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          bufe_18?: number
          bufe_27?: number
          bufe_5?: number
          bufe_am?: number
          bufe_bk_terminal?: number
          bufe_pg_card?: number
          bufe_pg_cash?: number
          bufe_terminal_card?: number
          created_at?: string | null
          date: string
          expected_cash_closing?: number | null
          halas_18?: number
          halas_27?: number
          halas_5?: number
          halas_am?: number
          halas_bk_terminal?: number
          halas_pg_card?: number
          halas_pg_cash?: number
          halas_terminal_card?: number
          id?: string
          member_loan?: number
          member_loan_note?: string | null
          notes?: string | null
          petty_cash_movement?: number
          petty_cash_note?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          bufe_18?: number
          bufe_27?: number
          bufe_5?: number
          bufe_am?: number
          bufe_bk_terminal?: number
          bufe_pg_card?: number
          bufe_pg_cash?: number
          bufe_terminal_card?: number
          created_at?: string | null
          date?: string
          expected_cash_closing?: number | null
          halas_18?: number
          halas_27?: number
          halas_5?: number
          halas_am?: number
          halas_bk_terminal?: number
          halas_pg_card?: number
          halas_pg_cash?: number
          halas_terminal_card?: number
          id?: string
          member_loan?: number
          member_loan_note?: string | null
          notes?: string | null
          petty_cash_movement?: number
          petty_cash_note?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_reports: {
        Row: {
          business_area: string
          cash_total_gross: number | null
          created_at: string | null
          date: string
          id: string
          note: string | null
          terminal_total_gross: number | null
          vat_0_gross: number | null
          vat_27_gross: number | null
          vat_5_gross: number | null
          z_total_gross: number | null
        }
        Insert: {
          business_area: string
          cash_total_gross?: number | null
          created_at?: string | null
          date: string
          id?: string
          note?: string | null
          terminal_total_gross?: number | null
          vat_0_gross?: number | null
          vat_27_gross?: number | null
          vat_5_gross?: number | null
          z_total_gross?: number | null
        }
        Update: {
          business_area?: string
          cash_total_gross?: number | null
          created_at?: string | null
          date?: string
          id?: string
          note?: string | null
          terminal_total_gross?: number | null
          vat_0_gross?: number | null
          vat_27_gross?: number | null
          vat_5_gross?: number | null
          z_total_gross?: number | null
        }
        Relationships: []
      }
      event_items: {
        Row: {
          event_id: string
          id: string
          line_gross_amount: number
          line_net_amount: number
          name: string
          product_id: string | null
          quantity: number
          sort_order: number
          unit_cost_net: number
          unit_id: string
          unit_sale_net: number
          vat_rate_id: string
        }
        Insert: {
          event_id: string
          id?: string
          line_gross_amount?: number
          line_net_amount?: number
          name: string
          product_id?: string | null
          quantity: number
          sort_order?: number
          unit_cost_net?: number
          unit_id: string
          unit_sale_net?: number
          vat_rate_id: string
        }
        Update: {
          event_id?: string
          id?: string
          line_gross_amount?: number
          line_net_amount?: number
          name?: string
          product_id?: string | null
          quantity?: number
          sort_order?: number
          unit_cost_net?: number
          unit_id?: string
          unit_sale_net?: number
          vat_rate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_items_vat_rate_id_fkey"
            columns: ["vat_rate_id"]
            isOneToOne: false
            referencedRelation: "vat_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          customer_name: string | null
          event_date: string | null
          id: string
          is_active: boolean
          name: string
          note: string | null
          status: Database["public"]["Enums"]["event_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_name?: string | null
          event_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          note?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_name?: string | null
          event_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          note?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          updated_at?: string
        }
        Relationships: []
      }
      fish: {
        Row: {
          chip_id: string
          created_at: string
          first_caught_at: string | null
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          chip_id: string
          created_at?: string
          first_caught_at?: string | null
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          chip_id?: string
          created_at?: string
          first_caught_at?: string | null
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_count_items: {
        Row: {
          counted_quantity: number
          difference_quantity: number | null
          id: string
          inventory_count_id: string
          note: string | null
          product_id: string
          system_quantity: number
          unit_id: string
        }
        Insert: {
          counted_quantity?: number
          difference_quantity?: number | null
          id?: string
          inventory_count_id: string
          note?: string | null
          product_id: string
          system_quantity?: number
          unit_id: string
        }
        Update: {
          counted_quantity?: number
          difference_quantity?: number | null
          id?: string
          inventory_count_id?: string
          note?: string | null
          product_id?: string
          system_quantity?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_count_items_inventory_count_id_fkey"
            columns: ["inventory_count_id"]
            isOneToOne: false
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_count_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          count_date: string
          count_type: string
          created_at: string
          id: string
          name: string
          note: string | null
          status: Database["public"]["Enums"]["inventory_status"]
          storage_location_id: string | null
        }
        Insert: {
          count_date: string
          count_type?: string
          created_at?: string
          id?: string
          name: string
          note?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          storage_location_id?: string | null
        }
        Update: {
          count_date?: string
          count_type?: string
          created_at?: string
          id?: string
          name?: string
          note?: string | null
          status?: Database["public"]["Enums"]["inventory_status"]
          storage_location_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          calculated_unit_cost_net: number | null
          category_id: string | null
          created_at: string
          current_stock: number | null
          default_sale_price_gross: number | null
          default_sale_price_net: number | null
          default_storage_location_id: string | null
          default_vat_rate_id: string | null
          has_serial_tracking: boolean
          id: string
          is_active: boolean
          is_mohu_fee: boolean | null
          is_stock_tracked: boolean
          name: string
          note: string | null
          packaging_description: string | null
          product_type: Database["public"]["Enums"]["product_type"]
          purchase_price_net: number | null
          sku: string | null
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          calculated_unit_cost_net?: number | null
          category_id?: string | null
          created_at?: string
          current_stock?: number | null
          default_sale_price_gross?: number | null
          default_sale_price_net?: number | null
          default_storage_location_id?: string | null
          default_vat_rate_id?: string | null
          has_serial_tracking?: boolean
          id?: string
          is_active?: boolean
          is_mohu_fee?: boolean | null
          is_stock_tracked?: boolean
          name: string
          note?: string | null
          packaging_description?: string | null
          product_type: Database["public"]["Enums"]["product_type"]
          purchase_price_net?: number | null
          sku?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          calculated_unit_cost_net?: number | null
          category_id?: string | null
          created_at?: string
          current_stock?: number | null
          default_sale_price_gross?: number | null
          default_sale_price_net?: number | null
          default_storage_location_id?: string | null
          default_vat_rate_id?: string | null
          has_serial_tracking?: boolean
          id?: string
          is_active?: boolean
          is_mohu_fee?: boolean | null
          is_stock_tracked?: boolean
          name?: string
          note?: string | null
          packaging_description?: string | null
          product_type?: Database["public"]["Enums"]["product_type"]
          purchase_price_net?: number | null
          sku?: string | null
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_default_storage_location_id_fkey"
            columns: ["default_storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_default_vat_rate_id_fkey"
            columns: ["default_vat_rate_id"]
            isOneToOne: false
            referencedRelation: "vat_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
        }
        Relationships: []
      }
      purchase_headers: {
        Row: {
          created_at: string
          id: string
          invoice_number: string | null
          is_active: boolean
          note: string | null
          purchase_date: string
          recorded_at: string
          storage_location_id: string | null
          supplier_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_number?: string | null
          is_active?: boolean
          note?: string | null
          purchase_date: string
          recorded_at?: string
          storage_location_id?: string | null
          supplier_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invoice_number?: string | null
          is_active?: boolean
          note?: string | null
          purchase_date?: string
          recorded_at?: string
          storage_location_id?: string | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_headers_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_headers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          id: string
          is_stock_affecting: boolean
          line_gross_amount: number
          line_net_amount: number
          product_id: string
          purchase_header_id: string
          quantity: number
          unit_id: string
          unit_price_net: number
          vat_rate_id: string
        }
        Insert: {
          id?: string
          is_stock_affecting?: boolean
          line_gross_amount: number
          line_net_amount: number
          product_id: string
          purchase_header_id: string
          quantity: number
          unit_id: string
          unit_price_net: number
          vat_rate_id: string
        }
        Update: {
          id?: string
          is_stock_affecting?: boolean
          line_gross_amount?: number
          line_net_amount?: number
          product_id?: string
          purchase_header_id?: string
          quantity?: number
          unit_id?: string
          unit_price_net?: number
          vat_rate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_header_id_fkey"
            columns: ["purchase_header_id"]
            isOneToOne: false
            referencedRelation: "purchase_headers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_vat_rate_id_fkey"
            columns: ["vat_rate_id"]
            isOneToOne: false
            referencedRelation: "vat_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_line_items: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          line_total_net: number
          product_id: string | null
          purchase_id: string
          quantity: number
          unit_id: string | null
          unit_price_net: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          line_total_net: number
          product_id?: string | null
          purchase_id: string
          quantity: number
          unit_id?: string | null
          unit_price_net: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          line_total_net?: number
          product_id?: string | null
          purchase_id?: string
          quantity?: number
          unit_id?: string | null
          unit_price_net?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_line_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_line_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_line_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          created_at: string | null
          date: string
          due_date: string | null
          gross_amount: number | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          is_settled: boolean
          net_amount: number | null
          note: string | null
          payment_method: string
          performance_date: string | null
          supplier_name: string
          total_net: number | null
          vat_amount: number | null
        }
        Insert: {
          created_at?: string | null
          date: string
          due_date?: string | null
          gross_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_settled?: boolean
          net_amount?: number | null
          note?: string | null
          payment_method: string
          performance_date?: string | null
          supplier_name: string
          total_net?: number | null
          vat_amount?: number | null
        }
        Update: {
          created_at?: string | null
          date?: string
          due_date?: string | null
          gross_amount?: number | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          is_settled?: boolean
          net_amount?: number | null
          note?: string | null
          payment_method?: string
          performance_date?: string | null
          supplier_name?: string
          total_net?: number | null
          vat_amount?: number | null
        }
        Relationships: []
      }
      recipe_items: {
        Row: {
          id: string
          ingredient_product_id: string
          line_cost_net: number
          quantity: number
          recipe_id: string
          sort_order: number
          unit_cost_net_snapshot: number
          unit_id: string
        }
        Insert: {
          id?: string
          ingredient_product_id: string
          line_cost_net?: number
          quantity: number
          recipe_id: string
          sort_order?: number
          unit_cost_net_snapshot?: number
          unit_id: string
        }
        Update: {
          id?: string
          ingredient_product_id?: string
          line_cost_net?: number
          quantity?: number
          recipe_id?: string
          sort_order?: number
          unit_cost_net_snapshot?: number
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_ingredient_product_id_fkey"
            columns: ["ingredient_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          product_id: string | null
          status: Database["public"]["Enums"]["recipe_status"]
          target_margin_percent: number | null
          updated_at: string
          vat_rate_id: string | null
          version_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["recipe_status"]
          target_margin_percent?: number | null
          updated_at?: string
          vat_rate_id?: string | null
          version_number?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          product_id?: string | null
          status?: Database["public"]["Enums"]["recipe_status"]
          target_margin_percent?: number | null
          updated_at?: string
          vat_rate_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_vat_rate_id_fkey"
            columns: ["vat_rate_id"]
            isOneToOne: false
            referencedRelation: "vat_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_entries: {
        Row: {
          category_id: string | null
          created_at: string
          entry_type: string | null
          gross_amount: number
          id: string
          is_active: boolean
          net_amount: number
          note: string | null
          recorded_at: string
          reference_id: string | null
          reference_type: string | null
          sale_date: string
          source_id: string
          source_type: Database["public"]["Enums"]["source_type"]
          vat_rate_id: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          entry_type?: string | null
          gross_amount: number
          id?: string
          is_active?: boolean
          net_amount: number
          note?: string | null
          recorded_at?: string
          reference_id?: string | null
          reference_type?: string | null
          sale_date: string
          source_id: string
          source_type: Database["public"]["Enums"]["source_type"]
          vat_rate_id: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          entry_type?: string | null
          gross_amount?: number
          id?: string
          is_active?: boolean
          net_amount?: number
          note?: string | null
          recorded_at?: string
          reference_id?: string | null
          reference_type?: string | null
          sale_date?: string
          source_id?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          vat_rate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_entries_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_entries_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sales_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_entries_vat_rate_id_fkey"
            columns: ["vat_rate_id"]
            isOneToOne: false
            referencedRelation: "vat_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_sources: {
        Row: {
          business_area: Database["public"]["Enums"]["business_area"]
          created_at: string
          id: string
          is_active: boolean
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
        }
        Insert: {
          business_area?: Database["public"]["Enums"]["business_area"]
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
        }
        Update: {
          business_area?: Database["public"]["Enums"]["business_area"]
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
        }
        Relationships: []
      }
      serial_document_usages: {
        Row: {
          id: string
          note: string | null
          quantity: number
          recorded_at: string
          sale_date: string
          serial_document_id: string
          source_id: string | null
          used_from: number
          used_to: number
        }
        Insert: {
          id?: string
          note?: string | null
          quantity: number
          recorded_at?: string
          sale_date: string
          serial_document_id: string
          source_id?: string | null
          used_from: number
          used_to: number
        }
        Update: {
          id?: string
          note?: string | null
          quantity?: number
          recorded_at?: string
          sale_date?: string
          serial_document_id?: string
          source_id?: string | null
          used_from?: number
          used_to?: number
        }
        Relationships: [
          {
            foreignKeyName: "serial_document_usages_serial_document_id_fkey"
            columns: ["serial_document_id"]
            isOneToOne: false
            referencedRelation: "serial_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_document_usages_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "sales_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      serial_documents: {
        Row: {
          created_at: string
          document_type: string
          id: string
          is_active: boolean
          issued_count: number
          note: string | null
          product_id: string
          range_end: number
          range_start: number
          series_prefix: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string
          id?: string
          is_active?: boolean
          issued_count?: number
          note?: string | null
          product_id: string
          range_end: number
          range_start: number
          series_prefix?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          id?: string
          is_active?: boolean
          issued_count?: number
          note?: string | null
          product_id?: string
          range_end?: number
          range_start?: number
          series_prefix?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serial_documents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          created_at: string
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          note: string | null
          product_id: string
          quantity_change: number
          reference_id: string | null
          reference_type: string | null
          storage_location_id: string | null
          unit_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          note?: string | null
          product_id: string
          quantity_change: number
          reference_id?: string | null
          reference_type?: string | null
          storage_location_id?: string | null
          unit_id: string
        }
        Update: {
          created_at?: string
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          note?: string | null
          product_id?: string
          quantity_change?: number
          reference_id?: string | null
          reference_type?: string | null
          storage_location_id?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_storage_location_id_fkey"
            columns: ["storage_location_id"]
            isOneToOne: false
            referencedRelation: "storage_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_locations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          location_type: Database["public"]["Enums"]["location_type"]
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          location_type?: Database["public"]["Enums"]["location_type"]
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          location_type?: Database["public"]["Enums"]["location_type"]
          name?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          note: string | null
          phone: string | null
          tax_number: string | null
        }
        Insert: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          note?: string | null
          phone?: string | null
          tax_number?: string | null
        }
        Update: {
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          note?: string | null
          phone?: string | null
          tax_number?: string | null
        }
        Relationships: []
      }
      units: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          precision: number
          symbol: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          precision?: number
          symbol: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          precision?: number
          symbol?: string
        }
        Relationships: []
      }
      vat_rates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_exempt: boolean
          name: string
          rate_percent: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_exempt?: boolean
          name: string
          rate_percent?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_exempt?: boolean
          name?: string
          rate_percent?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      apply_purchase_line_items: {
        Args: { p_items: Json; p_purchase_id: string }
        Returns: undefined
      }
      create_fish_with_catch: {
        Args: {
          p_angler_first_name: string
          p_caught_at: string
          p_chip_id: string
          p_name: string
          p_notes?: string
          p_station: string
          p_type: string
          p_weight_grams: number
        }
        Returns: string
      }
      increment_product_stock: {
        Args: { p_product_id: string; p_quantity_delta: number }
        Returns: number
      }
      record_purchase_core: {
        Args: {
          p_date: string
          p_invoice_number?: string
          p_items: Json
          p_payment_method: string
          p_supplier_name: string
          p_total_net: number
        }
        Returns: string
      }
      record_purchase_header: {
        Args: {
          p_date: string
          p_due_date?: string
          p_gross_amount: number
          p_invoice_date?: string
          p_invoice_number: string
          p_net_amount: number
          p_payment_method: string
          p_performance_date?: string
          p_supplier_name: string
          p_vat_amount: number
        }
        Returns: string
      }
      replace_daily_closing_expenses: {
        Args: { p_closing_id: string; p_expenses: Json }
        Returns: undefined
      }
    }
    Enums: {
      business_area: "buffet" | "fish" | "event" | "other"
      category_type: "product" | "sale" | "purchase" | "event"
      event_status:
        | "draft"
        | "quote_sent"
        | "accepted"
        | "completed"
        | "closed"
        | "cancelled"
      inventory_status: "draft" | "finalized"
      location_type: "buffet" | "shop" | "warehouse" | "other"
      movement_type:
        | "purchase"
        | "sale_recipe"
        | "sale_stock"
        | "inventory_adjustment"
        | "manual"
        | "waste"
        | "other"
      product_type:
        | "ingredient"
        | "recipe_product"
        | "stock_product"
        | "service"
        | "service_with_serial"
        | "non_stock_sale"
      recipe_status: "draft" | "active" | "archived"
      source_type: "cash_register" | "terminal" | "invoice" | "manual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      business_area: ["buffet", "fish", "event", "other"],
      category_type: ["product", "sale", "purchase", "event"],
      event_status: [
        "draft",
        "quote_sent",
        "accepted",
        "completed",
        "closed",
        "cancelled",
      ],
      inventory_status: ["draft", "finalized"],
      location_type: ["buffet", "shop", "warehouse", "other"],
      movement_type: [
        "purchase",
        "sale_recipe",
        "sale_stock",
        "inventory_adjustment",
        "manual",
        "waste",
        "other",
      ],
      product_type: [
        "ingredient",
        "recipe_product",
        "stock_product",
        "service",
        "service_with_serial",
        "non_stock_sale",
      ],
      recipe_status: ["draft", "active", "archived"],
      source_type: ["cash_register", "terminal", "invoice", "manual"],
    },
  },
} as const
