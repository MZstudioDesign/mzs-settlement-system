/**
 * MZS Settlement System - Settlement Specific Types
 * Types that integrate with existing currency calculation logic
 */

import type { DesignerAllocation, SettlementCalculation, FeeCalculation } from './database'

// Extended settlement calculation with fees
export interface CompleteSettlementCalculation extends SettlementCalculation {
  fees: FeeCalculation
  totalFees: number
  companyShare: number
}

// Settlement calculation input
export interface SettlementInput {
  grossAmount: number
  discountNet?: number
  channelFeeRate?: number
  adRate?: number
  programRate?: number
}

// Designer settlement calculation
export interface DesignerSettlement {
  member_id: string
  member_name: string
  member_code: string
  percent: number
  bonus_pct: number
  calculation: SettlementCalculation
}

// Project settlement summary
export interface ProjectSettlementSummary {
  project_id: string
  project_name: string
  gross_amount: number
  net_amount: number
  discount_net: number
  base_amount: number
  total_designer_allocation: number
  fees: FeeCalculation
  total_fees: number
  company_profit: number
  designers: DesignerSettlement[]
  channel_name: string
  channel_fee_rate: number
}

// Monthly settlement summary
export interface MonthlySettlementSummary {
  month: string
  total_projects: number
  total_gross_amount: number
  total_net_amount: number
  total_designer_allocation: number
  total_company_profit: number
  total_fees: number
  members: {
    member_id: string
    member_name: string
    member_code: string
    total_before_withholding: number
    total_withholding_tax: number
    total_after_withholding: number
    total_paid: number
    total_unpaid: number
    project_earnings: number
    contact_earnings: number
    feed_earnings: number
    other_earnings: number
  }[]
}

// Settlement validation result
export interface SettlementValidation {
  valid: boolean
  errors: string[]
  warnings: string[]
  total_percentage: number
  total_bonus_pct: number
}

// FAB (Floating Action Button) quick entry data
export interface FABEntry {
  id?: string
  type: 'CONTACT' | 'FEED'
  member_id: string
  amount: number
  event_date: string
  contact_type?: 'INCOMING' | 'CHAT' | 'GUIDE'
  feed_type?: 'BELOW3' | 'GTE3'
  project_id?: string
  notes?: string
  synced: boolean
  created_at: string
}

// Offline cache structure for mobile FAB
export interface OfflineFABCache {
  entries: FABEntry[]
  last_sync: string
  pending_count: number
}

// Settlement export data
export interface SettlementExportData {
  settlement_id: string
  month: string
  export_date: string
  format: 'CSV' | 'PDF'
  data: {
    summary: MonthlySettlementSummary
    items: {
      member_name: string
      member_code: string
      source_type: string
      source_name: string
      gross_amount: number
      net_amount: number
      designer_amount: number
      bonus_amount: number
      before_withholding: number
      withholding_tax: number
      after_withholding: number
      is_paid: boolean
      payment_date?: string
    }[]
  }
}

// Dashboard KPI data
export interface DashboardKPIs {
  current_month: {
    total_revenue: number
    total_projects: number
    total_contacts: number
    total_feeds: number
    pending_payments: number
    paid_payments: number
  }
  previous_month: {
    total_revenue: number
    total_projects: number
    growth_rate: number
  }
  year_to_date: {
    total_revenue: number
    total_projects: number
    average_project_value: number
  }
  top_performers: {
    member_name: string
    member_code: string
    total_earnings: number
    project_count: number
  }[]
  recent_activities: {
    type: 'PROJECT' | 'CONTACT' | 'FEED' | 'SETTLEMENT'
    description: string
    amount?: number
    date: string
    member_name?: string
  }[]
}

// Member performance metrics
export interface MemberPerformance {
  member_id: string
  member_name: string
  member_code: string
  period: string // YYYY-MM
  metrics: {
    total_projects: number
    total_contacts: number
    total_feeds: number
    total_earnings: number
    average_project_value: number
    total_hours_logged?: number
    productivity_score?: number
  }
  rankings: {
    earnings_rank: number
    project_count_rank: number
    productivity_rank: number
  }
  trends: {
    earnings_trend: 'UP' | 'DOWN' | 'STABLE'
    project_trend: 'UP' | 'DOWN' | 'STABLE'
    productivity_trend: 'UP' | 'DOWN' | 'STABLE'
  }
}

