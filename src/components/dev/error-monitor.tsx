/**
 * Development Error Monitor Component
 * 개발 환경용 에러 모니터링 컴포넌트
 */

'use client'

import { memo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  AlertTriangle,
  Bug,
  Clock,
  Network,
  Server,
  Zap,
  X,
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useErrorMonitor } from '@/hooks/useApiWithGuard'

const ErrorMonitor = memo(() => {
  const { stats, isVisible, toggleVisibility, clearErrors } = useErrorMonitor()

  // 개발 환경에서만 표시
  if (process.env.NODE_ENV !== 'development') return null

  // 에러 심각도 계산
  const getSeverityColor = (errorCount: number) => {
    if (errorCount === 0) return 'text-green-600'
    if (errorCount < 3) return 'text-yellow-600'
    if (errorCount < 10) return 'text-orange-600'
    return 'text-red-600'
  }

  const getSeverityBadge = (errorCount: number) => {
    if (errorCount === 0) return { variant: 'default' as const, label: '정상' }
    if (errorCount < 3) return { variant: 'secondary' as const, label: '주의' }
    if (errorCount < 10) return { variant: 'destructive' as const, label: '경고' }
    return { variant: 'destructive' as const, label: '심각' }
  }

  const severity = getSeverityBadge(stats.recentErrors)

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {!isVisible ? (
        <Button
          onClick={toggleVisibility}
          className={`rounded-full w-12 h-12 shadow-lg ${
            stats.recentErrors > 0
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-gray-500 hover:bg-gray-600'
          }`}
          size="sm"
        >
          {stats.recentErrors > 0 ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <Bug className="h-5 w-5" />
          )}
        </Button>
      ) : (
        <Card className="w-96 shadow-xl bg-background/95 backdrop-blur">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Bug className="h-4 w-4" />
                에러 모니터
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={severity.variant}>
                  {severity.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleVisibility}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {/* 전체 에러 요약 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">최근 1시간 에러</span>
                <span className={`font-bold ${getSeverityColor(stats.recentErrors)}`}>
                  {stats.recentErrors}개
                </span>
              </div>
              <Progress
                value={Math.min((stats.recentErrors / 10) * 100, 100)}
                className="h-2"
              />
            </div>

            {/* 에러 타입별 분류 */}
            {Object.keys(stats.errorsByType).length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <Network className="h-3 w-3" />
                  에러 타입별 분류
                </h4>
                <div className="space-y-1">
                  {Object.entries(stats.errorsByType).map(([type, count]) => {
                    const typeInfo = getErrorTypeInfo(type)
                    const Icon = typeInfo.icon
                    return (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Icon className={`h-3 w-3 ${typeInfo.color}`} />
                          <span>{typeInfo.label}</span>
                        </div>
                        <span className="font-mono">{count}회</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* URL별 에러 빈도 */}
            {Object.keys(stats.errorsByUrl).length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <Server className="h-3 w-3" />
                  URL별 에러 빈도
                </h4>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {Object.entries(stats.errorsByUrl)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([url, count]) => (
                      <div key={url} className="flex items-center justify-between">
                        <span className="truncate flex-1" title={url}>
                          {url.split('/').pop() || url}
                        </span>
                        <span className="font-mono ml-2">{count}회</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* 권장사항 */}
            {stats.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  개선 권장사항
                </h4>
                <div className="space-y-1">
                  {stats.recommendations.slice(0, 3).map((recommendation, index) => (
                    <div key={index} className="text-xs text-muted-foreground">
                      • {recommendation}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 액션 버튼들 */}
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={clearErrors}
                className="flex-1 h-8"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                초기화
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
                className="flex-1 h-8"
              >
                새로고침
              </Button>
            </div>

            {/* 상태 표시 */}
            <div className="text-center pt-2 border-t">
              {stats.recentErrors === 0 ? (
                <div className="flex items-center justify-center gap-1 text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span className="text-xs">시스템 정상</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1 text-orange-600">
                  <XCircle className="h-3 w-3" />
                  <span className="text-xs">에러 발생 중</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
})

// 에러 타입별 정보
function getErrorTypeInfo(type: string) {
  const typeMap = {
    timeout: {
      icon: Clock,
      color: 'text-yellow-600',
      label: '타임아웃'
    },
    connection: {
      icon: Network,
      color: 'text-blue-600',
      label: '연결 오류'
    },
    server: {
      icon: Server,
      color: 'text-red-600',
      label: '서버 오류'
    },
    client: {
      icon: Bug,
      color: 'text-purple-600',
      label: '클라이언트 오류'
    },
    validation: {
      icon: AlertTriangle,
      color: 'text-orange-600',
      label: '유효성 오류'
    }
  } as const

  return typeMap[type as keyof typeof typeMap] || {
    icon: AlertTriangle,
    color: 'text-gray-600',
    label: '기타 오류'
  }
}

ErrorMonitor.displayName = 'ErrorMonitor'

export default ErrorMonitor