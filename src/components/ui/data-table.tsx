'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  ChevronsUpDown,
  Search,
  Filter,
  Download,
  RefreshCw,
  Settings
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingSpinner } from '@/components/ui/loading'
import { cn } from '@/lib/utils'

interface TableColumn<T> {
  key: keyof T | 'actions'
  header: string
  sortable?: boolean
  filterable?: boolean
  width?: string
  render?: (item: T, index: number) => React.ReactNode
  headerRender?: () => React.ReactNode
}

interface DataTableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  title?: string
  description?: string
  loading?: boolean
  error?: string | null
  searchable?: boolean
  filterable?: boolean
  selectable?: boolean
  exportable?: boolean
  refreshable?: boolean
  pageSize?: number
  onRefresh?: () => void
  onExport?: (selectedItems: T[]) => void
  onRowClick?: (item: T, index: number) => void
  getRowKey?: (item: T, index: number) => string
  emptyState?: {
    title: string
    description?: string
    icon?: React.ReactNode
    action?: { label: string; onClick: () => void }
  }
  className?: string
}

interface SortConfig {
  key: string
  direction: 'asc' | 'desc' | null
}

export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  title,
  description,
  loading = false,
  error = null,
  searchable = true,
  filterable = true,
  selectable = false,
  exportable = false,
  refreshable = false,
  pageSize = 10,
  onRefresh,
  onExport,
  onRowClick,
  getRowKey = (item, index) => `row-${index}`,
  emptyState = { title: 'No data', description: 'No data available to display' },
  className
}: DataTableProps<T>) {
  const [search, setSearch] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: '', direction: null })
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.key as string))
  )

  // Filter and search data
  const filteredData = useMemo(() => {
    return data.filter(item => {
      if (!search) return true
      
      return Object.values(item).some(value => 
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    })
  }, [data, search])

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return filteredData

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortConfig.key] as string | number
      const bValue = b[sortConfig.key] as string | number
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortConfig])

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize])

  const totalPages = Math.ceil(sortedData.length / pageSize)
  const visibleColumnsArray = columns.filter(col => visibleColumns.has(col.key as string))

  const handleSort = useCallback((key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedItems.size === paginatedData.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(paginatedData.map((item, index) => getRowKey(item, index))))
    }
  }, [selectedItems, paginatedData, getRowKey])

  const handleSelectItem = useCallback((key: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(key)) {
      newSelection.delete(key)
    } else {
      newSelection.add(key)
    }
    setSelectedItems(newSelection)
  }, [selectedItems])

  const getSortIcon = (columnKey: string) => {
    if (sortConfig.key !== columnKey) return <ChevronsUpDown className="w-4 h-4 opacity-50" />
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
  }

  if (error) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <ErrorState 
            message={error} 
            {...(onRefresh && { onRetry: onRefresh })}
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("w-full", className)}>
      {(title || description) && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              {title && <CardTitle className="text-xl font-semibold">{title}</CardTitle>}
              {description && <p className="text-muted-foreground mt-1">{description}</p>}
            </div>
            <div className="flex items-center gap-2">
              {refreshable && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
              )}
              {exportable && selectedItems.size > 0 && (
                <Button variant="outline" size="sm" onClick={() => {
                  const selected = data.filter((item, index) => 
                    selectedItems.has(getRowKey(item, index))
                  )
                  onExport?.(selected)
                }}>
                  <Download className="w-4 h-4 mr-2" />
                  Export ({selectedItems.size})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        {/* Toolbar */}
        <div className="p-6 pb-4 border-b bg-muted/30">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              {searchable && (
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              )}
              
              {filterable && (
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">
                {sortedData.length} {sortedData.length === 1 ? 'item' : 'items'}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {columns.map(col => (
                    <DropdownMenuCheckboxItem
                      key={col.key as string}
                      checked={visibleColumns.has(col.key as string)}
                      onCheckedChange={(checked) => {
                        const newVisible = new Set(visibleColumns)
                        if (checked) {
                          newVisible.add(col.key as string)
                        } else {
                          newVisible.delete(col.key as string)
                        }
                        setVisibleColumns(newVisible)
                      }}
                    >
                      {col.header}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="relative overflow-hidden">
          {loading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}
          
          {sortedData.length === 0 && !loading ? (
            <div className="p-12">
              <EmptyState
                title={emptyState.title}
                description={emptyState.description || ''}
                icon={emptyState.icon}
                {...(emptyState.action && { action: emptyState.action })}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    {selectable && (
                      <th className="w-12 px-6 py-4 text-left">
                        <Checkbox
                          checked={selectedItems.size === paginatedData.length && paginatedData.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </th>
                    )}
                    {visibleColumnsArray.map((column) => (
                      <th
                        key={column.key as string}
                        className={cn(
                          "px-6 py-4 text-left font-medium text-muted-foreground",
                          column.width && column.width,
                          column.sortable && "cursor-pointer hover:text-foreground transition-colors"
                        )}
                        onClick={column.sortable ? () => handleSort(column.key as string) : undefined}
                      >
                        <div className="flex items-center gap-2">
                          {column.headerRender ? column.headerRender() : column.header}
                          {column.sortable && getSortIcon(column.key as string)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {paginatedData.map((item, index) => {
                      const rowKey = getRowKey(item, index)
                      const isSelected = selectedItems.has(rowKey)
                      
                      return (
                        <motion.tr
                          key={rowKey}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className={cn(
                            "border-b hover:bg-muted/50 transition-colors",
                            isSelected && "bg-muted/30",
                            onRowClick && "cursor-pointer"
                          )}
                          onClick={() => onRowClick?.(item, index)}
                        >
                          {selectable && (
                            <td className="px-6 py-4">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleSelectItem(rowKey)}
                                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                              />
                            </td>
                          )}
                          {visibleColumnsArray.map((column) => (
                            <td
                              key={column.key as string}
                              className="px-6 py-4 text-sm"
                            >
                              {column.render ? 
                                column.render(item, index) : 
                                String(item[column.key] || '-')
                              }
                            </td>
                          ))}
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 pt-4 border-t bg-muted/30 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    Math.abs(page - currentPage) <= 2
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-muted-foreground">...</span>
                      )}
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  ))}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}