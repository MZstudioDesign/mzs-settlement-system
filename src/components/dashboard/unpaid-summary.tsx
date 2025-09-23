'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import {
  AlertCircle,
  Clock,
  Users,
  TrendingUp,
  Eye,
  ChevronRight,
  DollarSign,
  Calendar,
  Target
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { toKRW } from '@/lib/currency'
import { getUnpaidSummary, type UnpaidSummary } from '@/lib/unpaid-tracker'

interface UnpaidSummaryProps {
  className?: string
  onViewDetails?: () => void
  compact?: boolean
}

export function UnpaidSummaryCard({
  className,
  onViewDetails,
  compact = false
}: UnpaidSummaryProps) {
  const [summary, setSummary] = useState<UnpaidSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadUnpaidSummary()
  }, [])

  const loadUnpaidSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getUnpaidSummary()
      setSummary(data)
    } catch (err) {
      console.error('미지급 요약 로드 실패:', err)
      setError('미지급 데이터를 불러오는데 실패했습니다')
      toast.error('미지급 데이터 로드 실패')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-5 w-5 text-orange-500" />
            미지급 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !summary) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertCircle className="h-5 w-5 text-red-500" />
            미지급 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-4">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p>{error || '데이터를 불러올 수 없습니다'}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={loadUnpaidSummary}
              className="mt-2"
            >
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const hasUnpaidAmount = summary.totalUnpaidAmount > 0

  if (compact) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className={cn(
                "h-4 w-4",
                hasUnpaidAmount ? "text-orange-500" : "text-green-500"
              )} />
              <span className="text-sm font-medium">미지급</span>
            </div>
            <div className="text-right">
              <div className={cn(
                "text-lg font-bold",
                hasUnpaidAmount ? "text-orange-600" : "text-green-600"
              )}>
                {hasUnpaidAmount ? toKRW(summary.totalUnpaidAmount) : '0원'}
              </div>
              {hasUnpaidAmount && (
                <div className="text-xs text-muted-foreground">
                  {summary.totalUnpaidCount}건
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className={cn(
            "h-5 w-5",
            hasUnpaidAmount ? "text-orange-500" : "text-green-500"
          )} />
          미지급 현황
          {hasUnpaidAmount && (
            <Badge variant="destructive" className="ml-auto">
              {summary.totalUnpaidCount}건
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 총 미지급 금액 */}
        <div className="text-center p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">총 미지급 금액</span>
          </div>
          <div className={cn(
            "text-2xl font-bold",
            hasUnpaidAmount ? "text-orange-600" : "text-green-600"
          )}>
            {hasUnpaidAmount ? toKRW(summary.totalUnpaidAmount) : '0원'}
          </div>
          {hasUnpaidAmount && (
            <div className="text-xs text-orange-600 mt-1">
              {summary.unpaidByMember.length}명의 미지급자
            </div>
          )}
        </div>

        {hasUnpaidAmount ? (
          <>
            {/* 타입별 미지급 금액 */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                타입별 미지급
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries({
                  design: '디자인',
                  contact: '컨택',
                  feed: '피드',
                  team: '팀업무',
                  mileage: '마일리지'
                }).map(([type, label]) => {
                  const amount = summary.unpaidByType[type as keyof typeof summary.unpaidByType]
                  return amount > 0 ? (
                    <div key={type} className="flex justify-between p-2 bg-muted/30 rounded">
                      <span>{label}</span>
                      <span className="font-medium text-orange-600">{toKRW(amount)}</span>
                    </div>
                  ) : null
                })}
              </div>
            </div>

            {/* 상위 미지급자 */}
            {summary.unpaidByMember.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  미지급자 현황
                </h4>
                <div className="space-y-1">
                  {summary.unpaidByMember.slice(0, 3).map((member) => (
                    <div key={member.memberId} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {member.memberCode}
                        </Badge>
                        <span>{member.memberName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-orange-600">
                          {toKRW(member.unpaidAmount)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {member.unpaidCount}건
                        </div>
                      </div>
                    </div>
                  ))}

                  {summary.unpaidByMember.length > 3 && (
                    <div className="text-center text-xs text-muted-foreground py-1">
                      외 {summary.unpaidByMember.length - 3}명
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* 상세보기 버튼 */}
            {onViewDetails && (
              <Button
                variant="outline"
                className="w-full"
                onClick={onViewDetails}
              >
                <Eye className="h-4 w-4 mr-2" />
                상세 미지급 내역 보기
                <ChevronRight className="h-4 w-4 ml-auto" />
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              모든 정산이 완료되었습니다!
            </h3>
            <p className="text-sm text-muted-foreground">
              현재 미지급 항목이 없습니다
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 미지급 현황 간단 위젯 (대시보드 헤더용)
 */
export function UnpaidWidget({ className }: { className?: string }) {
  const [summary, setSummary] = useState<UnpaidSummary | null>(null)

  useEffect(() => {
    getUnpaidSummary().then(setSummary).catch(console.error)
  }, [])

  if (!summary) return null

  const hasUnpaidAmount = summary.totalUnpaidAmount > 0

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Clock className={cn(
        "h-4 w-4",
        hasUnpaidAmount ? "text-orange-500" : "text-green-500"
      )} />
      <span className="text-sm text-muted-foreground">미지급:</span>
      <span className={cn(
        "text-sm font-medium",
        hasUnpaidAmount ? "text-orange-600" : "text-green-600"
      )}>
        {hasUnpaidAmount ? toKRW(summary.totalUnpaidAmount) : '0원'}
      </span>
      {hasUnpaidAmount && (
        <Badge variant="outline" className="text-xs">
          {summary.totalUnpaidCount}건
        </Badge>
      )}
    </div>
  )
}