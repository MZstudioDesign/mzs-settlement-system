'use client'

import { useMemo, useCallback, memo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type Table as TanStackTable,
} from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface VirtualTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData, any>[]
  estimateSize?: number
  className?: string
  onRowClick?: (row: TData) => void
}

function VirtualTableComponent<TData>({
  data,
  columns,
  estimateSize = 60,
  className,
  onRowClick,
}: VirtualTableProps<TData>) {
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Memoize table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  // Get table rows
  const { rows } = table.getRowModel()

  // Virtualization
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => estimateSize,
    overscan: 10, // Render 10 items outside viewport
  })

  // Memoized row click handler
  const handleRowClick = useCallback(
    (row: TData) => {
      onRowClick?.(row)
    },
    [onRowClick]
  )

  // Memoized virtual items
  const virtualItems = rowVirtualizer.getVirtualItems()

  return (
    <div className={cn('relative overflow-auto', className)}>
      <div
        ref={tableContainerRef}
        className="h-[600px] overflow-auto border rounded-md"
      >
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {virtualItems.length > 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: 'relative',
                  }}
                >
                  {virtualItems.map((virtualRow) => {
                    const row = rows[virtualRow.index]
                    return (
                      <TableRow
                        key={row.id}
                        className={cn(
                          'absolute flex w-full hover:bg-muted/50',
                          onRowClick && 'cursor-pointer'
                        )}
                        style={{
                          height: `${virtualRow.size}px`,
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        onClick={() =>
                          onRowClick && handleRowClick(row.original)
                        }
                      >
                        {row.getVisibleCells().map((cell) => (
                          <TableCell
                            key={cell.id}
                            className="flex items-center"
                            style={{ width: cell.column.getSize() }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    )
                  })}
                </td>
              </tr>
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

// Memoize the component for better performance
export const VirtualTable = memo(VirtualTableComponent) as typeof VirtualTableComponent

// Performance-optimized column helper
export const createColumn = <TData, TValue = unknown>(
  columnDef: ColumnDef<TData, TValue>
): ColumnDef<TData, TValue> => {
  return {
    ...columnDef,
    // Enable sorting by default
    enableSorting: columnDef.enableSorting ?? true,
    // Enable resizing by default
    enableResizing: columnDef.enableResizing ?? true,
  }
}

// Optimized cell renderer for performance
export const createCell = <TData,>(
  accessor: (row: TData) => React.ReactNode
) => {
  return memo(({ row }: { row: { original: TData } }) => {
    return <>{accessor(row.original)}</>
  })
}