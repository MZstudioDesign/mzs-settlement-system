/**
 * 데이터베이스 쿼리 최적화 유틸리티
 * Supabase 쿼리 성능 향상을 위한 헬퍼 함수들
 */

import { supabase } from '@/lib/supabase'

// 쿼리 성능 모니터링
export interface QueryPerformance {
  query: string
  duration: number
  timestamp: number
  success: boolean
  rowCount?: number
}

const performanceLog: QueryPerformance[] = []

// 성능 측정 래퍼
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any; performance: QueryPerformance }> {
  const startTime = performance.now()

  try {
    const result = await queryFn()
    const endTime = performance.now()
    const duration = endTime - startTime

    const perfData: QueryPerformance = {
      query: queryName,
      duration,
      timestamp: Date.now(),
      success: !result.error,
      rowCount: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0
    }

    // 개발 환경에서만 로깅
    if (process.env.NODE_ENV === 'development') {
      performanceLog.push(perfData)

      // 느린 쿼리 경고 (500ms 이상)
      if (duration > 500) {
        console.warn(`🐌 Slow query detected: ${queryName} (${duration.toFixed(2)}ms)`)
      }

      // 성능 로그 최대 100개로 제한
      if (performanceLog.length > 100) {
        performanceLog.shift()
      }
    }

    return { ...result, performance: perfData }
  } catch (error) {
    const endTime = performance.now()
    const duration = endTime - startTime

    const perfData: QueryPerformance = {
      query: queryName,
      duration,
      timestamp: Date.now(),
      success: false
    }

    return { data: null, error, performance: perfData }
  }
}

// 성능 통계 조회
export function getPerformanceStats() {
  if (performanceLog.length === 0) return null

  const durations = performanceLog.map(p => p.duration)
  const avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length
  const maxDuration = Math.max(...durations)
  const minDuration = Math.min(...durations)
  const slowQueries = performanceLog.filter(p => p.duration > 500)

  return {
    totalQueries: performanceLog.length,
    avgDuration: Number(avgDuration.toFixed(2)),
    maxDuration: Number(maxDuration.toFixed(2)),
    minDuration: Number(minDuration.toFixed(2)),
    slowQueriesCount: slowQueries.length,
    slowQueriesPercentage: Number(((slowQueries.length / performanceLog.length) * 100).toFixed(2)),
    recentQueries: performanceLog.slice(-10)
  }
}

// 최적화된 정산 쿼리
export const optimizedSettlementQueries = {
  // 정산 목록 - 인덱스 최적화된 쿼리
  getSettlements: async (limit = 50, offset = 0) => {
    return measureQuery('settlements.list', async () => {
      return await supabase
        .from('settlements')
        .select(`
          id,
          ym,
          note,
          created_at,
          status,
          total_amount,
          settled_amount,
          member_count,
          item_count
        `)
        .order('ym', { ascending: false })
        .range(offset, offset + limit - 1)
    })
  },

  // 특정 정산의 상세 정보 - JOIN 최적화
  getSettlementDetails: async (settlementId: string) => {
    return measureQuery('settlement.details', async () => {
      return await supabase
        .from('settlements')
        .select(`
          id,
          ym,
          note,
          created_at,
          status,
          total_amount,
          settled_amount,
          member_count,
          item_count
        `)
        .eq('id', settlementId)
        .single()
    })
  },

  // 정산 항목 - 인덱스와 조인 최적화
  getSettlementItems: async (settlementId: string) => {
    return measureQuery('settlement_items.list', async () => {
      return await supabase
        .from('settlement_items')
        .select(`
          id,
          settlement_id,
          member_id,
          source_type,
          designer_amount,
          contact_amount,
          feed_amount,
          team_amount,
          designer_bonus_amount,
          amount_before_withholding,
          withholding_3_3,
          amount_after_withholding,
          paid,
          paid_date,
          memo,
          created_at,
          members!inner (
            id,
            name,
            code
          )
        `)
        .eq('settlement_id', settlementId)
        .order('created_at', { ascending: false })
    })
  },

  // 미지급 정산 항목 - 복합 인덱스 활용
  getUnpaidItems: async (limit = 100) => {
    return measureQuery('settlement_items.unpaid', async () => {
      return await supabase
        .from('settlement_items')
        .select(`
          id,
          settlement_id,
          member_id,
          amount_after_withholding,
          paid_date,
          memo,
          settlements!inner (
            ym,
            note
          ),
          members!inner (
            id,
            name,
            code
          )
        `)
        .eq('paid', false)
        .order('created_at', { ascending: false })
        .limit(limit)
    })
  },

  // 통계 쿼리 - 집계 최적화
  getSettlementStats: async () => {
    return measureQuery('settlements.stats', async () => {
      // 정산 상태별 카운트
      const { data: statusCounts } = await supabase
        .from('settlements')
        .select('status')

      // 총 정산 금액 및 지급 상태
      const { data: amountStats } = await supabase
        .from('settlement_items')
        .select('amount_after_withholding, paid')

      return {
        data: {
          statusCounts,
          amountStats
        },
        error: null
      }
    })
  }
}

