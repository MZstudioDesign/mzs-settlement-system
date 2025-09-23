/**
 * Settlement API functions
 * 정산 관련 CRUD 및 계산 로직
 */

import { tables, functions } from '../supabase'
import { mockApi } from '../mock-data'
import type {
  Settlement,
  SettlementWithItems,
  CreateSettlementForm,
  UpdateSettlementForm,
  SettlementItem,
  ApiResponse,
  PaginatedResponse,
} from '@/types/database'

// Check if Supabase is configured
const isSupabaseConfigured = () => {
  return process.env.NEXT_PUBLIC_SUPABASE_URL &&
         process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
         process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url'
}

// Error handling utility
function handleSupabaseError<T>(error: any): ApiResponse<T> {
  console.error('Supabase error:', error)
  return {
    error: error.message || 'Database operation failed',
  }
}

// Success response utility
function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    data,
    message,
  }
}

// Paginated response utility
function paginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

export const settlementsApi = {
  /**
   * Get all settlements with optional filtering and pagination
   */
  async getSettlements(params?: {
    page?: number
    limit?: number
    year?: number
    month?: number
    member_id?: string
    sort_by?: string
    sort_order?: 'asc' | 'desc'
  }): Promise<PaginatedResponse<SettlementWithItems>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.getSettlements(params)
    }

    const {
      page = 1,
      limit = 10,
      year,
      month,
      member_id,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = params || {}

    try {
      let query = tables
        .settlements()
        .select(`
          *,
          settlement_items(
            *,
            member:members(*)
          )
        `)

      // Apply filters
      if (year) {
        query = query.eq('year', year)
      }
      if (month) {
        query = query.eq('month', month)
      }
      if (member_id) {
        // Filter by settlement items that belong to the member
        query = query.eq('settlement_items.member_id', member_id)
      }

      // Get total count for pagination
      const { count } = await query.select('*', { count: 'exact', head: true })
      const total = count || 0

      // Apply sorting and pagination
      const { data, error } = await query
        .order(sort_by, { ascending: sort_order === 'asc' })
        .range((page - 1) * limit, page * limit - 1)

      if (error) return handleSupabaseError(error)

      return paginatedResponse(data as SettlementWithItems[], page, limit, total)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Get single settlement by ID with items
   */
  async getSettlement(id: string): Promise<ApiResponse<SettlementWithItems>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.getSettlement(id)
    }

    try {
      const { data, error } = await tables
        .settlements()
        .select(`
          *,
          settlement_items(
            *,
            member:members(*)
          )
        `)
        .eq('id', id)
        .single()

      if (error) return handleSupabaseError(error)

      return successResponse(data as SettlementWithItems)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Create new settlement with automated calculation
   */
  async createSettlement(settlementData: CreateSettlementForm): Promise<ApiResponse<SettlementWithItems>> {
    // Use mock data if Supabase is not configured
    if (!isSupabaseConfigured()) {
      return mockApi.createSettlement(settlementData)
    }

    try {
      // Check if settlement already exists for this period
      const { data: existing } = await tables
        .settlements()
        .select('id')
        .eq('year', settlementData.year)
        .eq('month', settlementData.month)
        .single()

      if (existing) {
        return {
          error: `Settlement for ${settlementData.year}-${settlementData.month} already exists`,
        }
      }

      // Create settlement record
      const { data: settlement, error: settlementError } = await tables
        .settlements()
        .insert({
          year: settlementData.year,
          month: settlementData.month,
          notes: settlementData.notes,
          status: 'DRAFT',
        })
        .select()
        .single()

      if (settlementError) return handleSupabaseError(settlementError)

      // Calculate settlement items for all projects in the period
      const startDate = `${settlementData.year}-${settlementData.month.toString().padStart(2, '0')}-01`
      const endDate = `${settlementData.year}-${settlementData.month.toString().padStart(2, '0')}-31`

      // Get projects that need settlement for this period
      const { data: projects, error: projectsError } = await tables
        .projects()
        .select(`
          *,
          channel:channels(*)
        `)
        .gte('payment_date', startDate)
        .lte('payment_date', endDate)
        .eq('status', 'APPROVED')

      if (projectsError) return handleSupabaseError(projectsError)

      const settlementItems = []

      // Calculate settlement for each project
      for (const project of projects || []) {
        // Calculate settlement amount using stored function
        const { data: calculationResult } = await functions.calculateSettlementAmount({
          gross_amount_param: project.gross_amount,
          discount_net_param: project.discount_net || 0,
        })

        if (!calculationResult) continue

        // Create settlement items for each designer
        for (const designer of project.designers || []) {
          const designerSettlement = {
            settlement_id: settlement.id,
            member_id: designer.member_id,
            source_type: 'PROJECT' as const,
            source_id: project.id,

            // Store snapshot of calculation
            snapshot_json: {
              project_name: project.name,
              gross_amount: project.gross_amount,
              discount_net: project.discount_net,
              channel_name: project.channel?.name,
              designer_percent: designer.percent,
              bonus_pct: designer.bonus_pct,
              calculation_date: new Date().toISOString(),
              calculation_rules: calculationResult.rules,
            },

            // Calculated amounts from the function
            gross_amount: calculationResult.gross_amount,
            net_amount: calculationResult.net_amount,
            designer_base: calculationResult.designer_base * (designer.percent / 100),
            designer_bonus: calculationResult.designer_base * (designer.percent / 100) * (designer.bonus_pct / 100),

            // Total before withholding
            amount_before_withholding: calculationResult.designer_base * (designer.percent / 100) * (1 + designer.bonus_pct / 100),

            // Withholding tax (3.3%)
            withholding_tax: calculationResult.designer_base * (designer.percent / 100) * (1 + designer.bonus_pct / 100) * 0.033,

            // Final amount after withholding
            amount_after_withholding: calculationResult.designer_base * (designer.percent / 100) * (1 + designer.bonus_pct / 100) * 0.967,

            paid: false,
          }

          settlementItems.push(designerSettlement)
        }
      }

      // Get contacts for the period
      const { data: contacts } = await tables
        .contacts()
        .select(`
          *,
          member:members(*)
        `)
        .gte('event_date', startDate)
        .lte('event_date', endDate)

      // Add contact settlement items
      for (const contact of contacts || []) {
        const contactSettlement = {
          settlement_id: settlement.id,
          member_id: contact.member_id,
          source_type: 'CONTACT' as const,
          source_id: contact.id,

          snapshot_json: {
            contact_type: contact.contact_type,
            event_date: contact.event_date,
            amount: contact.amount,
          },

          gross_amount: contact.amount,
          net_amount: contact.amount,
          amount_before_withholding: contact.amount,
          withholding_tax: contact.amount * 0.033,
          amount_after_withholding: contact.amount * 0.967,

          paid: false,
        }

        settlementItems.push(contactSettlement)
      }

      // Get feed logs for the period
      const { data: feedLogs } = await tables
        .feedLogs()
        .select(`
          *,
          member:members(*)
        `)
        .gte('event_date', startDate)
        .lte('event_date', endDate)

      // Add feed log settlement items
      for (const feedLog of feedLogs || []) {
        const feedSettlement = {
          settlement_id: settlement.id,
          member_id: feedLog.member_id,
          source_type: 'FEED' as const,
          source_id: feedLog.id,

          snapshot_json: {
            feed_type: feedLog.feed_type,
            event_date: feedLog.event_date,
            amount: feedLog.amount,
          },

          gross_amount: feedLog.amount,
          net_amount: feedLog.amount,
          amount_before_withholding: feedLog.amount,
          withholding_tax: feedLog.amount * 0.033,
          amount_after_withholding: feedLog.amount * 0.967,

          paid: false,
        }

        settlementItems.push(feedSettlement)
      }

      // Insert all settlement items
      if (settlementItems.length > 0) {
        const { error: itemsError } = await tables
          .settlementItems()
          .insert(settlementItems)

        if (itemsError) return handleSupabaseError(itemsError)
      }

      // Fetch complete settlement with items
      const result = await this.getSettlement(settlement.id)
      return result

    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Update settlement
   */
  async updateSettlement(id: string, updates: UpdateSettlementForm): Promise<ApiResponse<Settlement>> {
    try {
      const { data, error } = await tables
        .settlements()
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) return handleSupabaseError(error)

      return successResponse(data, 'Settlement updated successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Delete settlement and all its items
   */
  async deleteSettlement(id: string): Promise<ApiResponse<void>> {
    try {
      // First delete all settlement items
      await tables.settlementItems().delete().eq('settlement_id', id)

      // Then delete the settlement
      const { error } = await tables.settlements().delete().eq('id', id)

      if (error) return handleSupabaseError(error)

      return successResponse(undefined, 'Settlement deleted successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Mark settlement item as paid/unpaid
   */
  async updateSettlementItemPayment(
    itemId: string,
    paid: boolean,
    paidDate?: string,
    memo?: string
  ): Promise<ApiResponse<SettlementItem>> {
    try {
      const { data, error } = await tables
        .settlementItems()
        .update({
          paid,
          paid_date: paid ? (paidDate || new Date().toISOString().split('T')[0]) : null,
          memo: memo || null,
        })
        .eq('id', itemId)
        .select()
        .single()

      if (error) return handleSupabaseError(error)

      return successResponse(data, 'Payment status updated successfully')
    } catch (error) {
      return handleSupabaseError(error)
    }
  },

  /**
   * Get settlement statistics
   */
  async getSettlementStats(year?: number, month?: number): Promise<ApiResponse<{
    totalSettlements: number
    totalAmount: number
    totalPaid: number
    totalUnpaid: number
    memberBreakdown: Record<string, { name: string; amount: number; paid: number }>
  }>> {
    try {
      let query = tables
        .settlementItems()
        .select(`
          *,
          member:members(name),
          settlement:settlements(year, month)
        `)

      if (year) {
        query = query.eq('settlement.year', year)
      }
      if (month) {
        query = query.eq('settlement.month', month)
      }

      const { data, error } = await query

      if (error) return handleSupabaseError(error)

      const stats = {
        totalSettlements: new Set(data.map(item => item.settlement_id)).size,
        totalAmount: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        memberBreakdown: {} as Record<string, { name: string; amount: number; paid: number }>,
      }

      data.forEach(item => {
        const amount = item.amount_after_withholding || 0
        stats.totalAmount += amount

        if (item.paid) {
          stats.totalPaid += amount
        } else {
          stats.totalUnpaid += amount
        }

        // Member breakdown
        const memberKey = item.member_id
        if (!stats.memberBreakdown[memberKey]) {
          stats.memberBreakdown[memberKey] = {
            name: item.member?.name || 'Unknown',
            amount: 0,
            paid: 0,
          }
        }

        stats.memberBreakdown[memberKey].amount += amount
        if (item.paid) {
          stats.memberBreakdown[memberKey].paid += amount
        }
      })

      return successResponse(stats)
    } catch (error) {
      return handleSupabaseError(error)
    }
  },
}