'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Calculator, TrendingDown, Receipt } from 'lucide-react'
import { toKRW, calculateWithholdingTax } from '@/lib/currency'
import { cn } from '@/lib/utils'

interface WithholdingDisplayProps {
  // 원천징수 전 금액
  beforeWithholding: number
  // 원천징수 세액 (계산된 값 또는 직접 전달)
  withholdingTax?: number
  // 원천징수 후 금액 (계산된 값 또는 직접 전달)
  afterWithholding?: number
  // 표시 모드
  mode?: 'detailed' | 'compact' | 'inline'
  // 제목
  title?: string
  // 추가 스타일
  className?: string
  // 아이콘 표시 여부
  showIcon?: boolean
  // 계산 과정 표시 여부
  showCalculation?: boolean
}

export function WithholdingDisplay({
  beforeWithholding,
  withholdingTax,
  afterWithholding,
  mode = 'detailed',
  title = '원천징수 계산',
  className,
  showIcon = true,
  showCalculation = false
}: WithholdingDisplayProps) {
  // 원천징수 세액이 제공되지 않으면 계산
  const calculatedWithholdingTax = withholdingTax ?? calculateWithholdingTax(beforeWithholding)
  // 원천징수 후 금액이 제공되지 않으면 계산
  const calculatedAfterWithholding = afterWithholding ?? (beforeWithholding - calculatedWithholdingTax)

  // 원천징수율 계산 (검증용)
  const effectiveRate = beforeWithholding > 0 ? (calculatedWithholdingTax / beforeWithholding) * 100 : 0

  if (mode === 'inline') {
    return (
      <div className={cn("flex items-center gap-2 text-sm", className)}>
        {showIcon && <Receipt className="h-4 w-4 text-muted-foreground" />}
        <span className="text-muted-foreground">원천징수 전:</span>
        <span className="font-medium">{toKRW(beforeWithholding)}</span>
        <TrendingDown className="h-3 w-3 text-red-500" />
        <span className="text-muted-foreground">후:</span>
        <span className="font-bold text-green-600">{toKRW(calculatedAfterWithholding)}</span>
      </div>
    )
  }

  if (mode === 'compact') {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">원천징수 전</span>
              <span className="font-medium">{toKRW(beforeWithholding)}</span>
            </div>
            <div className="flex items-center justify-between text-red-600">
              <span className="text-sm">원천징수 (3.3%)</span>
              <span className="font-medium">-{toKRW(calculatedWithholdingTax)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">원천징수 후</span>
              <span className="text-lg font-bold text-green-600">
                {toKRW(calculatedAfterWithholding)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // detailed mode (기본값)
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {showIcon && <Calculator className="h-5 w-5 text-primary" />}
          {title}
          <Badge variant="outline" className="ml-auto">
            3.3% 원천징수
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 원천징수 전 금액 */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="font-medium">원천징수 전 금액</span>
          </div>
          <span className="text-lg font-bold">{toKRW(beforeWithholding)}</span>
        </div>

        {/* 계산 과정 */}
        {showCalculation && (
          <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
            <div className="font-medium mb-1">계산 과정:</div>
            <div>원천징수액 = {toKRW(beforeWithholding)} × 3.3% = {toKRW(calculatedWithholdingTax)}</div>
            <div>실지급액 = {toKRW(beforeWithholding)} - {toKRW(calculatedWithholdingTax)} = {toKRW(calculatedAfterWithholding)}</div>
          </div>
        )}

        {/* 원천징수 세액 */}
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span className="font-medium text-red-700">원천징수 세액</span>
            <Badge variant="destructive" className="text-xs">
              {effectiveRate.toFixed(2)}%
            </Badge>
          </div>
          <span className="text-lg font-bold text-red-600">
            -{toKRW(calculatedWithholdingTax)}
          </span>
        </div>

        <Separator />

        {/* 원천징수 후 실지급액 */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-lg font-bold text-green-700">실지급액</span>
            <Badge className="bg-green-600 text-white">
              최종
            </Badge>
          </div>
          <span className="text-2xl font-bold text-green-600">
            {toKRW(calculatedAfterWithholding)}
          </span>
        </div>

        {/* 추가 정보 */}
        {beforeWithholding > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            개인사업자 원천징수율 3.3% 적용 (지급액의 {effectiveRate.toFixed(2)}%)
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * 여러 항목의 원천징수를 합계로 표시하는 컴포넌트
 */
interface WithholdingSummaryProps {
  items: Array<{
    id: string
    name: string
    beforeWithholding: number
    withholdingTax?: number
    afterWithholding?: number
  }>
  title?: string
  className?: string
}

export function WithholdingSummary({
  items,
  title = '원천징수 합계',
  className
}: WithholdingSummaryProps) {
  const totalBefore = items.reduce((sum, item) => sum + item.beforeWithholding, 0)
  const totalWithholding = items.reduce((sum, item) => {
    const withholdingTax = item.withholdingTax ?? calculateWithholdingTax(item.beforeWithholding)
    return sum + withholdingTax
  }, 0)
  const totalAfter = totalBefore - totalWithholding

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          {title}
          <Badge variant="outline" className="ml-auto">
            {items.length}개 항목
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 개별 항목들 */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {items.map((item) => {
            const withholdingTax = item.withholdingTax ?? calculateWithholdingTax(item.beforeWithholding)
            const afterWithholding = item.afterWithholding ?? (item.beforeWithholding - withholdingTax)

            return (
              <div key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                <span className="font-medium truncate flex-1 mr-2">{item.name}</span>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-muted-foreground">{toKRW(item.beforeWithholding)}</span>
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span className="font-medium">{toKRW(afterWithholding)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <Separator />

        {/* 합계 */}
        <WithholdingDisplay
          beforeWithholding={totalBefore}
          withholdingTax={totalWithholding}
          afterWithholding={totalAfter}
          mode="compact"
          showIcon={false}
        />
      </CardContent>
    </Card>
  )
}