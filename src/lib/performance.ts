/**
 * Performance optimization utilities for MZS Settlement System
 */

import { useRef, useCallback, useMemo } from 'react'
import type { DependencyList } from 'react'

/**
 * Debounced callback hook for performance optimization
 */
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout>()

  return useCallback(
    ((...args: Parameters<T>) => {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => callback(...args), delay)
    }) as T,
    [callback, delay]
  )
}

/**
 * Throttled callback hook for performance optimization
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRun = useRef<number>(0)

  return useCallback(
    ((...args: Parameters<T>) => {
      const now = Date.now()
      if (now - lastRun.current >= delay) {
        lastRun.current = now
        return callback(...args)
      }
    }) as T,
    [callback, delay]
  )
}

/**
 * Memoized calculation hook with dependency optimization
 */
export function useMemoizedCalculation<T>(
  calculation: () => T,
  deps: DependencyList
): T {
  return useMemo(calculation, deps)
}

/**
 * Performance monitoring utilities
 */
export const perf = {
  /**
   * Mark the start of a performance measurement
   */
  mark: (name: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`)
    }
  },

  /**
   * Mark the end and measure performance
   */
  measure: (name: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)

      const measure = performance.getEntriesByName(name, 'measure')[0]
      if (measure) {
        console.log(`${name}: ${measure.duration.toFixed(2)}ms`)
        return measure.duration
      }
    }
    return 0
  },

  /**
   * Clear performance marks and measures
   */
  clear: (name?: string) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      if (name) {
        performance.clearMarks(`${name}-start`)
        performance.clearMarks(`${name}-end`)
        performance.clearMeasures(name)
      } else {
        performance.clearMarks()
        performance.clearMeasures()
      }
    }
  }
}

/**
 * Currency formatter with memoization
 */
export const createCurrencyFormatter = () => {
  const formatter = new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return {
    format: (amount: number): string => formatter.format(amount),
    formatShort: (amount: number): string => {
      if (amount >= 100000000) { // 1억 이상
        return `${(amount / 100000000).toFixed(1)}억원`
      } else if (amount >= 10000) { // 1만 이상
        return `${(amount / 10000).toFixed(0)}만원`
      } else {
        return formatter.format(amount)
      }
    }
  }
}

/**
 * Number formatter with memoization
 */
export const createNumberFormatter = () => {
  const formatter = new Intl.NumberFormat('ko-KR')
  return (num: number): string => formatter.format(num)
}

/**
 * Date formatter with memoization
 */
export const createDateFormatter = () => {
  const formatters = {
    short: new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }),
    long: new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    }),
    time: new Intl.DateTimeFormat('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return {
    formatShort: (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date
      return formatters.short.format(d)
    },
    formatLong: (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date
      return formatters.long.format(d)
    },
    formatTime: (date: Date | string): string => {
      const d = typeof date === 'string' ? new Date(date) : date
      return formatters.time.format(d)
    }
  }
}

/**
 * Intersection Observer hook for lazy loading
 */
export function useIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options?: IntersectionObserverInit
) {
  const observer = useRef<IntersectionObserver>()

  const observe = useCallback(
    (element: Element) => {
      if (observer.current) {
        observer.current.disconnect()
      }

      observer.current = new IntersectionObserver(callback, {
        threshold: 0.1,
        ...options,
      })

      observer.current.observe(element)
    },
    [callback, options]
  )

  const disconnect = useCallback(() => {
    if (observer.current) {
      observer.current.disconnect()
    }
  }, [])

  return { observe, disconnect }
}

/**
 * Bundle analysis for development
 */
export const bundleAnalysis = {
  /**
   * Log component render count
   */
  logRender: (componentName: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered at ${new Date().toISOString()}`)
    }
  },

  /**
   * Log heavy computation
   */
  logComputation: (operationName: string, startTime: number) => {
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - startTime
      if (duration > 16) { // Longer than one frame
        console.warn(`⚠️ Heavy computation: ${operationName} took ${duration}ms`)
      }
    }
  }
}

/**
 * Memory optimization utilities
 */
export const memory = {
  /**
   * Check if we should enable optimizations based on device memory
   */
  shouldOptimize: (): boolean => {
    if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
      // @ts-ignore - deviceMemory is not in TypeScript types yet
      return navigator.deviceMemory < 4 // Less than 4GB RAM
    }
    return false // Default to not optimizing if can't detect
  },

  /**
   * Get optimized settings based on device capabilities
   */
  getOptimizedSettings: () => {
    const shouldOptimize = memory.shouldOptimize()
    return {
      pageSize: shouldOptimize ? 5 : 10,
      virtualThreshold: shouldOptimize ? 50 : 100,
      cacheSize: shouldOptimize ? 20 : 50,
      enableAnimations: !shouldOptimize,
    }
  }
}