// Project status tracking
export interface ProjectStatusUpdate {
  project_id: string
  old_status: string
  new_status: string
  updated_by: string
  updated_at: string
  notes?: string
}

// Payment tracking
export interface PaymentRecord {
  settlement_item_id: string
  member_id: string
  member_name: string
  amount: number
  payment_method: string
  payment_date: string
  transaction_id?: string
  notes?: string
  verified: boolean
  verified_by?: string
  verified_at?: string
}

// Validation rules for business logic
export interface ValidationRules {
  designer_percentages: {
    must_sum_to_100: boolean
    min_percent: number
    max_percent: number
  }
  bonus_percentage: {
    min: number
    max: number
  }
  amounts: {
    min_gross_amount: number
    max_gross_amount: number
    currency: string
  }
  dates: {
    min_project_date: string
    max_future_days: number
  }
  files: {
    max_files_per_project: number
    max_file_size_mb: number
    allowed_extensions: string[]
    allowed_mime_types: string[]
  }
}

// Settlement calculation context
export interface SettlementCalculationContext {
  vat_rate: number
  designer_distribution_rate: number
  withholding_tax_rate: number
  ad_fee_rate: number
  program_fee_rate: number
  contact_amounts: Record<string, number>
  feed_amounts: Record<string, number>
  bonus_range: { min: number; max: number }
}

// Utility types for form validation
export type DesignerAllocationForm = {
  member_id: string
  member_name: string
  percent: string // String for form input
  bonus_pct: string // String for form input
}

export type ProjectFormData = {
  name: string
  channel_id: string
  category_id: string
  gross_amount: string // String for form input
  discount_net: string // String for form input
  designers: DesignerAllocationForm[]
  project_date: string
  payment_date: string
  notes: string
}

// API error types
export interface APIError {
  code: string
  message: string
  field?: string
  details?: Record<string, any>
}

export interface APIValidationError extends APIError {
  field: string
  value: any
  constraint: string
}

// Supabase integration types
export interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

// Real-time subscription types
export interface RealtimePayload<T> {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: T
  old?: T
  errors?: string[]
}

// Export/Import types
export interface CSVImportResult {
  success_count: number
  error_count: number
  errors: {
    row: number
    field: string
    message: string
    data: Record<string, any>
  }[]
  warnings: {
    row: number
    message: string
    data: Record<string, any>
  }[]
}

export interface CSVExportOptions {
  format: 'CSV' | 'XLSX'
  include_formulas: boolean
  date_range?: {
    start: string
    end: string
  }
  members?: string[]
  columns?: string[]
}

// Notification types
export interface NotificationMessage {
  id: string
  type: 'SUCCESS' | 'ERROR' | 'WARNING' | 'INFO'
  title: string
  message: string
  duration?: number
  actions?: {
    label: string
    action: () => void
  }[]
}

// Theme and UI types
export interface ThemeColors {
  primary: string
  secondary: string
  accent: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
  info: string
}

// Mobile-specific types
export interface MobileUIState {
  fab_open: boolean
  drawer_open: boolean
  selected_tab: string
  offline_mode: boolean
  sync_status: 'SYNCED' | 'SYNCING' | 'ERROR' | 'OFFLINE'
  pending_entries: number
}

// Performance monitoring
export interface PerformanceMetrics {
  page_load_time: number
  api_response_time: number
  database_query_time: number
  render_time: number
  memory_usage: number
  cache_hit_rate: number
}

// Feature flags
export interface FeatureFlags {
  mobile_fab_enabled: boolean
  realtime_updates_enabled: boolean
  advanced_analytics_enabled: boolean
  export_pdf_enabled: boolean
  audit_logging_enabled: boolean
  offline_sync_enabled: boolean
}

// User preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: 'ko' | 'en'
  currency_display: 'symbol' | 'code' | 'name'
  date_format: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY'
  number_format: 'comma' | 'space' | 'none'
  default_page_size: number
  notifications_enabled: boolean
  auto_save_enabled: boolean
}