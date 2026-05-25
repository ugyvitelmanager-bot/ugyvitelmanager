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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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

export type DailyClosing = Tables<"daily_closings">
export type DailyClosingExpense = Tables<"daily_closing_expenses">
export type Purchase = Tables<"purchases">
export type PurchaseLineItem = Tables<"purchase_line_items">
export type CashTransaction = Tables<"cash_transactions">

export type DailyClosingInsert = TablesInsert<"daily_closings">
export type DailyClosingExpenseInsert = TablesInsert<"daily_closing_expenses">
export type PurchaseInsert = TablesInsert<"purchases">
