'use client'

import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// 로딩 컴포넌트
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center space-x-2">
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-muted-foreground">로딩 중...</span>
    </div>
  </div>
)

const LoadingCard = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-muted rounded w-3/4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded"></div>
      <div className="h-4 bg-muted rounded w-5/6"></div>
    </div>
  </div>
)

// 지연 로딩된 컴포넌트들 - 현재 구현된 것만 활성화
export const LazyOptimizedSettlementsTable = dynamic(
  () => import('@/components/settlements/optimized-settlements-table').then(mod => ({
    default: mod.OptimizedSettlementsTable
  })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

export const LazyOptimizedSettlementItemsTable = dynamic(
  () => import('@/components/settlements/optimized-settlements-table').then(mod => ({
    default: mod.OptimizedSettlementItemsTable
  })),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
)

// 성능 모니터링 (개발용)
export const LazyPerformanceMonitor = dynamic(
  () => import('@/components/dev/performance-monitor'),
  {
    loading: () => null,
    ssr: false
  }
)

// 높은 우선순위로 프리로드할 컴포넌트들
export const preloadCriticalComponents = () => {
  // 정산 테이블은 자주 사용되므로 프리로드
  import('@/components/settlements/optimized-settlements-table')

  // 메인 네비게이션 컴포넌트들
  import('@/components/navigation/mobile-header')
  import('@/components/navigation/bottom-navigation')
}

// 라우트별 컴포넌트 프리로드 - 현재 구현된 것만
export const preloadRouteComponents = {
  dashboard: () => {
    // 현재 구현된 대시보드 컴포넌트 없음
  },

  projects: () => {
    // 현재 구현된 프로젝트 컴포넌트 없음
  },

  settlements: () => {
    import('@/components/settlements/optimized-settlements-table')
  },

  settings: () => {
    // 현재 구현된 설정 컴포넌트 없음
  }
}

// HOC for lazy loading with error boundary
export function withLazyLoading<P extends object>(
  Component: ComponentType<P>,
  fallback?: ComponentType
) {
  const LazyComponent = dynamic(() => Promise.resolve(Component), {
    loading: () => fallback ? <fallback /> : <LoadingSpinner />,
    ssr: false
  })

  LazyComponent.displayName = `withLazyLoading(${Component.displayName || Component.name})`

  return LazyComponent
}