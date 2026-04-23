'use client'

import type { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface DataTablePaginationProps<TData> {
  table: Table<TData>
  totalRows: number
  variant?: 'desktop' | 'mobile'
}

export function DataTablePagination<TData>({ table, totalRows, variant = 'desktop' }: DataTablePaginationProps<TData>) {
  const isMobile = variant === 'mobile'
  const btnSize = isMobile ? 'h-10 w-10' : 'h-8 w-8'
  const textSize = isMobile ? 'text-xs' : 'text-sm'
  const iconSize = 'h-4 w-4'
  const pageText = isMobile
    ? `${table.getState().pagination.pageIndex + 1}/${table.getPageCount()}`
    : `${table.getState().pagination.pageIndex + 1} из ${table.getPageCount()}`
  const countText = isMobile
    ? <><span className="font-medium text-foreground">{totalRows}</span> записей</>
    : <>Всего: <span className="font-medium text-foreground">{totalRows}</span> записей</>

  return (
    <div className={`flex items-center justify-between gap-3 ${isMobile ? 'pt-2' : 'border-t px-4 py-3'}`}>
      <p className={`${textSize} text-muted-foreground`}>{countText}</p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className={btnSize}
          onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
          <ChevronsLeft className={iconSize} />
        </Button>
        <Button variant="outline" size="icon" className={btnSize}
          onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
          <ChevronLeft className={iconSize} />
        </Button>
        <span className={`${textSize} ${isMobile ? 'px-2' : 'px-3'}`}>{pageText}</span>
        <Button variant="outline" size="icon" className={btnSize}
          onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
          <ChevronRight className={iconSize} />
        </Button>
        <Button variant="outline" size="icon" className={btnSize}
          onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
          <ChevronsRight className={iconSize} />
        </Button>
      </div>
    </div>
  )
}
