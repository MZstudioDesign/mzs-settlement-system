/**
 * MZS Settlement System - Database Types
 * Auto-generated TypeScript types for Supabase database schema
 * Compatible with existing currency calculation logic
 */

// Enums
export type ProjectStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED'
export type ContactType = 'INCOMING' | 'CHAT' | 'GUIDE'
export type FeedType = 'BELOW3' | 'GTE3'
export type SettlementStatus = 'DRAFT' | 'LOCKED'
export type SettlementSourceType = 'PROJECT' | 'CONTACT' | 'FEED' | 'TEAM_TASK' | 'MILEAGE'

// Core Database Tables
export interface Member {
  id: string
  name: string
  code: string
  active: boolean
  email?: string
  phone?: string
  join_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Channel {
  id: string
  name: string
  fee_rate: number // Decimal 0.0000 - 1.0000 (e.g., 0.21 for 21%)
  active: boolean
  description?: string
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description?: string
  active: boolean
  created_at: string
  updated_at: string
}

// Designer allocation structure for projects
export interface DesignerAllocation {
  member_id: string
  percent: number // 0-100 (must sum to 100 across all designers)
  bonus_pct: number // 0-20 (bonus percentage)
}

export interface Project {
  id: string
  name: string
  channel_id: string
  category_id?: string
  gross_amount: number // Total deposit including VAT (T in formula) - stored as bigint
  discount_net: number // Discount amount excluding VAT - stored as bigint
  designers: DesignerAllocation[] // JSON array of designer allocations
  status: ProjectStatus
  project_date: string
  payment_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id: string
  project_id: string
  file_name: string
  file_url: string
  file_size?: number
  file_type?: string
  uploaded_by?: string
  created_at: string
}

export interface Contact {
  id: string
  member_id: string
  project_id?: string
  contact_type: ContactType
  amount: number // Fixed amounts: INCOMING=1000, CHAT=1000, GUIDE=2000
  event_date: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface FeedLog {
  id: string
  member_id: string
  feed_type: FeedType
  amount: number // Fixed amounts: BELOW3=400, GTE3=1000
  event_date: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Settlement {
  id: string
  month: string // YYYY-MM-01 format
  status: SettlementStatus
  locked_at?: string
  locked_by?: string
  notes?: string
  created_at: string
  updated_at: string
}

// Settlement calculation structure - compatible with currency.ts
export interface SettlementItem {
  id: string
  settlement_id: string
  member_id: string
  source_type: SettlementSourceType
  source_id: string

  // Settlement calculation fields (all in KRW, integer)
  gross_amount: number // T (with VAT)
  net_amount: number // B (without VAT) = round(T / 1.1)
  base_amount: number // B + discount_net
  designer_amount: number // base * 0.40 * percent
  bonus_amount: number // designer_amount * bonus_pct
  before_withholding: number // designer + bonus
  withholding_tax: number // before_withholding * 0.033
  after_withholding: number // before_withholding - withholding_tax

  // Payment tracking
  is_paid: boolean
  paid_at?: string
  payment_method?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface AppSetting {
  id: string
  key: string
  value: Record<string, any> // JSONB field
  description?: string
  is_system: boolean
  updated_at: string
  updated_by?: string
}

export interface AuditLog {
  id: string
  table_name: string
  record_id: string
  action: 'INSERT' | 'UPDATE' | 'DELETE'
  old_values?: Record<string, any>
  new_values?: Record<string, any>
  changed_by?: string
  changed_at: string
  ip_address?: string
  user_agent?: string
}

// Views
export interface MonthlyMemberSummary {
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

export interface ProjectProfitability {
  id: string
  name: string
  gross_amount: number
  net_amount: number
  channel_name: string
  channel_fee_rate: number
  category_name?: string
  ad_fee: number // 10% of net
  program_fee: number // 3% of net
  channel_fee: number // channel_fee_rate * net
  total_fees: number
  company_profit_before_designers: number
  total_designer_allocation: number
  project_date: string
  status: ProjectStatus
}

export interface MemberStats {
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

// Settlement calculation result - compatible with currency.ts calculateSettlement
export interface SettlementCalculation {
  grossT: number
  netB: number
  discountNet: number
  base: number
  designerAmount: number
  bonusAmount: number
  beforeWithholding: number
  withholdingTax: number
  afterWithholding: number
}

// Fee calculation result - compatible with currency.ts calculateFees
export interface FeeCalculation {
  adFee: number
  programFee: number
  channelFee: number
}

// Database relation types with joins
export interface ProjectWithRelations extends Project {
  channel: Channel
  category?: Category
  project_files: ProjectFile[]
}

export interface SettlementWithItems extends Settlement {
  settlement_items: (SettlementItem & {
    member: Member
  })[]
}

export interface ContactWithRelations extends Contact {
  member: Member
  project?: Project
}

export interface FeedLogWithMember extends FeedLog {
  member: Member
}

// Form types for CRUD operations
export interface CreateMemberForm {
  name: string
  code: string
  email?: string
  phone?: string
  join_date?: string
  notes?: string
}

export interface UpdateMemberForm extends Partial<CreateMemberForm> {
  active?: boolean
}

export interface CreateChannelForm {
  name: string
  fee_rate: number
  description?: string
}

export interface UpdateChannelForm extends Partial<CreateChannelForm> {
  active?: boolean
}

export interface CreateCategoryForm {
  name: string
  description?: string
}

export interface UpdateCategoryForm extends Partial<CreateCategoryForm> {
  active?: boolean
}

export interface CreateProjectForm {
  name: string
  channel_id: string
  category_id?: string
  gross_amount: number
  discount_net?: number
  designers: DesignerAllocation[]
  project_date?: string
  payment_date?: string
  notes?: string
}

export interface UpdateProjectForm extends Partial<CreateProjectForm> {
  status?: ProjectStatus
}

export interface CreateContactForm {
  member_id: string
  project_id?: string
  contact_type: ContactType
  event_date?: string
  notes?: string
}

export interface CreateFeedLogForm {
  member_id: string
  feed_type: FeedType
  event_date?: string
  notes?: string
}

export interface CreateSettlementForm {
  month: string // YYYY-MM-01
  notes?: string
}

export interface UpdateSettlementItemForm {
  is_paid?: boolean
  payment_method?: string
  notes?: string
}

// API response types
export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Settings value types
export interface VATRateSetting {
  rate: number
  description: string
}

export interface DesignerDistributionRateSetting {
  rate: number
  description: string
}

export interface WithholdingTaxRateSetting {
  rate: number
  description: string
}

export interface ContactAmountsSetting {
  INCOMING: number
  CHAT: number
  GUIDE: number
}

export interface FeedAmountsSetting {
  BELOW3: number
  GTE3: number
}

export interface BonusRangeSetting {
  min: number
  max: number
  description: string
}

export interface FileUploadLimitsSetting {
  max_files_per_project: number
  max_file_size_mb: number
  allowed_types: string[]
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

// Validation types
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

// Constants for business rules
export const BUSINESS_RULES = {
  VAT_RATE: 0.10, // 10%
  DESIGNER_DISTRIBUTION_RATE: 0.40, // 40%
  WITHHOLDING_TAX_RATE: 0.033, // 3.3%
  AD_FEE_RATE: 0.10, // 10%
  PROGRAM_FEE_RATE: 0.03, // 3%
  BONUS_MIN: 0, // 0%
  BONUS_MAX: 20, // 20%
  CONTACT_AMOUNTS: {
    INCOMING: 1000,
    CHAT: 1000,
    GUIDE: 2000,
  },
  FEED_AMOUNTS: {
    BELOW3: 400,
    GTE3: 1000,
  },
  FILE_LIMITS: {
    MAX_FILES_PER_PROJECT: 5,
    MAX_FILE_SIZE_MB: 10,
  },
} as const

// Export main database type
export interface Database {
  public: {
    Tables: {
      members: {
        Row: Member
        Insert: Omit<Member, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Member, 'id' | 'created_at' | 'updated_at'>>
      }
      channels: {
        Row: Channel
        Insert: Omit<Channel, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Channel, 'id' | 'created_at' | 'updated_at'>>
      }
      categories: {
        Row: Category
        Insert: Omit<Category, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      project_files: {
        Row: ProjectFile
        Insert: Omit<ProjectFile, 'id' | 'created_at'>
        Update: Partial<Omit<ProjectFile, 'id' | 'created_at'>>
      }
      contacts: {
        Row: Contact
        Insert: Omit<Contact, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at'>>
      }
      feed_logs: {
        Row: FeedLog
        Insert: Omit<FeedLog, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FeedLog, 'id' | 'created_at' | 'updated_at'>>
      }
      settlements: {
        Row: Settlement
        Insert: Omit<Settlement, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Settlement, 'id' | 'created_at' | 'updated_at'>>
      }
      settlement_items: {
        Row: SettlementItem
        Insert: Omit<SettlementItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<SettlementItem, 'id' | 'created_at' | 'updated_at'>>
      }
      app_settings: {
        Row: AppSetting
        Insert: Omit<AppSetting, 'id' | 'updated_at'>
        Update: Partial<Omit<AppSetting, 'id' | 'updated_at'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'changed_at'>
        Update: never // Audit logs are immutable
      }
    }
    Views: {
      monthly_member_summary: {
        Row: MonthlyMemberSummary
      }
      project_profitability: {
        Row: ProjectProfitability
      }
      member_stats: {
        Row: MemberStats
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
        Returns: SettlementCalculation[]
      }
      validate_designer_percentages: {
        Args: { designers_json: DesignerAllocation[] }
        Returns: boolean
      }
      validate_bonus_percentage: {
        Args: { bonus_pct: number }
        Returns: boolean
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
    }
    Enums: {
      project_status: ProjectStatus
      contact_type: ContactType
      feed_type: FeedType
      settlement_status: SettlementStatus
      settlement_source_type: SettlementSourceType
    }
  }
}