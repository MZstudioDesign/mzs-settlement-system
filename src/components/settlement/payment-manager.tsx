'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DollarSign,
  Check,
  X,
  Clock,
  Calendar,
  FileText,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Edit,
  Banknote
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { toKRW } from '@/lib/currency'
import { WithholdingDisplay } from './withholding-display'
import {
  getMemberUnpaidItems,
  updatePaymentStatus,
  bulkUpdatePaymentStatus,
  markSettlementAsPaid,
  type UnpaidItem
} from '@/lib/unpaid-tracker'

interface PaymentManagerProps {
  settlementId?: string
  memberId?: string
  className?: string
  compact?: boolean
}

export function PaymentManager({
  settlementId,
  memberId,
  className,
  compact = false
}: PaymentManagerProps) {
  const [unpaidItems, setUnpaidItems] = useState<UnpaidItem[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [memo, setMemo] = useState('')

  useEffect(() => {
    if (memberId) {
      loadMemberUnpaidItems()
    }
  }, [memberId])

  const loadMemberUnpaidItems = async () => {
    if (!memberId) return

    try {
      setLoading(true)
      const items = await getMemberUnpaidItems(memberId)
      setUnpaidItems(items)
    } catch (error) {
      console.error('미지급 항목 로드 실패:', error)
      toast.error('미지급 항목을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentToggle = async (itemId: string, paid: boolean, itemMemo?: string) => {
    try {
      setUpdating(true)
      const result = await updatePaymentStatus(itemId, paid, itemMemo)

      if (result.success) {
        toast.success(paid ? '지급 완료 처리되었습니다' : '지급 대기로 변경되었습니다')
        await loadMemberUnpaidItems()
      } else {
        toast.error(result.error || '지급 상태 변경 실패')
      }
    } catch (error) {
      console.error('지급 상태 변경 실패:', error)
      toast.error('지급 상태 변경 중 오류가 발생했습니다')
    } finally {
      setUpdating(false)
    }
  }

  const handleBulkPayment = async (paid: boolean) => {
    if (selectedItems.size === 0) {
      toast.error('선택된 항목이 없습니다')
      return
    }

    try {
      setUpdating(true)
      const itemIds = Array.from(selectedItems)
      const result = await bulkUpdatePaymentStatus(itemIds, paid, memo)

      if (result.success) {
        toast.success(`${result.updated}건이 ${paid ? '지급 완료' : '지급 대기'}로 변경되었습니다`)
        setSelectedItems(new Set())
        setMemo('')
        await loadMemberUnpaidItems()
      } else {
        toast.error(result.error || '일괄 처리 실패')
      }
    } catch (error) {
      console.error('일괄 지급 처리 실패:', error)
      toast.error('일괄 처리 중 오류가 발생했습니다')
    } finally {
      setUpdating(false)
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(unpaidItems.map(item => item.id)))
    } else {
      setSelectedItems(new Set())
    }
  }

  const totalSelectedAmount = unpaidItems
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.amountAfterWithholding, 0)

  const totalUnpaidAmount = unpaidItems.reduce((sum, item) => sum + item.amountAfterWithholding, 0)

  if (loading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5 text-primary" />
            지급 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (unpaidItems.length === 0) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle className="h-5 w-5 text-green-600" />
            지급 관리
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold text-green-700 mb-2">
              모든 항목이 지급 완료되었습니다
            </h3>
            <p className="text-sm text-muted-foreground">
              현재 미지급 항목이 없습니다
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5 text-orange-600" />
          지급 관리
          <Badge variant="destructive" className="ml-auto">
            {unpaidItems.length}건 미지급
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 요약 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WithholdingDisplay
            beforeWithholding={totalUnpaidAmount / 0.967} // 역산
            afterWithholding={totalUnpaidAmount}
            mode="compact"
            title="총 미지급 금액"
            showIcon={false}
          />

          {selectedItems.size > 0 && (
            <WithholdingDisplay
              beforeWithholding={totalSelectedAmount / 0.967} // 역산
              afterWithholding={totalSelectedAmount}
              mode="compact"
              title="선택된 금액"
              showIcon={false}
              className="border-2 border-blue-200 bg-blue-50"
            />
          )}
        </div>

        {/* 일괄 선택 및 처리 */}
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selectedItems.size === unpaidItems.length}
              onCheckedChange={handleSelectAll}
              disabled={updating}
            />
            <Label className="text-sm font-medium">
              전체 선택 ({selectedItems.size}/{unpaidItems.length})
            </Label>
          </div>

          {selectedItems.size > 0 && (
            <div className="flex items-center gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" disabled={updating}>
                    <Check className="h-4 w-4 mr-1" />
                    일괄 지급 완료
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>일괄 지급 완료</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-700">
                        선택된 {selectedItems.size}건을 지급 완료 처리합니다
                      </div>
                      <div className="text-lg font-bold text-blue-800 mt-1">
                        총 {toKRW(totalSelectedAmount)}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="memo">메모 (선택사항)</Label>
                      <Textarea
                        id="memo"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        placeholder="지급 메모를 입력하세요..."
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => handleBulkPayment(true)}
                      disabled={updating}
                    >
                      {updating ? '처리 중...' : '지급 완료'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkPayment(false)}
                disabled={updating}
              >
                <X className="h-4 w-4 mr-1" />
                선택 해제
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* 미지급 항목 목록 */}
        <div className="space-y-3">
          {unpaidItems.map((item) => (
            <div
              key={item.id}
              className={cn(
                "p-4 border rounded-lg transition-colors",
                selectedItems.has(item.id) ? "border-blue-300 bg-blue-50" : "border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={selectedItems.has(item.id)}
                  onCheckedChange={(checked) => {
                    const newSelected = new Set(selectedItems)
                    if (checked) {
                      newSelected.add(item.id)
                    } else {
                      newSelected.delete(item.id)
                    }
                    setSelectedItems(newSelected)
                  }}
                  disabled={updating}
                  className="mt-1"
                />

                <div className="flex-1 space-y-2">
                  {/* 항목 정보 */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {item.memberCode}
                        </Badge>
                        <span className="font-medium">{item.memberName}</span>
                        <Badge
                          variant={item.sourceType === 'project' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.sourceType === 'project' ? '디자인' : item.sourceType}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {item.settlementYm} 정산
                      </div>
                    </div>

                    <div className="text-right">
                      <WithholdingDisplay
                        beforeWithholding={item.amountBeforeWithholding}
                        withholdingTax={item.withholdingTax}
                        afterWithholding={item.amountAfterWithholding}
                        mode="inline"
                        showIcon={false}
                      />
                    </div>
                  </div>

                  {/* 메모 */}
                  {item.memo && (
                    <div className="flex items-start gap-2 text-xs p-2 bg-muted/30 rounded">
                      <FileText className="h-3 w-3 mt-0.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{item.memo}</span>
                    </div>
                  )}

                  {/* 개별 지급 처리 버튼 */}
                  <div className="flex items-center gap-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={updating}>
                          <Banknote className="h-4 w-4 mr-1" />
                          지급 완료
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>지급 완료 처리</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="p-4 bg-green-50 rounded-lg">
                            <div className="text-sm text-green-700">
                              {item.memberName}님의 {item.description}
                            </div>
                            <WithholdingDisplay
                              beforeWithholding={item.amountBeforeWithholding}
                              withholdingTax={item.withholdingTax}
                              afterWithholding={item.amountAfterWithholding}
                              mode="compact"
                              showIcon={false}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="itemMemo">메모 (선택사항)</Label>
                            <Textarea
                              id="itemMemo"
                              placeholder="지급 메모를 입력하세요..."
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              const textarea = document.getElementById('itemMemo') as HTMLTextAreaElement
                              handlePaymentToggle(item.id, true, textarea?.value || undefined)
                            }}
                            disabled={updating}
                          >
                            {updating ? '처리 중...' : '지급 완료'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * 정산별 일괄 지급 관리 컴포넌트
 */
interface SettlementPaymentManagerProps {
  settlementId: string
  className?: string
}

export function SettlementPaymentManager({
  settlementId,
  className
}: SettlementPaymentManagerProps) {
  const [updating, setUpdating] = useState(false)
  const [memo, setMemo] = useState('')

  const handleMarkSettlementAsPaid = async () => {
    try {
      setUpdating(true)
      const result = await markSettlementAsPaid(settlementId, memo)

      if (result.success) {
        toast.success(`${result.updated}건이 지급 완료 처리되었습니다`)
        setMemo('')
        // 부모 컴포넌트에서 새로고침 필요
        window.location.reload()
      } else {
        toast.error(result.error || '일괄 지급 완료 처리 실패')
      }
    } catch (error) {
      console.error('정산 완료 처리 실패:', error)
      toast.error('정산 완료 처리 중 오류가 발생했습니다')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-5 w-5 text-primary" />
          정산 일괄 완료
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <div className="text-sm font-medium text-amber-800">
                정산 일괄 완료 처리
              </div>
              <div className="text-sm text-amber-700 mt-1">
                이 정산의 모든 미지급 항목을 한번에 지급 완료 처리합니다.
                이 작업은 되돌릴 수 없습니다.
              </div>
            </div>
          </div>
        </div>

        <div>
          <Label htmlFor="settlementMemo">지급 메모</Label>
          <Textarea
            id="settlementMemo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="전체 지급 완료 메모를 입력하세요..."
            className="mt-1"
          />
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-full" disabled={updating}>
              <CheckCircle className="h-4 w-4 mr-2" />
              정산 전체 지급 완료
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>정산 전체 지급 완료</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-700">
                    <div className="font-medium">주의: 이 작업은 되돌릴 수 없습니다</div>
                    <div className="mt-1">
                      이 정산의 모든 미지급 항목이 지급 완료로 처리됩니다.
                    </div>
                  </div>
                </div>
              </div>
              {memo && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">메모</div>
                  <div className="text-sm text-muted-foreground mt-1">{memo}</div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                onClick={handleMarkSettlementAsPaid}
                disabled={updating}
              >
                {updating ? '처리 중...' : '확인 - 전체 지급 완료'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}