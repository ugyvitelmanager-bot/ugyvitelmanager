export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      // ── Törzsadatok ─────────────────────────────────────────────
      vat_rates: {
        Row: {
          id: string
          name: string
          rate_percent: number
          is_exempt: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          rate_percent?: number
          is_exempt?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          rate_percent?: number
          is_exempt?: boolean
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          category_type: Database["public"]["Enums"]["category_type"]
          parent_id: string | null
          business_area: Database["public"]["Enums"]["business_area"]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category_type: Database["public"]["Enums"]["category_type"]
          parent_id?: string | null
          business_area?: Database["public"]["Enums"]["business_area"]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category_type?: Database["public"]["Enums"]["category_type"]
          parent_id?: string | null
          business_area?: Database["public"]["Enums"]["business_area"]
          is_active?: boolean
          created_at?: string
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
      units: {
        Row: {
          id: string
          name: string
          symbol: string
          precision: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          symbol: string
          precision?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          symbol?: string
          precision?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      sales_sources: {
        Row: {
          id: string
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          business_area: Database["public"]["Enums"]["business_area"]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          source_type: Database["public"]["Enums"]["source_type"]
          business_area?: Database["public"]["Enums"]["business_area"]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          business_area?: Database["public"]["Enums"]["business_area"]
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
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
        Insert: {
          id?: string
          name: string
          tax_number?: string | null
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          note?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          tax_number?: string | null
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          note?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      storage_locations: {
        Row: {
          id: string
          name: string
          location_type: Database["public"]["Enums"]["location_type"]
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          location_type?: Database["public"]["Enums"]["location_type"]
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          location_type?: Database["public"]["Enums"]["location_type"]
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      // ── Termékek ────────────────────────────────────────────────
      products: {
        Row: {
          id: string
          name: string
          sku: string | null
          product_type: Database["public"]["Enums"]["product_type"]
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
        }
        Insert: {
          id?: string
          name: string
          sku?: string | null
          product_type: Database["public"]["Enums"]["product_type"]
          category_id?: string | null
          unit_id?: string | null
          default_vat_rate_id?: string | null
          is_stock_tracked?: boolean
          has_serial_tracking?: boolean
          default_storage_location_id?: string | null
          packaging_description?: string | null
          purchase_price_net?: number | null
          calculated_unit_cost_net?: number | null
          default_sale_price_net?: number | null
          default_sale_price_gross?: number | null
          note?: string | null
          is_mohu_fee?: boolean | null
          current_stock?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sku?: string | null
          product_type?: Database["public"]["Enums"]["product_type"]
          category_id?: string | null
          unit_id?: string | null
          default_vat_rate_id?: string | null
          is_stock_tracked?: boolean
          has_serial_tracking?: boolean
          default_storage_location_id?: string | null
          packaging_description?: string | null
          purchase_price_net?: number | null
          calculated_unit_cost_net?: number | null
          default_sale_price_net?: number | null
          default_sale_price_gross?: number | null
          note?: string | null
          is_mohu_fee?: boolean | null
          current_stock?: number | null
          is_active?: boolean
          created_at?: string
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
            foreignKeyName: "products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_default_vat_rate_id_fkey"
            columns: ["default_vat_rate_id"]
            isOneToOne: false
            referencedRelation: "vat_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      // ── Receptek ────────────────────────────────────────────────
      recipes: {
        Row: {
          id: string
          product_id: string | null
          name: string
          vat_rate_id: string | null
          target_margin_percent: number | null
          status: Database["public"]["Enums"]["recipe_status"]
          version_number: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id?: string | null
          name: string
          vat_rate_id?: string | null
          target_margin_percent?: number | null
          status?: Database["public"]["Enums"]["recipe_status"]
          version_number?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string | null
          name?: string
          vat_rate_id?: string | null
          target_margin_percent?: number | null
          status?: Database["public"]["Enums"]["recipe_status"]
          version_number?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipe_items: {
        Row: {
          id: string
          recipe_id: string
          ingredient_product_id: string
          quantity: number
          unit_id: string
          unit_cost_net_snapshot: number
          line_cost_net: number
          sort_order: number
        }
        Insert: {
          id?: string
          recipe_id: string
          ingredient_product_id: string
          quantity: number
          unit_id: string
          unit_cost_net_snapshot?: number
          line_cost_net?: number
          sort_order?: number
        }
        Update: {
          id?: string
          recipe_id?: string
          ingredient_product_id?: string
          quantity?: number
          unit_id?: string
          unit_cost_net_snapshot?: number
          line_cost_net?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      // ── Beszerzések (Phase 2 / legacy) ──────────────────────────
      purchase_headers: {
        Row: {
          id: string
          purchase_date: string
          supplier_id: string | null
          invoice_number: string | null
          storage_location_id: string | null
          note: string | null
          recorded_at: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          purchase_date: string
          supplier_id?: string | null
          invoice_number?: string | null
          storage_location_id?: string | null
          note?: string | null
          recorded_at?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          purchase_date?: string
          supplier_id?: string | null
          invoice_number?: string | null
          storage_location_id?: string | null
          note?: string | null
          recorded_at?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
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
        }
        Insert: {
          id?: string
          purchase_header_id: string
          product_id: string
          quantity: number
          unit_id: string
          unit_price_net: number
          vat_rate_id: string
          line_net_amount: number
          line_gross_amount: number
          is_stock_affecting?: boolean
        }
        Update: {
          id?: string
          purchase_header_id?: string
          product_id?: string
          quantity?: number
          unit_id?: string
          unit_price_net?: number
          vat_rate_id?: string
          line_net_amount?: number
          line_gross_amount?: number
          is_stock_affecting?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_purchase_header_id_fkey"
            columns: ["purchase_header_id"]
            isOneToOne: false
            referencedRelation: "purchase_headers"
            referencedColumns: ["id"]
          },
        ]
      }
      // ── Beszerzések (MVP) ───────────────────────────────────────
      purchases: {
        Row: {
          id: string
          created_at: string | null
          date: string
          invoice_number: string | null
          supplier_name: string
          total_net: number
          payment_method: string
          note: string | null
          net_amount: number | null
          vat_amount: number | null
          gross_amount: number | null
          performance_date: string | null
          invoice_date: string | null
          due_date: string | null
          is_settled: boolean
        }
        Insert: {
          id?: string
          created_at?: string | null
          date: string
          invoice_number?: string | null
          supplier_name: string
          total_net?: number
          payment_method: string
          note?: string | null
          net_amount?: number | null
          vat_amount?: number | null
          gross_amount?: number | null
          performance_date?: string | null
          invoice_date?: string | null
          due_date?: string | null
          is_settled?: boolean
        }
        Update: {
          id?: string
          created_at?: string | null
          date?: string
          invoice_number?: string | null
          supplier_name?: string
          total_net?: number
          payment_method?: string
          note?: string | null
          net_amount?: number | null
          vat_amount?: number | null
          gross_amount?: number | null
          performance_date?: string | null
          invoice_date?: string | null
          due_date?: string | null
          is_settled?: boolean
        }
        Relationships: []
      }
      purchase_line_items: {
        Row: {
          id: string
          purchase_id: string
          product_id: string | null
          quantity: number
          unit_id: string | null
          unit_price_net: number
          line_total_net: number
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          purchase_id: string
          product_id?: string | null
          quantity: number
          unit_id?: string | null
          unit_price_net: number
          line_total_net: number
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          purchase_id?: string
          product_id?: string | null
          quantity?: number
          unit_id?: string | null
          unit_price_net?: number
          line_total_net?: number
          description?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_line_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      // ── Pénztár ─────────────────────────────────────────────────
      cash_transactions: {
        Row: {
          id: string
          created_at: string | null
          date: string
          amount: number
          type: string
          source: string
          note: string | null
          purchase_id: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          date: string
          amount: number
          type: string
          source: string
          note?: string | null
          purchase_id?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          date?: string
          amount?: number
          type?: string
          source?: string
          note?: string | null
          purchase_id?: string | null
        }
        Relationships: []
      }
      // ── Napi riportok ───────────────────────────────────────────
      daily_reports: {
        Row: {
          id: string
          created_at: string | null
          date: string
          business_area: string
          z_total_gross: number | null
          terminal_total_gross: number | null
          cash_total_gross: number | null
          vat_5_gross: number | null
          vat_27_gross: number | null
          vat_0_gross: number | null
          note: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          date: string
          business_area: string
          z_total_gross?: number | null
          terminal_total_gross?: number | null
          cash_total_gross?: number | null
          vat_5_gross?: number | null
          vat_27_gross?: number | null
          vat_0_gross?: number | null
          note?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          date?: string
          business_area?: string
          z_total_gross?: number | null
          terminal_total_gross?: number | null
          cash_total_gross?: number | null
          vat_5_gross?: number | null
          vat_27_gross?: number | null
          vat_0_gross?: number | null
          note?: string | null
        }
        Relationships: []
      }
      // ── Napi zárás ──────────────────────────────────────────────
      daily_closings: {
        Row: {
          id: string
          date: string
          halas_27: number
          halas_18: number
          halas_am: number
          halas_pg_cash: number
          halas_pg_card: number
          halas_terminal_card: number
          bufe_27: number
          bufe_5: number
          bufe_am: number
          bufe_pg_cash: number
          bufe_pg_card: number
          bufe_terminal_card: number
          member_loan: number
          member_loan_note: string | null
          petty_cash_movement: number
          petty_cash_note: string | null
          notes: string | null
          status: string
          expected_cash_closing: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          date: string
          halas_27?: number
          halas_18?: number
          halas_am?: number
          halas_pg_cash?: number
          halas_pg_card?: number
          halas_terminal_card?: number
          bufe_27?: number
          bufe_5?: number
          bufe_am?: number
          bufe_pg_cash?: number
          bufe_pg_card?: number
          bufe_terminal_card?: number
          member_loan?: number
          member_loan_note?: string | null
          petty_cash_movement?: number
          petty_cash_note?: string | null
          notes?: string | null
          status?: string
          expected_cash_closing?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          date?: string
          halas_27?: number
          halas_18?: number
          halas_am?: number
          halas_pg_cash?: number
          halas_pg_card?: number
          halas_terminal_card?: number
          bufe_27?: number
          bufe_5?: number
          bufe_am?: number
          bufe_pg_cash?: number
          bufe_pg_card?: number
          bufe_terminal_card?: number
          member_loan?: number
          member_loan_note?: string | null
          petty_cash_movement?: number
          petty_cash_note?: string | null
          notes?: string | null
          status?: string
          expected_cash_closing?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_closing_expenses: {
        Row: {
          id: string
          daily_closing_id: string
          amount: number
          note: string
          sort_order: number
          created_at: string | null
        }
        Insert: {
          id?: string
          daily_closing_id: string
          amount: number
          note?: string
          sort_order?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          daily_closing_id?: string
          amount?: number
          note?: string
          sort_order?: number
          created_at?: string | null
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
      // ── Bevételek ───────────────────────────────────────────────
      sales_entries: {
        Row: {
          id: string
          sale_date: string
          recorded_at: string
          source_id: string
          source_type: Database["public"]["Enums"]["source_type"]
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
        }
        Insert: {
          id?: string
          sale_date: string
          recorded_at?: string
          source_id: string
          source_type: Database["public"]["Enums"]["source_type"]
          vat_rate_id: string
          gross_amount: number
          net_amount: number
          category_id?: string | null
          entry_type?: string | null
          reference_type?: string | null
          reference_id?: string | null
          note?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          sale_date?: string
          recorded_at?: string
          source_id?: string
          source_type?: Database["public"]["Enums"]["source_type"]
          vat_rate_id?: string
          gross_amount?: number
          net_amount?: number
          category_id?: string | null
          entry_type?: string | null
          reference_type?: string | null
          reference_id?: string | null
          note?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      // ── Horgászjegy kontroll ────────────────────────────────────
      serial_documents: {
        Row: {
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
        }
        Insert: {
          id?: string
          product_id: string
          document_type?: string
          series_prefix?: string | null
          range_start: number
          range_end: number
          issued_count?: number
          note?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          document_type?: string
          series_prefix?: string | null
          range_start?: number
          range_end?: number
          issued_count?: number
          note?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      serial_document_usages: {
        Row: {
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
        Insert: {
          id?: string
          serial_document_id: string
          sale_date: string
          source_id?: string | null
          used_from: number
          used_to: number
          quantity: number
          note?: string | null
          recorded_at?: string
        }
        Update: {
          id?: string
          serial_document_id?: string
          sale_date?: string
          source_id?: string | null
          used_from?: number
          used_to?: number
          quantity?: number
          note?: string | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "serial_document_usages_serial_document_id_fkey"
            columns: ["serial_document_id"]
            isOneToOne: false
            referencedRelation: "serial_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      // ── Készletmozgások ─────────────────────────────────────────
      stock_movements: {
        Row: {
          id: string
          product_id: string
          storage_location_id: string | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          quantity_change: number
          unit_id: string
          reference_type: string | null
          reference_id: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          storage_location_id?: string | null
          movement_type: Database["public"]["Enums"]["movement_type"]
          quantity_change: number
          unit_id: string
          reference_type?: string | null
          reference_id?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          storage_location_id?: string | null
          movement_type?: Database["public"]["Enums"]["movement_type"]
          quantity_change?: number
          unit_id?: string
          reference_type?: string | null
          reference_id?: string | null
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      // ── Leltár ──────────────────────────────────────────────────
      inventory_counts: {
        Row: {
          id: string
          name: string
          count_date: string
          storage_location_id: string | null
          count_type: string
          status: Database["public"]["Enums"]["inventory_status"]
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          count_date: string
          storage_location_id?: string | null
          count_type?: string
          status?: Database["public"]["Enums"]["inventory_status"]
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          count_date?: string
          storage_location_id?: string | null
          count_type?: string
          status?: Database["public"]["Enums"]["inventory_status"]
          note?: string | null
          created_at?: string
        }
        Relationships: []
      }
      inventory_count_items: {
        Row: {
          id: string
          inventory_count_id: string
          product_id: string
          system_quantity: number
          counted_quantity: number
          difference_quantity: number | null
          unit_id: string
          note: string | null
        }
        Insert: {
          id?: string
          inventory_count_id: string
          product_id: string
          system_quantity?: number
          counted_quantity?: number
          difference_quantity?: number | null
          unit_id: string
          note?: string | null
        }
        Update: {
          id?: string
          inventory_count_id?: string
          product_id?: string
          system_quantity?: number
          counted_quantity?: number
          difference_quantity?: number | null
          unit_id?: string
          note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_count_items_inventory_count_id_fkey"
            columns: ["inventory_count_id"]
            isOneToOne: false
            referencedRelation: "inventory_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      // ── Rendezvények ────────────────────────────────────────────
      events: {
        Row: {
          id: string
          name: string
          event_date: string | null
          status: Database["public"]["Enums"]["event_status"]
          customer_name: string | null
          note: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          event_date?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          customer_name?: string | null
          note?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          event_date?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          customer_name?: string | null
          note?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_items: {
        Row: {
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
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          product_id?: string | null
          quantity: number
          unit_id: string
          unit_cost_net?: number
          unit_sale_net?: number
          vat_rate_id: string
          line_net_amount?: number
          line_gross_amount?: number
          sort_order?: number
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          product_id?: string | null
          quantity?: number
          unit_id?: string
          unit_cost_net?: number
          unit_sale_net?: number
          vat_rate_id?: string
          line_net_amount?: number
          line_gross_amount?: number
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      // ── Profil ──────────────────────────────────────────────────
      profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      record_purchase_core: {
        Args: {
          p_date: string
          p_supplier_name: string
          p_invoice_number: string | null
          p_payment_method: string
          p_total_net: number
          p_items: Json
        }
        Returns: string
      }
      record_purchase_header: {
        Args: {
          p_date: string
          p_supplier_name: string
          p_invoice_number: string | null
          p_payment_method: string
          p_net_amount: number
          p_vat_amount: number
          p_gross_amount: number
          p_performance_date?: string | null
          p_invoice_date?: string | null
          p_due_date?: string | null
        }
        Returns: string
      }
      apply_purchase_line_items: {
        Args: {
          p_purchase_id: string
          p_items: Json
        }
        Returns: undefined
      }
      replace_daily_closing_expenses: {
        Args: {
          p_closing_id: string
          p_expenses: Json
        }
        Returns: undefined
      }
      increment_product_stock: {
        Args: {
          p_product_id: string
          p_quantity_delta: number
        }
        Returns: number
      }
    }
    Enums: {
      business_area: "buffet" | "fish" | "event" | "other"
      category_type: "product" | "sale" | "purchase" | "event"
      event_status: "draft" | "quote_sent" | "accepted" | "completed" | "closed" | "cancelled"
      inventory_status: "draft" | "finalized"
      location_type: "buffet" | "shop" | "warehouse" | "other"
      movement_type: "purchase" | "sale_recipe" | "sale_stock" | "inventory_adjustment" | "manual" | "waste" | "other"
      product_type: "ingredient" | "recipe_product" | "stock_product" | "service" | "service_with_serial" | "non_stock_sale"
      recipe_status: "draft" | "active" | "archived"
      source_type: "cash_register" | "terminal" | "invoice" | "manual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName]["Row"]

export type TablesInsert<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName]["Insert"]

export type TablesUpdate<
  TableName extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][TableName]["Update"]

export type Enums<
  EnumName extends keyof DefaultSchema["Enums"],
> = DefaultSchema["Enums"][EnumName]

// ── Convenience aliases ──────────────────────────────────────────
export type DailyClosing = Tables<"daily_closings">
export type DailyClosingExpense = Tables<"daily_closing_expenses">
export type Purchase = Tables<"purchases">
export type PurchaseLineItem = Tables<"purchase_line_items">
export type CashTransaction = Tables<"cash_transactions">
export type Product = Tables<"products">
export type Unit = Tables<"units">
export type Category = Tables<"categories">
export type VatRate = Tables<"vat_rates">
export type Supplier = Tables<"suppliers">
export type Event = Tables<"events">

export type Profile = Tables<"profiles">

export type DailyClosingInsert = TablesInsert<"daily_closings">
export type DailyClosingExpenseInsert = TablesInsert<"daily_closing_expenses">
export type PurchaseInsert = TablesInsert<"purchases">
export type ProductInsert = TablesInsert<"products">
