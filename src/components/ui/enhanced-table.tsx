'use client'

import { ReactNode, memo } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface Column<T> {
  key: keyof T | 'actions'
  label: string
  width?: string
  minWidth?: string
  sortable?: boolean
  render?: (value: any, item: T) => ReactNode
  className?: string
  ariaLabel?: string
}

interface Action<T> {
  label: string
  icon?: ReactNode
  onClick: (item: T) => void
  variant?: 'default' | 'destructive'
  disabled?: (item: T) => boolean
}

interface EnhancedTableProps<T> {
  data: T[]
  columns: Column<T>[]
  actions?: Action<T>[]
  isLoading?: boolean
  emptyState?: ReactNode
  className?: string
  sortBy?: keyof T
  sortDirection?: 'asc' | 'desc'
  onSort?: (column: keyof T) => void
  rowClassName?: (item: T) => string
  ariaLabel?: string
}

function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {children}
    </div>
  )
}

// Memoized table row for performance
const TableRowMemo = memo(function TableRowMemo<T>({
  item,
  columns,
  actions,
  rowClassName
}: {
  item: T
  columns: Column<T>[]
  actions?: Action<T>[]
  rowClassName?: (item: T) => string
}) {
  return (
    <TableRow
      className={cn(
        "hover:bg-muted/50 transition-colors duration-200",
        rowClassName?.(item)
      )}
      role="row"
    >
      {columns.map((column) => (
        <TableCell
          key={String(column.key)}
          className={cn(column.className, column.minWidth && `min-w-[${column.minWidth}]`)}
          style={{ width: column.width }}
          data-label={column.label}
        >
          {column.key === 'actions' ? (
            actions && actions.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    aria-label={`${column.label} 메뉴`}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>작업</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {actions.map((action, actionIndex) => (
                    <DropdownMenuItem
                      key={actionIndex}
                      onClick={() => action.onClick(item)}
                      disabled={action.disabled?.(item)}
                      className={cn(
                        action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                      )}
                    >
                      {action.icon && <span className="mr-2">{action.icon}</span>}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )
          ) : column.render ? (
            column.render(item[column.key as keyof T], item)
          ) : (
            String(item[column.key as keyof T] || '-')
          )}
        </TableCell>
      ))}
    </TableRow>
  )
})

export function EnhancedTable<T extends Record<string, any>>({
  data,
  columns,
  actions,
  isLoading = false,
  emptyState,
  className,
  sortBy,
  sortDirection,
  onSort,
  rowClassName,
  ariaLabel = '데이터 테이블'
}: EnhancedTableProps<T>) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={String(column.key)} className="h-12">
                      <div className="animate-pulse bg-muted rounded h-4 w-20" />
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }, (_, i) => (
                  <TableRow key={i}>
                    {columns.map((column) => (
                      <TableCell key={String(column.key)} className="h-16">
                        <div className="animate-pulse bg-muted rounded h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table role="table" aria-label={ariaLabel}>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead
                    key={String(column.key)}
                    className={cn(
                      column.minWidth && `min-w-[${column.minWidth}]`,
                      column.sortable && 'cursor-pointer select-none hover:bg-muted/50',
                      column.className
                    )}
                    style={{ width: column.width }}
                    onClick={column.sortable && onSort ? () => onSort(column.key as keyof T) : undefined}
                    aria-label={column.ariaLabel || column.label}
                    {...(column.sortable && {
                      'aria-sort': sortBy === column.key
                        ? sortDirection === 'asc' ? 'ascending' : 'descending'
                        : 'none'
                    })}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && (
                        <ArrowUpDown
                          className={cn(
                            "h-4 w-4 transition-colors",
                            sortBy === column.key ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24">
                    {emptyState || (
                      <EmptyState>
                        <p className="text-muted-foreground">데이터가 없습니다</p>
                      </EmptyState>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRowMemo
                    key={item.id || index}
                    item={item}
                    columns={columns}
                    actions={actions}
                    rowClassName={rowClassName}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper function to create table columns
export function createTableColumn<T>(column: Column<T>): Column<T> {
  return column
}

// Helper function to format currency in table cells
export function CurrencyCell({ amount }: { amount: number }) {
  return (
    <span className="font-mono">
      {new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0
      }).format(amount)}
    </span>
  )
}

// Helper function to format date in table cells
export function DateCell({ date }: { date: string }) {
  return (
    <time dateTime={date} className="font-mono text-sm">
      {new Date(date).toLocaleDateString('ko-KR')}
    </time>
  )
}

// Helper function for member avatar in table cells
export function MemberCell({ member }: { member: { name: string; code: string } }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold"
        aria-label={`${member.name} 아바타`}
      >
        {member.code}
      </div>
      <span className="font-medium">{member.name}</span>
    </div>
  )
}

// Helper function for status badges in table cells
export function StatusBadge({
  status,
  variant = 'secondary',
  className
}: {
  status: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  className?: string
}) {
  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  )
}