/**
 * API Hook with Error Guard and Mock Fallback
 * 에러 가드 및 목업 폴백이 포함된 API 훅
 */

import { useState, useCallback, useEffect } from 'react'
import { mockGuard, getErrorStats } from '@/lib/api/error-analysis'

interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  retryCount: number
}

interface UseApiWithGuardOptions<T> {
  url: string
  options?: RequestInit
  mockData?: T
  autoFetch?: boolean
  retryLimit?: number
  retryDelay?: number
}

export function useApiWithGuard<T = any>({
  url,
  options = {},
  mockData,
  autoFetch = true,
  retryLimit = 2,
  retryDelay = 1000
}: UseApiWithGuardOptions<T>) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  })

  const [errorStats, setErrorStats] = useState(getErrorStats())

  // 에러 통계 업데이트
  const updateErrorStats = useCallback(() => {
    setErrorStats(getErrorStats())
  }, [])

  // API 요청 실행
  const execute = useCallback(async (customOptions?: RequestInit) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    try {
      const response = await mockGuard.guardedRequest<T>(
        url,
        { ...options, ...customOptions },
        mockData
      )

      setState({
        data: response,
        loading: false,
        error: null,
        retryCount: 0
      })

      updateErrorStats()
      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }))

      updateErrorStats()
      throw error
    }
  }, [url, options, mockData, updateErrorStats])

  // 재시도 로직
  const retry = useCallback(async () => {
    if (state.retryCount >= retryLimit) {
      console.warn(`Maximum retry limit (${retryLimit}) reached for ${url}`)
      return
    }

    // 재시도 지연
    await new Promise(resolve => setTimeout(resolve, retryDelay))

    try {
      await execute()
    } catch (error) {
      console.error(`Retry ${state.retryCount + 1} failed for ${url}:`, error)
    }
  }, [execute, state.retryCount, retryLimit, retryDelay, url])

  // 자동 재시도 (네트워크 에러의 경우)
  useEffect(() => {
    if (state.error && state.retryCount < retryLimit) {
      const isNetworkError = state.error.includes('network') ||
                            state.error.includes('connection') ||
                            state.error.includes('timeout')

      if (isNetworkError) {
        const timer = setTimeout(retry, retryDelay)
        return () => clearTimeout(timer)
      }
    }
  }, [state.error, state.retryCount, retry, retryLimit, retryDelay])

  // 자동 실행
  useEffect(() => {
    if (autoFetch) {
      execute()
    }
  }, [autoFetch, execute])

  return {
    ...state,
    execute,
    retry,
    errorStats,
    isRetryable: state.retryCount < retryLimit,
    hasMaxRetries: state.retryCount >= retryLimit
  }
}

// POST 요청용 훅
export function usePostApiWithGuard<TRequest = any, TResponse = any>(
  url: string,
  mockData?: TResponse
) {
  const [state, setState] = useState<ApiState<TResponse>>({
    data: null,
    loading: false,
    error: null,
    retryCount: 0
  })

  const post = useCallback(async (data: TRequest, customOptions?: RequestInit) => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null
    }))

    try {
      const response = await mockGuard.guardedRequest<TResponse>(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...customOptions?.headers
          },
          body: JSON.stringify(data),
          ...customOptions
        },
        mockData
      )

      setState({
        data: response,
        loading: false,
        error: null,
        retryCount: 0
      })

      return response
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        retryCount: prev.retryCount + 1
      }))

      throw error
    }
  }, [url, mockData])

  return {
    ...state,
    post
  }
}

// 에러 분석 및 디버깅용 훅
export function useErrorAnalysis() {
  const [stats, setStats] = useState(getErrorStats())

  const refreshStats = useCallback(() => {
    setStats(getErrorStats())
  }, [])

  useEffect(() => {
    // 5초마다 통계 업데이트
    const interval = setInterval(refreshStats, 5000)
    return () => clearInterval(interval)
  }, [refreshStats])

  return {
    stats,
    refreshStats
  }
}

// 개발 환경용 에러 모니터링 컴포넌트를 위한 훅
export function useErrorMonitor() {
  const { stats } = useErrorAnalysis()
  const [isVisible, setIsVisible] = useState(false)

  // 에러가 발생하면 자동으로 표시
  useEffect(() => {
    if (stats.recentErrors > 0 && process.env.NODE_ENV === 'development') {
      setIsVisible(true)
    }
  }, [stats.recentErrors])

  const toggleVisibility = useCallback(() => {
    setIsVisible(prev => !prev)
  }, [])

  const clearErrors = useCallback(() => {
    // 에러 로그 초기화 (실제 구현에서는 error-analysis.ts에 clearErrorLog 함수 추가 필요)
    setIsVisible(false)
  }, [])

  return {
    stats,
    isVisible,
    toggleVisibility,
    clearErrors
  }
}