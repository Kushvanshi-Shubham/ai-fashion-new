'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  MoreHorizontal,
  ChevronDown,
  SortAsc,
  SortDesc
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { EmptyState } from '@/components/ui/empty-state'
import { ErrorState } from '@/components/ui/error-state'
import { LoadingSpinner } from '@/components/ui/loading'
import { cn } from '@/lib/utils'

interface CardListItem {
  id: string
  title: string
  description?: string
  metadata?: Record<string, unknown>
  tags?: string[]
  image?: string
  status?: 'active' | 'inactive' | 'pending' | 'error'
  actions?: Array<{
    label: string
    icon?: React.ReactNode
    onClick: () => void
    variant?: 'default' | 'destructive' | 'outline'
  }>
}

interface CardListProps {
  items: CardListItem[]
  title?: string
  description?: string
  loading?: boolean
  error?: string | null
  searchable?: boolean
  filterable?: boolean
  sortable?: boolean
  layout?: 'grid' | 'list'
  gridCols?: 1 | 2 | 3 | 4 | 6
  onSearch?: (query: string) => void
  onFilter?: (filters: Record<string, unknown>) => void
  onSort?: (key: string, direction: 'asc' | 'desc') => void
  onItemClick?: (item: CardListItem) => void
  renderCard?: (item: CardListItem, index: number) => React.ReactNode
  emptyState?: {
    title: string
    description?: string
    icon?: React.ReactNode
    action?: { label: string; onClick: () => void }
  }
  className?: string
}

const StatusBadge: React.FC<{ status: CardListItem['status'] }> = ({ status }) => {
  if (!status) return null
  
  const config = {
    active: { label: 'Active', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
    inactive: { label: 'Inactive', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
    pending: { label: 'Pending', variant: 'outline' as const, className: 'bg-yellow-100 text-yellow-800' },
    error: { label: 'Error', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' }
  }
  
  const { label, className } = config[status]
  
  return <Badge className={cn('text-xs', className)}>{label}</Badge>
}

const DefaultCard: React.FC<{ item: CardListItem; onItemClick?: (item: CardListItem) => void }> = ({ 
  item, 
  onItemClick 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          'h-full transition-all duration-200 hover:shadow-md border-border/50',
          onItemClick && 'cursor-pointer hover:border-border',
        )}
        onClick={() => onItemClick?.(item)}
      >
        {item.image && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <Image 
              src={item.image} 
              alt={item.title}
              width={400}
              height={300}
              className="w-full h-full object-cover transition-transform duration-200 hover:scale-105"
            />
          </div>
        )}
        
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base line-clamp-1 mb-1">{item.title}</CardTitle>
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <StatusBadge status={item.status} />
              
              {item.actions && item.actions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {item.actions.map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation()
                          action.onClick()
                        }}
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
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {item.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {item.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{item.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {item.metadata && Object.keys(item.metadata).length > 0 && (
            <div className="space-y-1">
              {Object.entries(item.metadata).slice(0, 2).map(([key, value]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{key}:</span>
                  <span className="font-mono">{String(value)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

const ListCard: React.FC<{ item: CardListItem; onItemClick?: (item: CardListItem) => void }> = ({ 
  item, 
  onItemClick 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={cn(
          'transition-all duration-200 hover:shadow-sm border-border/50',
          onItemClick && 'cursor-pointer hover:border-border'
        )}
        onClick={() => onItemClick?.(item)}
      >
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {item.image && (
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <Image 
                  src={item.image} 
                  alt={item.title}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={item.status} />
                </div>
              </div>
              
              {item.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{item.description}</p>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {item.tags && item.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline" className="text-xs h-5">
                      {tag}
                    </Badge>
                  ))}
                  {item.tags && item.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs h-5">
                      +{item.tags.length - 2}
                    </Badge>
                  )}
                </div>
                
                {item.actions && item.actions.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {item.actions.map((action, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation()
                            action.onClick()
                          }}
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
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function CardList({
  items,
  title,
  description,
  loading = false,
  error = null,
  searchable = true,
  filterable = false,
  sortable = false,
  layout = 'grid',
  gridCols = 3,
  onSearch,
  onSort,
  onItemClick,
  renderCard,
  emptyState = { title: 'No items', description: 'No items found to display' },
  className
}: CardListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [currentLayout, setCurrentLayout] = useState(layout)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)

  // Filter items based on search
  const filteredItems = useMemo(() => {
    let filtered = items

    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    return filtered
  }, [items, searchQuery])

  // Sort items
  const sortedItems = useMemo(() => {
    if (!sortConfig) return filteredItems

    return [...filteredItems].sort((a, b) => {
      let aValue = a[sortConfig.key as keyof CardListItem]
      let bValue = b[sortConfig.key as keyof CardListItem]

      if (typeof aValue === 'string') aValue = aValue.toLowerCase()
      if (typeof bValue === 'string') bValue = bValue.toLowerCase()

      if (aValue !== undefined && bValue !== undefined) {
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      }
      return 0
    })
  }, [filteredItems, sortConfig])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    onSearch?.(query)
  }

  const handleSort = (key: string) => {
    const direction = sortConfig?.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    setSortConfig({ key, direction })
    onSort?.(key, direction)
  }

  const gridColsClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    6: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
  }

  if (error) {
    return (
      <div className={cn('w-full', className)}>
        <ErrorState message={error} />
      </div>
    )
  }

  return (
    <div className={cn('w-full space-y-6', className)}>
      {/* Header */}
      {(title || description) && (
        <div>
          {title && <h2 className="text-2xl font-bold tracking-tight mb-1">{title}</h2>}
          {description && <p className="text-muted-foreground">{description}</p>}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {searchable && (
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
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
          
          {sortable && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {sortConfig ? (
                    <>
                      {sortConfig.direction === 'asc' ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                      Sort: {sortConfig.key}
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Sort
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => handleSort('title')}>
                  Title
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSort('status')}>
                  Status
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSortConfig(null)}>
                  Clear Sort
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'}
          </Badge>
          
          <div className="flex items-center border rounded-lg">
            <Button
              variant={currentLayout === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none rounded-l-lg"
              onClick={() => setCurrentLayout('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={currentLayout === 'list' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-none rounded-r-lg"
              onClick={() => setCurrentLayout('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {sortedItems.length === 0 && !loading ? (
          <div className="py-12">
            <EmptyState
              title={emptyState.title}
              {...(emptyState.description && { description: emptyState.description })}
              icon={emptyState.icon}
              {...(emptyState.action && { action: emptyState.action })}
            />
          </div>
        ) : (
          <div className={cn(
            currentLayout === 'grid' ? `grid gap-6 ${gridColsClass[gridCols]}` : 'space-y-3'
          )}>
            <AnimatePresence>
              {sortedItems.map((item, index) => (
                <div key={item.id}>
                  {renderCard ? (
                    renderCard(item, index)
                  ) : currentLayout === 'grid' ? (
                    <DefaultCard item={item} {...(onItemClick && { onItemClick })} />
                  ) : (
                    <ListCard item={item} {...(onItemClick && { onItemClick })} />
                  )}
                </div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}