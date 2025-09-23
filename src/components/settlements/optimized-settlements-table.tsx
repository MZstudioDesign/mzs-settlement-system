'use client'

import React, { useMemo, useCallback, memo } from 'react'
import { ColumnDef } from '@tanstack/react-table'
import { VirtualTable, createColumn, createCell } from '@/components/ui/virtual-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Calendar,
  Users,
  Activity,
  MoreHorizontal,
  Eye,
  Edit,
  Download,
  FileText,
  Check,
  CheckCircle,
} from 'lucide-react'
import { useUpdatePaymentStatus, useUpdateSettlementStatus } from '@/hooks/use-settlements'
import type { Settlement, SettlementItem } from '@/hooks/use-settlements'

// 성능 최적화된 통화 포맷터
const currencyFormatter = new Intl.NumberFormat('ko-KR', {
  style: 'currency',
  currency: 'KRW',
  minimumFractionDigits: 0
})

const formatCurrency = (amount: number) => currencyFormatter.format(amount)

// 메모화된 상태 라벨 및 색상
const statusLabels = {
  DRAFT: '초안',
  PENDING: '승인 대기',
  COMPLETED: '완료',
  CANCELLED: '취소'
} as const

const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800'
} as const

// 메모화된 멤버 아바타 컴포넌트
const MemberAvatar = memo(({ name, code }: { name: string; code: string }) => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
      {code}
    </div>
    <span className="font-medium">{name}</span>
  </div>
))

MemberAvatar.displayName = 'MemberAvatar'

// 메모화된 상태 배지 컴포넌트
const StatusBadge = memo(({ status }: { status: Settlement['status'] }) => (
  <Badge variant="secondary" className={statusColors[status]}>
    {statusLabels[status]}
  </Badge>
))

StatusBadge.displayName = 'StatusBadge'

// 메모화된 지급 상태 컴포넌트
const PaymentStatus = memo(({
  item,
  onToggle
}: {
  item: SettlementItem;
  onToggle: (itemId: string) => void;
}) => (
  <div className="flex items-center gap-2">
    <Switch
      checked={item.paid}
      onCheckedChange={() => onToggle(item.id)}
    />
    <Badge
      variant="secondary"
      className={item.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
    >
      {item.paid ? '지급완료' : '지급대기'}
    </Badge>
    {item.paid && item.paid_date && (
      <div className="text-xs text-muted-foreground mt-1">
        {new Date(item.paid_date).toLocaleDateString('ko-KR')}
      </div>
    )}
  </div>
))

PaymentStatus.displayName = 'PaymentStatus'

// 정산 목록 테이블 컴포넌트
interface OptimizedSettlementsTableProps {
  data: Settlement[]
  onRowClick?: (settlement: Settlement) => void
  onStatusUpdate?: (settlementId: string, status: Settlement['status']) => void
}

export const OptimizedSettlementsTable = memo(({
  data,
  onRowClick,
  onStatusUpdate
}: OptimizedSettlementsTableProps) => {
  const updateSettlementStatusMutation = useUpdateSettlementStatus()

  const handleStatusUpdate = useCallback((settlementId: string, status: Settlement['status']) => {
    updateSettlementStatusMutation.mutate({ settlementId, status })
    onStatusUpdate?.(settlementId, status)
  }, [updateSettlementStatusMutation, onStatusUpdate])

  const handleRowClick = useCallback((settlement: Settlement) => {
    onRowClick?.(settlement)
  }, [onRowClick])

  // 메모화된 컬럼 정의
  const columns = useMemo<ColumnDef<Settlement>[]>(() => [
    createColumn({
      id: 'ym',
      header: '정산 월',
      cell: createCell((settlement: Settlement) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{settlement.ym}</span>
        </div>
      )),
      size: 150,
    }),
    createColumn({
      id: 'note',
      header: '메모',
      cell: createCell((settlement: Settlement) => (
        <span className="max-w-48 truncate">{settlement.note}</span>
      )),
      size: 200,
    }),
    createColumn({
      id: 'status',
      header: '상태',
      cell: createCell((settlement: Settlement) => (
        <StatusBadge status={settlement.status} />
      )),
      size: 120,
    }),
    createColumn({
      id: 'created_at',
      header: '생성일',
      cell: createCell((settlement: Settlement) => (
        <span className="font-mono text-sm">
          {new Date(settlement.created_at).toLocaleDateString('ko-KR')}
        </span>
      )),
      size: 120,
    }),
    createColumn({
      id: 'total_amount',
      header: '총 매출',
      cell: createCell((settlement: Settlement) => (
        <span className="font-mono">{formatCurrency(settlement.total_amount)}</span>
      )),
      size: 140,
    }),
    createColumn({
      id: 'settled_amount',
      header: '정산 금액',
      cell: createCell((settlement: Settlement) => (
        <span className="font-mono">{formatCurrency(settlement.settled_amount)}</span>
      )),
      size: 140,
    }),
    createColumn({
      id: 'member_count',
      header: '대상 인원',
      cell: createCell((settlement: Settlement) => (
        <div className="flex items-center gap-1">
          <Users className="h-4 w-4 text-muted-foreground" />
          {settlement.member_count}명
        </div>
      )),
      size: 100,
    }),
    createColumn({
      id: 'item_count',
      header: '항목 수',
      cell: createCell((settlement: Settlement) => (
        <div className="flex items-center gap-1">
          <Activity className="h-4 w-4 text-muted-foreground" />
          {settlement.item_count}개
        </div>
      )),
      size: 100,
    }),
    createColumn({
      id: 'actions',
      header: '',
      cell: createCell((settlement: Settlement) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>작업</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleRowClick(settlement)}>
              <Eye className="h-4 w-4 mr-2" />
              상세보기
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              편집
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Download className="h-4 w-4 mr-2" />
              PDF 내보내기
            </DropdownMenuItem>
            <DropdownMenuItem>
              <FileText className="h-4 w-4 mr-2" />
              CSV 내보내기
            </DropdownMenuItem>
            {settlement.status === 'DRAFT' && (
              <DropdownMenuItem onClick={() => handleStatusUpdate(settlement.id, 'PENDING')}>
                <Check className="h-4 w-4 mr-2" />
                승인 대기로 변경
              </DropdownMenuItem>
            )}
            {settlement.status === 'PENDING' && (
              <DropdownMenuItem onClick={() => handleStatusUpdate(settlement.id, 'COMPLETED')}>
                <CheckCircle className="h-4 w-4 mr-2" />
                완료 처리
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )),
      size: 60,
    }),
  ], [handleRowClick, handleStatusUpdate])

  return (
    <VirtualTable
      data={data}
      columns={columns}
      onRowClick={handleRowClick}
      height={600}
      estimateSize={60}
      className="border rounded-md"
    />
  )
})

