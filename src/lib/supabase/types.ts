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
          email: string | null
          phone: string | null
          join_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          active?: boolean
          email?: string | null
          phone?: string | null
          join_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          active?: boolean
          email?: string | null
          phone?: string | null
          join_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      channels: {
        Row: {
          id: string
          name: string
          fee_rate: number
          active: boolean
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          fee_rate?: number
          active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          fee_rate?: number
          active?: boolean
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          channel_id: string
          category_id: string | null
          gross_amount: number
          discount_net: number
          designers: Json
          status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'
          project_date: string
          payment_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          channel_id: string
          category_id?: string | null
          gross_amount: number
          discount_net?: number
          designers: Json
          status?: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'
          project_date?: string
          payment_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          channel_id?: string
          category_id?: string | null
          gross_amount?: number
          discount_net?: number
          designers?: Json
          status?: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'
          project_date?: string
          payment_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      project_files: {
        Row: {
          id: string
          project_id: string
          file_name: string
          file_url: string
          file_size: number | null
          file_type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          member_id: string
          project_id: string | null
          contact_type: 'INCOMING' | 'CHAT' | 'GUIDE'
          amount: number
          event_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          project_id?: string | null
          contact_type: 'INCOMING' | 'CHAT' | 'GUIDE'
          amount?: number
          event_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          project_id?: string | null
          contact_type?: 'INCOMING' | 'CHAT' | 'GUIDE'
          amount?: number
          event_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      feed_logs: {
        Row: {
          id: string
          member_id: string
          feed_type: 'BELOW3' | 'GTE3'
          amount: number
          event_date: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          feed_type: 'BELOW3' | 'GTE3'
          amount?: number
          event_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          feed_type?: 'BELOW3' | 'GTE3'
          amount?: number
          event_date?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      team_tasks: {
        Row: {
          id: string
          member_id: string
          project_id: string | null
          task_date: string
          description: string
          amount: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          project_id?: string | null
          task_date?: string
          description: string
          amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          project_id?: string | null
          task_date?: string
          description?: string
          amount?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mileage: {
        Row: {
          id: string
          member_id: string
          event_date: string
          reason: string
          points: number
          amount: number
          consumed_now: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          event_date?: string
          reason: string
          points?: number
          amount?: number
          consumed_now?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          event_date?: string
          reason?: string
          points?: number
          amount?: number
          consumed_now?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      funds_company: {
        Row: {
          id: string
          expense_date: string
          item_name: string
          amount: number
          description: string | null
          receipt_files: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          expense_date?: string
          item_name: string
          amount?: number
          description?: string | null
          receipt_files?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          expense_date?: string
          item_name?: string
          amount?: number
          description?: string | null
          receipt_files?: Json
          created_at?: string
          updated_at?: string
        }
      }
      funds_personal: {
        Row: {
          id: string
          member_id: string
          expense_date: string
          item_name: string
          amount: number
          description: string | null
          receipt_files: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          expense_date?: string
          item_name: string
          amount?: number
          description?: string | null
          receipt_files?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          expense_date?: string
          item_name?: string
          amount?: number
          description?: string | null
          receipt_files?: Json
          created_at?: string
          updated_at?: string
        }
      }
      settlements: {
        Row: {
          id: string
          month: string
          status: 'DRAFT' | 'LOCKED'
          locked_at: string | null
          locked_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          month: string
          status?: 'DRAFT' | 'LOCKED'
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          month?: string
          status?: 'DRAFT' | 'LOCKED'
          locked_at?: string | null
          locked_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      settlement_items: {
        Row: {
          id: string
          settlement_id: string
          member_id: string
          source_type: 'PROJECT' | 'CONTACT' | 'FEED' | 'TEAM_TASK' | 'MILEAGE'
          source_id: string
          gross_amount: number
          net_amount: number
          base_amount: number
          designer_amount: number
          bonus_amount: number
          before_withholding: number
          withholding_tax: number
          after_withholding: number
          is_paid: boolean
          paid_at: string | null
          payment_method: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          settlement_id: string
          member_id: string
          source_type: 'PROJECT' | 'CONTACT' | 'FEED' | 'TEAM_TASK' | 'MILEAGE'
          source_id: string
          gross_amount?: number
          net_amount?: number
          base_amount?: number
          designer_amount?: number
          bonus_amount?: number
          before_withholding?: number
          withholding_tax?: number
          after_withholding?: number
          is_paid?: boolean
          paid_at?: string | null
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          settlement_id?: string
          member_id?: string
          source_type?: 'PROJECT' | 'CONTACT' | 'FEED' | 'TEAM_TASK' | 'MILEAGE'
          source_id?: string
          gross_amount?: number
          net_amount?: number
          base_amount?: number
          designer_amount?: number
          bonus_amount?: number
          before_withholding?: number
          withholding_tax?: number
          after_withholding?: number
          is_paid?: boolean
          paid_at?: string | null
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      app_settings: {
        Row: {
          id: string
          key: string
          value: Json
          description: string | null
          is_system: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          key: string
          value: Json
          description?: string | null
          is_system?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          key?: string
          value?: Json
          description?: string | null
          is_system?: boolean
          updated_at?: string
          updated_by?: string | null
        }
      }
      audit_logs: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: string
          old_values: Json | null
          new_values: Json | null
          changed_by: string | null
          changed_at: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: string
          old_values?: Json | null
          new_values?: Json | null
          changed_by?: string | null
          changed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: string
          old_values?: Json | null
          new_values?: Json | null
          changed_by?: string | null
          changed_at?: string
          ip_address?: string | null
          user_agent?: string | null
        }
      }
    }
    Views: {
      monthly_member_summary: {
        Row: {
          member_id: string
          member_name: string
          member_code: string
          month: string
          project_count: number
          contact_count: number
          feed_count: number
          total_before_withholding: number
          total_withholding_tax: number
          total_after_withholding: number
          total_paid: number
          total_unpaid: number
        }
      }
      project_profitability: {
        Row: {
          id: string
          name: string
          gross_amount: number
          net_amount: number
          channel_name: string
          channel_fee_rate: number
          category_name: string | null
          ad_fee: number
          program_fee: number
          channel_fee: number
          total_fees: number
          company_profit_before_designers: number
          total_designer_allocation: number
          project_date: string
          status: string
        }
      }
      member_stats: {
        Row: {
          id: string
          name: string
          code: string
          project_count: number
          contact_count: number
          feed_count: number
          total_earnings: number
          paid_earnings: number
          unpaid_earnings: number
        }
      }
      member_comprehensive_stats: {
        Row: {
          id: string
          name: string
          code: string
          project_count: number
          project_earnings: number
          contact_count: number
          contact_earnings: number
          feed_count: number
          feed_earnings: number
          team_task_count: number
          team_task_earnings: number
          mileage_count: number
          total_mileage_points: number
          mileage_earnings: number
          personal_funds_received: number
          total_earnings: number
          paid_earnings: number
          unpaid_earnings: number
        }
      }
      company_financial_overview: {
        Row: {
          month: string
          transaction_type: string
          item_name: string
          amount: number
          description: string | null
          transaction_date: string
        }
      }
    }
    Functions: {
      calculate_settlement_amount: {
        Args: {
          gross_amount_param: number
          discount_net_param?: number
          designer_percent_param?: number
          bonus_pct_param?: number
        }
        Returns: {
          gross_t: number
          net_b: number
          discount_net: number
          base_amount: number
          designer_amount: number
          bonus_amount: number
          before_withholding: number
          withholding_tax: number
          after_withholding: number
        }[]
      }
      get_member_id_by_code: {
        Args: { member_code: string }
        Returns: string
      }
      get_channel_id_by_name: {
        Args: { channel_name: string }
        Returns: string
      }
      get_category_id_by_name: {
        Args: { category_name: string }
        Returns: string
      }
      validate_designer_percentages: {
        Args: { designers_json: Json }
        Returns: boolean
      }
      validate_bonus_percentage: {
        Args: { bonus_pct: number }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      project_status: 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'
      contact_type: 'INCOMING' | 'CHAT' | 'GUIDE'
      feed_type: 'BELOW3' | 'GTE3'
      settlement_status: 'DRAFT' | 'LOCKED'
      settlement_source_type: 'PROJECT' | 'CONTACT' | 'FEED' | 'TEAM_TASK' | 'MILEAGE'
    }
  }
}

// Helper types for the settlement system
export type Member = Database['public']['Tables']['members']['Row']
export type Channel = Database['public']['Tables']['channels']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectFile = Database['public']['Tables']['project_files']['Row']
export type Contact = Database['public']['Tables']['contacts']['Row']
export type FeedLog = Database['public']['Tables']['feed_logs']['Row']
export type TeamTask = Database['public']['Tables']['team_tasks']['Row']
export type Mileage = Database['public']['Tables']['mileage']['Row']
export type FundsCompany = Database['public']['Tables']['funds_company']['Row']
export type FundsPersonal = Database['public']['Tables']['funds_personal']['Row']
export type Settlement = Database['public']['Tables']['settlements']['Row']
export type SettlementItem = Database['public']['Tables']['settlement_items']['Row']
export type AppSettings = Database['public']['Tables']['app_settings']['Row']
export type AuditLog = Database['public']['Tables']['audit_logs']['Row']

// Insert types
export type MemberInsert = Database['public']['Tables']['members']['Insert']
export type ChannelInsert = Database['public']['Tables']['channels']['Insert']
export type CategoryInsert = Database['public']['Tables']['categories']['Insert']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectFileInsert = Database['public']['Tables']['project_files']['Insert']
export type ContactInsert = Database['public']['Tables']['contacts']['Insert']
export type FeedLogInsert = Database['public']['Tables']['feed_logs']['Insert']
export type TeamTaskInsert = Database['public']['Tables']['team_tasks']['Insert']
export type MileageInsert = Database['public']['Tables']['mileage']['Insert']
export type FundsCompanyInsert = Database['public']['Tables']['funds_company']['Insert']
export type FundsPersonalInsert = Database['public']['Tables']['funds_personal']['Insert']
export type SettlementInsert = Database['public']['Tables']['settlements']['Insert']
export type SettlementItemInsert = Database['public']['Tables']['settlement_items']['Insert']
export type AppSettingsInsert = Database['public']['Tables']['app_settings']['Insert']

// Update types
export type MemberUpdate = Database['public']['Tables']['members']['Update']
export type ChannelUpdate = Database['public']['Tables']['channels']['Update']
export type CategoryUpdate = Database['public']['Tables']['categories']['Update']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']
export type ProjectFileUpdate = Database['public']['Tables']['project_files']['Update']
export type ContactUpdate = Database['public']['Tables']['contacts']['Update']
export type FeedLogUpdate = Database['public']['Tables']['feed_logs']['Update']
export type TeamTaskUpdate = Database['public']['Tables']['team_tasks']['Update']
export type MileageUpdate = Database['public']['Tables']['mileage']['Update']
export type FundsCompanyUpdate = Database['public']['Tables']['funds_company']['Update']
export type FundsPersonalUpdate = Database['public']['Tables']['funds_personal']['Update']
export type SettlementUpdate = Database['public']['Tables']['settlements']['Update']
export type SettlementItemUpdate = Database['public']['Tables']['settlement_items']['Update']
export type AppSettingsUpdate = Database['public']['Tables']['app_settings']['Update']

// View types
export type MonthlyMemberSummary = Database['public']['Views']['monthly_member_summary']['Row']
export type ProjectProfitability = Database['public']['Views']['project_profitability']['Row']
export type MemberStats = Database['public']['Views']['member_stats']['Row']
export type MemberComprehensiveStats = Database['public']['Views']['member_comprehensive_stats']['Row']
export type CompanyFinancialOverview = Database['public']['Views']['company_financial_overview']['Row']

// Enum types
export type ProjectStatus = Database['public']['Enums']['project_status']
export type ContactType = Database['public']['Enums']['contact_type']
export type FeedType = Database['public']['Enums']['feed_type']
export type SettlementStatus = Database['public']['Enums']['settlement_status']
export type SettlementSourceType = Database['public']['Enums']['settlement_source_type']

// Designer type for the projects.designers JSONB field
export interface Designer {
  member_id: string
  percent: number
  bonus_pct: number
  note?: string
}

// Settlement calculation result
export interface SettlementCalculation {
  gross_t: number
  net_b: number
  discount_net: number
  base_amount: number
  designer_amount: number
  bonus_amount: number
  before_withholding: number
  withholding_tax: number
  after_withholding: number
}

// App settings value types
export interface ContactAmounts {
  INCOMING: number
  CHAT: number
  GUIDE: number
}

export interface FeedAmounts {
  BELOW3: number
  GTE3: number
}

export interface BonusRange {
  min: number
  max: number
  description: string
}

export interface CurrencySettings {
  currency: string
  locale: string
  decimal_places: number
}

export interface CompanyInfo {
  name: string
  business_number: string
  address: string
  phone: string
  email: string
}

export interface SettlementSettings {
  auto_create_monthly: boolean
  lock_after_payment: boolean
  require_approval: boolean
}

export interface FileUploadLimits {
  max_files_per_project: number
  max_file_size_mb: number
  allowed_types: string[]
}

// Receipt file type for funds tables
export interface ReceiptFile {
  url: string
  name: string
  size: number
  type: string
  uploaded_at: string
}