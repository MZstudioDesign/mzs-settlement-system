/**
 * Supabase client configuration for MZS Settlement System
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create a dummy client if environment variables are not set
let supabase: any

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_project_url') {
  console.warn('Supabase environment variables not configured. Using mock data.')
  // Create a dummy client to prevent errors
  supabase = {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ error: null }),
    }),
    rpc: () => Promise.resolve({ data: null, error: null })
  }
} else {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // 인증 없이 사용
    },
  })
}

export { supabase }

// createClient를 다시 export하여 다른 파일에서 사용할 수 있도록 함
export { createClient } from '@supabase/supabase-js'

// 타입 안전한 테이블 접근자
export const tables = {
  members: () => supabase.from('members'),
  channels: () => supabase.from('channels'),
  categories: () => supabase.from('categories'),
  projects: () => supabase.from('projects'),
  projectFiles: () => supabase.from('project_files'),
  contacts: () => supabase.from('contacts'),
  feedLogs: () => supabase.from('feed_logs'),
  settlements: () => supabase.from('settlements'),
  settlementItems: () => supabase.from('settlement_items'),
  appSettings: () => supabase.from('app_settings'),
  auditLogs: () => supabase.from('audit_logs'),
} as const

// 뷰 접근자
export const views = {
  monthlyMemberSummary: () => supabase.from('monthly_member_summary'),
  projectProfitability: () => supabase.from('project_profitability'),
  memberStats: () => supabase.from('member_stats'),
} as const

// 함수 호출 헬퍼
export const functions = {
  calculateSettlementAmount: (params: {
    gross_amount_param: number
    discount_net_param?: number
    designer_percent_param?: number
    bonus_pct_param?: number
  }) => supabase.rpc('calculate_settlement_amount', params),

  validateDesignerPercentages: (designers: Array<{member_id: string, percent: number}>) =>
    supabase.rpc('validate_designer_percentages', { designers_json: designers }),

  validateBonusPercentage: (bonus_pct: number) =>
    supabase.rpc('validate_bonus_percentage', { bonus_pct }),

  getMemberIdByCode: (member_code: string) =>
    supabase.rpc('get_member_id_by_code', { member_code }),

  getChannelIdByName: (channel_name: string) =>
    supabase.rpc('get_channel_id_by_name', { channel_name }),

  getCategoryIdByName: (category_name: string) =>
    supabase.rpc('get_category_id_by_name', { category_name }),
} as const

export type SupabaseClient = typeof supabase