OptimizedSettlementsTable.displayName = 'OptimizedSettlementsTable'

// 정산 항목 테이블 컴포넌트
interface OptimizedSettlementItemsTableProps {
  data: SettlementItem[]
  height?: number
}

export const OptimizedSettlementItemsTable = memo(({
  data,
  height = 500
}: OptimizedSettlementItemsTableProps) => {
  const updatePaymentStatusMutation = useUpdatePaymentStatus()

  const handleTogglePaid = useCallback((itemId: string) => {
    const item = data.find(item => item.id === itemId)
    if (item) {
      updatePaymentStatusMutation.mutate({
        itemId,
        paid: !item.paid
      })
    }
  }, [data, updatePaymentStatusMutation])

  // 메모화된 컬럼 정의
  const columns = useMemo<ColumnDef<SettlementItem>[]>(() => [
    createColumn({
      id: 'member',
      header: '팀원',
      cell: createCell((item: SettlementItem) => (
        <MemberAvatar
          name={item.member?.name || '알 수 없음'}
          code={item.member?.code || 'N/A'}
        />
      )),
      size: 150,
    }),
    createColumn({
      id: 'designer_amount',
      header: '디자인',
      cell: createCell((item: SettlementItem) => (
        <span className="font-mono text-sm">{formatCurrency(item.designer_amount)}</span>
      )),
      size: 120,
    }),
    createColumn({
      id: 'contact_amount',
      header: '컨택',
      cell: createCell((item: SettlementItem) => (
        <span className="font-mono text-sm">{formatCurrency(item.contact_amount)}</span>
      )),
      size: 100,
    }),
    createColumn({
      id: 'feed_amount',
      header: '피드',
      cell: createCell((item: SettlementItem) => (
        <span className="font-mono text-sm">{formatCurrency(item.feed_amount)}</span>
      )),
      size: 100,
    }),
    createColumn({
      id: 'team_amount',
      header: '팀업무',
      cell: createCell((item: SettlementItem) => (
        <span className="font-mono text-sm">{formatCurrency(item.team_amount)}</span>
      )),
      size: 100,
    }),
    createColumn({
      id: 'designer_bonus_amount',
      header: '보너스',
      cell: createCell((item: SettlementItem) => (
        <span className="font-mono text-sm">{formatCurrency(item.designer_bonus_amount)}</span>
      )),
      size: 100,
    }),
    createColumn({
      id: 'amount_before_withholding',
      header: '원천전',
      cell: createCell((item: SettlementItem) => (
        <span className="font-mono text-sm font-medium">
          {formatCurrency(item.amount_before_withholding)}
        </span>
      )),
      size: 120,
    }),
    createColumn({
      id: 'withholding_3_3',
      header: '원천징수',
      cell: createCell((item: SettlementItem) => (
        <span className="font-mono text-sm text-red-600">
          -{formatCurrency(item.withholding_3_3)}
        </span>
      )),
      size: 120,
    }),
    createColumn({
      id: 'amount_after_withholding',
      header: '실지급',
      cell: createCell((item: SettlementItem) => (
        <span className="font-mono text-sm font-bold text-green-600">
          {formatCurrency(item.amount_after_withholding)}
        </span>
      )),
      size: 120,
    }),
    createColumn({
      id: 'payment_status',
      header: '지급상태',
      cell: createCell((item: SettlementItem) => (
        <PaymentStatus item={item} onToggle={handleTogglePaid} />
      )),
      size: 150,
    }),
    createColumn({
      id: 'memo',
      header: '메모',
      cell: createCell((item: SettlementItem) => (
        <span className="max-w-32 truncate text-xs">{item.memo || '-'}</span>
      )),
      size: 100,
    }),
  ], [handleTogglePaid])

  return (
    <VirtualTable
      data={data}
      columns={columns}
      height={height}
      estimateSize={65}
      className="border rounded-md"
      emptyMessage="정산 항목이 없습니다"
    />
  )
})

OptimizedSettlementItemsTable.displayName = 'OptimizedSettlementItemsTable'