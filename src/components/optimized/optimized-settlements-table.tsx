'use client'

import { useMemo, memo } from 'react'
import { createColumnHelper } from '@tanstack/react-table'
import { VirtualTable } from '@/components/ui/virtual-table'
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
import { MoreHorizontal, Edit, Calculator } from 'lucide-react'
import { createCurrencyFormatter } from '@/lib/performance'

interface SettlementItem {
  id: string
  member: { name: string; code: string }
  designerAmount: number
  contactAmount: number
  feedAmount: number
  teamAmount: number
  mileageAmount: number
  bonusAmount: number
  totalBeforeWithholding: number
  withholdingAmount: number
  totalAfterWithholding: number
  paid: boolean
  paidDate: string | null
  memo: string
}

interface OptimizedSettlementsTableProps {
  data: SettlementItem[]
  onTogglePaid: (itemId: string) => void
  onEdit: (item: SettlementItem) => void
}

const columnHelper = createColumnHelper<SettlementItem>()

// Memoized components for better performance
const MemberCell = memo(({ member }: { member: { name: string; code: string } }) => (
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
      {member.code}
    </div>
    <span className="font-medium">{member.name}</span>
  </div>
))
MemberCell.displayName = 'MemberCell'

const CurrencyCell = memo(({ amount, className }: { amount: number; className?: string }) => {
  const formatter = createCurrencyFormatter()
  return <span className={`font-mono text-sm ${className || ''}`}>{formatter.format(amount)}</span>
})
CurrencyCell.displayName = 'CurrencyCell'

const PaidStatusCell = memo(({
  item,
  onToggle
}: {
  item: SettlementItem;
  onToggle: (id: string) => void
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
    {item.paid && item.paidDate && (
      <div className="text-xs text-muted-foreground mt-1">
        {new Date(item.paidDate).toLocaleDateString('ko-KR')}
      </div>
    )}
  </div>
))
PaidStatusCell.displayName = 'PaidStatusCell'

const ActionsCell = memo(({
  item,
  onEdit
}: {
  item: SettlementItem;
  onEdit: (item: SettlementItem) => void
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreHorizontal className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuLabel>작업</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onEdit(item)}>
        <Edit className="h-4 w-4 mr-2" />
        메모 편집
      </DropdownMenuItem>
      <DropdownMenuItem>
        <Calculator className="h-4 w-4 mr-2" />
        재계산
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
))
ActionsCell.displayName = 'ActionsCell'

export const OptimizedSettlementsTable = memo<OptimizedSettlementsTableProps>(({
  data,
  onTogglePaid,
  onEdit,
}) => {
  // Memoized columns to prevent recreation on every render
  const columns = useMemo(
    () => [
      columnHelper.accessor('member', {
        header: '팀원',
        size: 150,
        cell: ({ getValue }) => <MemberCell member={getValue()} />,
      }),
      columnHelper.accessor('designerAmount', {
        header: '디자인',
        size: 100,
        cell: ({ getValue }) => <CurrencyCell amount={getValue()} />,
      }),
      columnHelper.accessor('contactAmount', {
        header: '컨택',
        size: 80,
        cell: ({ getValue }) => <CurrencyCell amount={getValue()} />,
      }),
      columnHelper.accessor('feedAmount', {
        header: '피드',
        size: 80,
        cell: ({ getValue }) => <CurrencyCell amount={getValue()} />,
      }),
      columnHelper.accessor('teamAmount', {
        header: '팀업무',
        size: 100,
        cell: ({ getValue }) => <CurrencyCell amount={getValue()} />,
      }),
      columnHelper.accessor('bonusAmount', {
        header: '보너스',
        size: 100,
        cell: ({ getValue }) => <CurrencyCell amount={getValue()} />,
      }),
      columnHelper.accessor('totalBeforeWithholding', {
        header: '원천전',
        size: 120,
        cell: ({ getValue }) => (
          <CurrencyCell amount={getValue()} className="font-medium" />
        ),
      }),
      columnHelper.accessor('withholdingAmount', {
        header: '원천징수',
        size: 100,
        cell: ({ getValue }) => (
          <CurrencyCell amount={getValue()} className="text-red-600" />
        ),
      }),
      columnHelper.accessor('totalAfterWithholding', {
        header: '실지급',
        size: 120,
        cell: ({ getValue }) => (
          <CurrencyCell amount={getValue()} className="font-bold text-green-600" />
        ),
      }),
      columnHelper.display({
        id: 'paidStatus',
        header: '지급상태',
        size: 150,
        cell: ({ row }) => (
          <PaidStatusCell item={row.original} onToggle={onTogglePaid} />
        ),
      }),
      columnHelper.accessor('memo', {
        header: '메모',
        size: 120,
        cell: ({ getValue }) => (
          <span className="max-w-32 truncate text-xs">
            {getValue() || '-'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        size: 50,
        cell: ({ row }) => <ActionsCell item={row.original} onEdit={onEdit} />,
      }),
    ],
    [onTogglePaid, onEdit]
  )

  return (
    <VirtualTable
      data={data}
      columns={columns}
      estimateSize={64} // Estimated row height
      className="w-full"
    />
  )
})

OptimizedSettlementsTable.displayName = 'OptimizedSettlementsTable'