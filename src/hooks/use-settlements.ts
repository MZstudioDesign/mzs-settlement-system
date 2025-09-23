'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// 정산 데이터 타입 정의
export interface Settlement {
  id: string
  ym: string
  note: string
  created_at: string
  status: 'DRAFT' | 'PENDING' | 'COMPLETED' | 'CANCELLED'
  total_amount: number
  settled_amount: number
  member_count: number
  item_count: number
}

export interface SettlementItem {
  id: string
  settlement_id: string
  member_id: string
  source_type: 'project' | 'contact' | 'feed' | 'team' | 'mileage'
  source_id: string
  snapshot_json: any
  gross_T: number
  net_B: number
  discount_net: number
  ad_fee: number
  program_fee: number
  channel_fee: number
  designer_base: number
  designer_amount: number
  designer_bonus_amount: number
  contact_amount: number
  feed_amount: number
  team_amount: number
  mileage_amount: number
  amount_before_withholding: number
  withholding_3_3: number
  amount_after_withholding: number
  paid: boolean
  paid_date: string | null
  memo: string | null
  created_at: string
  member?: {
    id: string
    name: string
    code: string
  }
}

// 정산 목록 조회
export const useSettlements = () => {
  return useQuery({
    queryKey: ['settlements'],
    queryFn: async (): Promise<Settlement[]> => {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .order('ym', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  })
}

// 특정 정산 조회
export const useSettlement = (settlementId: string) => {
  return useQuery({
    queryKey: ['settlement', settlementId],
    queryFn: async (): Promise<Settlement | null> => {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('id', settlementId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!settlementId,
    staleTime: 1000 * 60 * 10, // 10분간 캐시 유지
  })
}

// 정산 항목 조회
export const useSettlementItems = (settlementId?: string) => {
  return useQuery({
    queryKey: ['settlement-items', settlementId],
    queryFn: async (): Promise<SettlementItem[]> => {
      let query = supabase
        .from('settlement_items')
        .select(`
          *,
          member:members(id, name, code)
        `)
        .order('created_at', { ascending: false })

      if (settlementId) {
        query = query.eq('settlement_id', settlementId)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    },
    enabled: !!settlementId,
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  })
}

// 모든 정산 항목 조회 (가상화용)
export const useAllSettlementItems = () => {
  return useQuery({
    queryKey: ['all-settlement-items'],
    queryFn: async (): Promise<SettlementItem[]> => {
      const { data, error } = await supabase
        .from('settlement_items')
        .select(`
          *,
          member:members(id, name, code),
          settlement:settlements(ym, note)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    staleTime: 1000 * 60 * 3, // 3분간 캐시 유지 (변동이 잦은 데이터)
  })
}

// 정산 생성 mutation
export const useCreateSettlement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { ym: string; note?: string }) => {
      const { data: result, error } = await supabase
        .from('settlements')
        .insert({
          ym: data.ym,
          note: data.note || `${data.ym} 정산`,
        })
        .select()
        .single()

      if (error) throw error
      return result
    },
    onSuccess: () => {
      // 정산 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
    },
  })
}

// 정산 상태 업데이트 mutation
export const useUpdateSettlementStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      settlementId,
      status
    }: {
      settlementId: string
      status: Settlement['status']
    }) => {
      const { data, error } = await supabase
        .from('settlements')
        .update({ status })
        .eq('id', settlementId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['settlements'] })
      queryClient.invalidateQueries({ queryKey: ['settlement', data.id] })
    },
  })
}

// 정산 항목 지급 상태 업데이트 mutation
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemId,
      paid,
      memo
    }: {
      itemId: string
      paid: boolean
      memo?: string
    }) => {
      const updateData: any = {
        paid,
        paid_date: paid ? new Date().toISOString() : null,
      }

      if (memo !== undefined) {
        updateData.memo = memo
      }

      const { data, error } = await supabase
        .from('settlement_items')
        .update(updateData)
        .eq('id', itemId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      // 관련 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: ['settlement-items', data.settlement_id]
      })
      queryClient.invalidateQueries({
        queryKey: ['all-settlement-items']
      })
    },
  })
}

// 일괄 지급 상태 업데이트 mutation
export const useBulkUpdatePaymentStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      itemIds,
      paid,
      memo
    }: {
      itemIds: string[]
      paid: boolean
      memo?: string
    }) => {
      const updateData: any = {
        paid,
        paid_date: paid ? new Date().toISOString() : null,
      }

      if (memo !== undefined) {
        updateData.memo = memo
      }

      const { data, error } = await supabase
        .from('settlement_items')
        .update(updateData)
        .in('id', itemIds)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // 모든 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['settlement-items'] })
      queryClient.invalidateQueries({ queryKey: ['all-settlement-items'] })
    },
  })
}

// 정산 통계 조회
export const useSettlementStats = () => {
  return useQuery({
    queryKey: ['settlement-stats'],
    queryFn: async () => {
      // 정산 개수 및 상태별 통계
      const { data: settlements, error: settlementsError } = await supabase
        .from('settlements')
        .select('status')

      if (settlementsError) throw settlementsError

      // 총 정산 금액 통계
      const { data: items, error: itemsError } = await supabase
        .from('settlement_items')
        .select('amount_after_withholding, paid')

      if (itemsError) throw itemsError

      const totalSettlements = settlements?.length || 0
      const completedSettlements = settlements?.filter(s => s.status === 'COMPLETED').length || 0
      const pendingSettlements = settlements?.filter(s => s.status === 'PENDING').length || 0
      const totalAmount = items?.reduce((sum, item) => sum + item.amount_after_withholding, 0) || 0
      const paidAmount = items?.filter(item => item.paid).reduce((sum, item) => sum + item.amount_after_withholding, 0) || 0

      return {
        totalSettlements,
        completedSettlements,
        pendingSettlements,
        totalAmount,
        paidAmount,
        unpaidAmount: totalAmount - paidAmount,
        completionRate: totalSettlements > 0 ? (completedSettlements / totalSettlements * 100) : 0
      }
    },
    staleTime: 1000 * 60 * 5, // 5분간 캐시 유지
  })
}