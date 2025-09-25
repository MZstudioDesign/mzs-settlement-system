/**
 * Server-side Supabase client configuration for MZS Settlement System
 * Uses SERVICE_ROLE_KEY for full database access, bypassing RLS
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for server-side client')
}

// Create server-side client with service role key
export const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Server-side table accessors with full privileges
export const serverTables = {
  members: () => supabaseServer.from('members'),
  channels: () => supabaseServer.from('channels'),
  categories: () => supabaseServer.from('categories'),
  projects: () => supabaseServer.from('projects'),
  projectFiles: () => supabaseServer.from('project_files'),
  contacts: () => supabaseServer.from('contacts'),
  feedLogs: () => supabaseServer.from('feed_logs'),
  settlements: () => supabaseServer.from('settlements'),
  settlementItems: () => supabaseServer.from('settlement_items'),
  appSettings: () => supabaseServer.from('app_settings'),
  teamTasks: () => supabaseServer.from('team_tasks'),
  mileage: () => supabaseServer.from('mileage'),
  fundsCompany: () => supabaseServer.from('funds_company'),
  fundsPersonal: () => supabaseServer.from('funds_personal'),
} as const

// Server-side view accessors
export const serverViews = {
  monthlyMemberSummary: () => supabaseServer.from('monthly_member_summary'),
  projectProfitability: () => supabaseServer.from('project_profitability'),
} as const

// Server-side function helpers
export const serverFunctions = {
  calculateSettlementAmount: (params: {
    gross_amount_param: number
    discount_net_param?: number
    designer_percent_param?: number
    bonus_pct_param?: number
  }) => supabaseServer.rpc('calculate_settlement_amount', params),

  validateDesignerPercentages: (designers: Array<{member_id: string, percent: number}>) =>
    supabaseServer.rpc('validate_designer_percentages', { designers_json: designers }),

  validateBonusPercentage: (bonus_pct: number) =>
    supabaseServer.rpc('validate_bonus_percentage', { bonus_pct }),
} as const

// Helper function for error handling
export function handleSupabaseError(error: any, context: string) {
  console.error(`Supabase error in ${context}:`, error)
  return {
    error: true,
    message: error.message || 'Database error occurred',
    code: error.code || 'UNKNOWN_ERROR'
  }
}

// Helper function for successful responses
export function handleSupabaseSuccess<T>(data: T, context: string) {
  console.log(`Supabase success in ${context}:`, Array.isArray(data) ? `${data.length} records` : 'single record')
  return {
    error: false,
    data,
    message: 'Operation successful'
  }
}

export type ServerSupabaseClient = typeof supabaseServer