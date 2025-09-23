'use client'

import { useEffect, useState, memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Activity,
  Zap,
  Clock,
  Database,
  Gauge,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { getPerformanceStats } from '@/lib/performance/db-optimization'

// Web Vitals 측정
interface WebVitals {
  LCP?: number // Largest Contentful Paint
  FID?: number // First Input Delay
  CLS?: number // Cumulative Layout Shift
  TTFB?: number // Time to First Byte
  FCP?: number // First Contentful Paint
}

// 성능 등급 계산
function getPerformanceGrade(score: number): {
  grade: string
  color: string
  description: string
} {
  if (score >= 90) {
    return { grade: 'A', color: 'text-green-600', description: '우수' }
  } else if (score >= 75) {
    return { grade: 'B', color: 'text-blue-600', description: '양호' }
  } else if (score >= 60) {
    return { grade: 'C', color: 'text-yellow-600', description: '보통' }
  } else if (score >= 45) {
    return { grade: 'D', color: 'text-orange-600', description: '미흡' }
  } else {
    return { grade: 'F', color: 'text-red-600', description: '개선필요' }
  }
}

// Core Web Vitals 상태 확인
function getWebVitalStatus(metric: string, value: number) {
  const thresholds = {
    LCP: { good: 2500, poor: 4000 },
    FID: { good: 100, poor: 300 },
    CLS: { good: 0.1, poor: 0.25 },
    TTFB: { good: 800, poor: 1800 },
    FCP: { good: 1800, poor: 3000 }
  }

  const threshold = thresholds[metric as keyof typeof thresholds]
  if (!threshold) return { status: 'unknown', icon: AlertTriangle, color: 'text-gray-500' }

  if (value <= threshold.good) {
    return { status: 'good', icon: CheckCircle, color: 'text-green-600' }
  } else if (value <= threshold.poor) {
    return { status: 'needs-improvement', icon: AlertTriangle, color: 'text-yellow-600' }
  } else {
    return { status: 'poor', icon: XCircle, color: 'text-red-600' }
  }
}

const PerformanceMonitor = memo(() => {
  const [webVitals, setWebVitals] = useState<WebVitals>({})
  const [performanceScore, setPerformanceScore] = useState<number>(0)
  const [dbStats, setDbStats] = useState<any>(null)
  const [memoryUsage, setMemoryUsage] = useState<number>(0)
  const [isVisible, setIsVisible] = useState(false)

  // Web Vitals 측정
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Performance Observer로 Web Vitals 측정
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        switch (entry.entryType) {
          case 'largest-contentful-paint':
            setWebVitals(prev => ({ ...prev, LCP: entry.startTime }))
            break
          case 'first-input':
            setWebVitals(prev => ({ ...prev, FID: entry.processingStart - entry.startTime }))
            break
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              setWebVitals(prev => ({
                ...prev,
                CLS: (prev.CLS || 0) + (entry as any).value
              }))
            }
            break
        }
      }
    })

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] })
    } catch (e) {
      console.warn('Performance Observer not supported')
    }

    // Navigation Timing으로 추가 메트릭 측정
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    if (navigation) {
      setWebVitals(prev => ({
        ...prev,
        TTFB: navigation.responseStart - navigation.requestStart,
        FCP: navigation.loadEventEnd - navigation.navigationStart
      }))
    }

    return () => observer.disconnect()
  }, [])

  // 성능 점수 계산
  useEffect(() => {
    if (Object.keys(webVitals).length === 0) return

    let score = 100
    const { LCP, FID, CLS, TTFB, FCP } = webVitals

    // LCP 점수 (25%)
    if (LCP) {
      if (LCP > 4000) score -= 25
      else if (LCP > 2500) score -= 15
      else if (LCP > 1500) score -= 5
    }

    // FID 점수 (25%)
    if (FID) {
      if (FID > 300) score -= 25
      else if (FID > 100) score -= 15
      else if (FID > 50) score -= 5
    }

    // CLS 점수 (25%)
    if (CLS) {
      if (CLS > 0.25) score -= 25
      else if (CLS > 0.1) score -= 15
      else if (CLS > 0.05) score -= 5
    }

    // TTFB + FCP 점수 (25%)
    if (TTFB && TTFB > 1800) score -= 12.5
    if (FCP && FCP > 3000) score -= 12.5

    setPerformanceScore(Math.max(0, score))
  }, [webVitals])

  // 메모리 사용량 모니터링
  useEffect(() => {
    const updateMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = memory.usedJSHeapSize / 1024 / 1024
        setMemoryUsage(usedMB)
      }
    }

    updateMemoryUsage()
    const interval = setInterval(updateMemoryUsage, 5000)
    return () => clearInterval(interval)
  }, [])

  // DB 통계 조회
  useEffect(() => {
    const stats = getPerformanceStats()
    setDbStats(stats)

    const interval = setInterval(() => {
      const newStats = getPerformanceStats()
      setDbStats(newStats)
    }, 10000)

    return () => clearInterval(interval)
  }, [])

  // 개발 환경에서만 표시
  if (process.env.NODE_ENV !== 'development') return null

  const performanceGrade = getPerformanceGrade(performanceScore)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isVisible ? (
        <Button
          onClick={() => setIsVisible(true)}
          className="rounded-full w-12 h-12 shadow-lg"
          size="sm"
        >
          <Gauge className="h-5 w-5" />
        </Button>
      ) : (
        <Card className="w-80 shadow-xl bg-background/95 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Activity className="h-4 w-4" />
                성능 모니터
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={performanceGrade.color}>
                  {performanceGrade.grade}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* 전체 성능 점수 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">전체 점수</span>
                <span className={`font-bold ${performanceGrade.color}`}>
                  {performanceScore.toFixed(0)}/100
                </span>
              </div>
              <Progress value={performanceScore} className="h-2" />
            </div>

            {/* Core Web Vitals */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Core Web Vitals
              </h4>
              <div className="space-y-1">
                {Object.entries(webVitals).map(([metric, value]) => {
                  const status = getWebVitalStatus(metric, value)
                  const Icon = status.icon
                  return (
                    <div key={metric} className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Icon className={`h-3 w-3 ${status.color}`} />
                        <span>{metric}</span>
                      </div>
                      <span className="font-mono">
                        {metric === 'CLS' ? value.toFixed(3) : `${value.toFixed(0)}ms`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 메모리 사용량 */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  메모리
                </span>
                <span className="font-mono">{memoryUsage.toFixed(1)}MB</span>
              </div>
              <Progress value={Math.min((memoryUsage / 200) * 100, 100)} className="h-1" />
            </div>

            {/* DB 쿼리 통계 */}
            {dbStats && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <Database className="h-3 w-3" />
                  DB 쿼리
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">총 쿼리:</span>
                    <span className="ml-1 font-mono">{dbStats.totalQueries}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">평균:</span>
                    <span className="ml-1 font-mono">{dbStats.avgDuration}ms</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">최대:</span>
                    <span className="ml-1 font-mono">{dbStats.maxDuration}ms</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">느린 쿼리:</span>
                    <span className="ml-1 font-mono">{dbStats.slowQueriesCount}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 최적화 팁 */}
            {performanceScore < 75 && (
              <div className="p-2 bg-yellow-50 rounded border border-yellow-200">
                <div className="flex items-start gap-1">
                  <TrendingUp className="h-3 w-3 text-yellow-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-yellow-800 text-xs">최적화 제안</div>
                    <div className="text-xs text-yellow-700 mt-1">
                      {performanceScore < 50 && "Critical performance issues detected"}
                      {performanceScore >= 50 && performanceScore < 75 && "Performance can be improved"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
})

PerformanceMonitor.displayName = 'PerformanceMonitor'

export default PerformanceMonitor