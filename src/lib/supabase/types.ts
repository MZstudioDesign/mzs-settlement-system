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
      members: {
        Row: {
          id: string
          name: string
          code: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          active?: boolean
          created_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          ad_rate: number
          program_rate: number
          market_fee_rate: number
          fee_base: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          ad_rate?: number
          program_rate?: number
          market_fee_rate?: number
          fee_base?: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          ad_rate?: number
          program_rate?: number
          market_fee_rate?: number
          fee_base?: string
          active?: boolean
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          client_name: string
          channel_id: string
          category_id: string | null
          title: string | null
          qty: number
          list_price_net: number
          discount_net: number
          deposit_gross_T: number
          net_B: number
          settle_date: string
          work_date: string
          invoice_requested: boolean
          designers: Json
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_name: string
          channel_id: string
          category_id?: string | null
          title?: string | null
          qty?: number
          list_price_net?: number
          discount_net?: number
          deposit_gross_T: number
          net_B: number
          settle_date: string
          work_date: string
          invoice_requested?: boolean
          designers: Json
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_name?: string
          channel_id?: string
          category_id?: string | null
          title?: string | null
          qty?: number
          list_price_net?: number
          discount_net?: number
          deposit_gross_T?: number
          net_B?: number
          settle_date?: string
          work_date?: string
          invoice_requested?: boolean
          designers?: Json
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      settlement_items: {
        Row: {
          id: string
          settlement_id: string
          member_id: string
          source_type: string
          source_id: string | null
          snapshot_json: Json
          amount_before_withholding: number
          withholding_3_3: number
          amount_after_withholding: number
          paid: boolean
          paid_date: string | null
          memo: string | null
          created_at: string
        }
        Insert: {
          id?: string
          settlement_id: string
          member_id: string
          source_type: string
          source_id?: string | null
          snapshot_json: Json
          amount_before_withholding?: number
          withholding_3_3?: number
          amount_after_withholding?: number
          paid?: boolean
          paid_date?: string | null
          memo?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          settlement_id?: string
          member_id?: string
          source_type?: string
          source_id?: string | null
          snapshot_json?: Json
          amount_before_withholding?: number
          withholding_3_3?: number
          amount_after_withholding?: number
          paid?: boolean
          paid_date?: string | null
          memo?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_settlement_amount: {
        Args: {
          p_deposit_gross_t: number
          p_discount_net: number
          p_designer_percent: number
          p_bonus_pct?: number
          p_ad_rate?: number
          p_program_rate?: number
          p_channel_fee_rate?: number
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types for the settlement system
export type Member = Database['public']['Tables']['members']['Row']
export type Channel = Database['public']['Tables']['channels']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type SettlementItem = Database['public']['Tables']['settlement_items']['Row']

export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

// Designer type for the projects.designers JSONB field
export interface Designer {
  member_id: string
  percent: number
  bonus_pct: number
  note?: string
}

// Settlement calculation result
export interface SettlementCalculation {
  gross_T: number
  net_B: number
  discount_net: number
  designer_base: number
  designer_amount: number
  bonus_amount: number
  amount_before_withholding: number
  withholding_3_3: number
  amount_after_withholding: number
  ad_fee: number
  program_fee: number
  channel_fee: number
}