// 인덱스 추천 함수
export function getIndexRecommendations() {
  return [
    {
      table: 'settlements',
      columns: ['ym', 'status', 'created_at'],
      reason: '정산 목록 조회시 날짜순 정렬 및 상태 필터링 성능 향상'
    },
    {
      table: 'settlement_items',
      columns: ['settlement_id', 'member_id', 'paid'],
      reason: '정산별, 멤버별, 지급상태별 조회 성능 향상'
    },
    {
      table: 'settlement_items',
      columns: ['paid', 'created_at'],
      reason: '미지급 항목 조회시 성능 향상'
    },
    {
      table: 'settlement_items',
      columns: ['member_id', 'paid', 'created_at'],
      reason: '멤버별 미지급 내역 조회 성능 향상'
    },
    {
      table: 'projects',
      columns: ['settle_date', 'status'],
      reason: '정산일 기준 프로젝트 조회 성능 향상'
    },
    {
      table: 'contacts',
      columns: ['member_id', 'date'],
      reason: '멤버별 컨택 내역 조회 성능 향상'
    },
    {
      table: 'feed_logs',
      columns: ['member_id', 'date'],
      reason: '멤버별 피드 내역 조회 성능 향상'
    }
  ]
}

// 쿼리 최적화 팁
export function getOptimizationTips() {
  return [
    {
      category: 'SELECT 최적화',
      tips: [
        '필요한 컬럼만 선택하여 데이터 전송량 최소화',
        'COUNT(*) 대신 COUNT(id) 사용으로 성능 향상',
        '큰 텍스트 필드는 필요시에만 조회'
      ]
    },
    {
      category: 'JOIN 최적화',
      tips: [
        'INNER JOIN을 사용하여 불필요한 데이터 제거',
        'JOIN 조건에 인덱스가 있는 컬럼 사용',
        '여러 테이블 JOIN시 작은 테이블부터 조인'
      ]
    },
    {
      category: '페이지네이션',
      tips: [
        'OFFSET 대신 커서 기반 페이지네이션 사용',
        '정렬 기준이 되는 컬럼에 인덱스 추가',
        '페이지 크기를 적절히 제한 (50-100개)'
      ]
    },
    {
      category: '필터링',
      tips: [
        '자주 사용되는 필터 조건에 인덱스 추가',
        'WHERE 절에서 함수 사용 최소화',
        '범위 검색시 BETWEEN 대신 >= AND <= 사용'
      ]
    }
  ]
}

// Supabase RLS (Row Level Security) 최적화
export function getRLSOptimizationTips() {
  return [
    {
      table: 'settlement_items',
      policy: '정산 항목은 해당 멤버만 조회 가능',
      optimization: 'member_id 컬럼에 인덱스 추가로 RLS 성능 향상'
    },
    {
      table: 'projects',
      policy: '프로젝트는 할당된 디자이너만 조회 가능',
      optimization: 'designers 컬럼에 GIN 인덱스 추가로 JSON 검색 성능 향상'
    }
  ]
}

// 캐시 전략 추천
export function getCacheStrategies() {
  return [
    {
      type: 'Static Data',
      tables: ['members', 'channels', 'categories'],
      strategy: 'staleTime: 1시간, 데이터 변경이 적음',
      implementation: 'React Query의 긴 staleTime 설정'
    },
    {
      type: 'Frequently Updated',
      tables: ['settlement_items', 'contacts', 'feed_logs'],
      strategy: 'staleTime: 5분, 실시간성 중요',
      implementation: 'React Query 자동 무효화 + 낙관적 업데이트'
    },
    {
      type: 'Read-Heavy',
      tables: ['settlements'],
      strategy: 'staleTime: 10분, 읽기 위주',
      implementation: 'React Query + 백그라운드 리프레시'
    }
  ]
}