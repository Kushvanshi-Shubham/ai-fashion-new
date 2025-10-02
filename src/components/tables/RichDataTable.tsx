'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  Edit3, 
  Check, 
  X, 
  Download, 
  RefreshCw,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  Clock,
  Search,
  MoreHorizontal
} from 'lucide-react'
import { ExtractionResult, AttributeDetail, isCompletedExtraction } from '@/types/fashion'

interface RichDataTableProps {
  results: ExtractionResult[]
  onRetry?: ((resultId: string) => void) | undefined
  onDownload?: ((result: ExtractionResult) => void) | undefined
  onAttributeEdit?: ((resultId: string, attributeKey: string, newValue: string | null) => void) | undefined
  onImageClick?: ((imageUrl: string, fileName?: string) => void) | undefined
  selectedRows?: string[]
  onSelectionChange?: ((selectedIds: string[]) => void) | undefined
  className?: string
}

interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

interface FilterConfig {
  status: 'all' | 'completed' | 'failed' | 'pending' | 'processing'
  confidence: 'all' | 'high' | 'medium' | 'low'
  search: string
}

export const RichDataTable: React.FC<RichDataTableProps> = ({
  results,
  onRetry,
  onDownload,
  onAttributeEdit,
  onImageClick,
  selectedRows = [],
  onSelectionChange,
  className = ''
}) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' })
  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    status: 'all',
    confidence: 'all',
    search: ''
  })
  const [editingCell, setEditingCell] = useState<{resultId: string, attributeKey: string} | null>(null)
  const [editValue, setEditValue] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Get all unique attribute keys from completed results
  const attributeKeys = useMemo(() => {
    const keys = new Set<string>()
    results.forEach(result => {
      if (isCompletedExtraction(result)) {
        Object.keys(result.attributes).forEach(key => keys.add(key))
      }
    })
    return Array.from(keys).sort()
  }, [results])

  // Filter and sort results
  const processedResults = useMemo(() => {
    const filtered = results.filter(result => {
      // Status filter
      if (filterConfig.status !== 'all' && result.status !== filterConfig.status) {
        return false
      }

      // Confidence filter
      if (filterConfig.confidence !== 'all' && isCompletedExtraction(result)) {
        const confidence = result.confidence
        switch (filterConfig.confidence) {
          case 'high':
            if (confidence < 80) return false
            break
          case 'medium':
            if (confidence < 60 || confidence >= 80) return false
            break
          case 'low':
            if (confidence >= 60) return false
            break
        }
      }

      // Search filter
      if (filterConfig.search && !result.fileName.toLowerCase().includes(filterConfig.search.toLowerCase())) {
        return false
      }

      return true
    })

    // Sort results
    filtered.sort((a, b) => {
      let aValue: string | number | Date = a[sortConfig.key as keyof ExtractionResult] as string | number | Date
      let bValue: string | number | Date = b[sortConfig.key as keyof ExtractionResult] as string | number | Date

      // Handle special sorting cases
      if (sortConfig.key === 'confidence') {
        aValue = isCompletedExtraction(a) ? a.confidence : -1
        bValue = isCompletedExtraction(b) ? b.confidence : -1
      } else if (sortConfig.key === 'createdAt') {
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [results, sortConfig, filterConfig])

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Handle row selection
  const handleRowSelect = (resultId: string) => {
    if (!onSelectionChange) return

    const newSelection = selectedRows.includes(resultId)
      ? selectedRows.filter(id => id !== resultId)
      : [...selectedRows, resultId]
    
    onSelectionChange(newSelection)
  }

  const handleSelectAll = () => {
    if (!onSelectionChange) return

    const allIds = processedResults.map(r => r.id)
    onSelectionChange(selectedRows.length === allIds.length ? [] : allIds)
  }

  // Handle inline editing
  const startEdit = (resultId: string, attributeKey: string, currentValue: string | null) => {
    setEditingCell({ resultId, attributeKey })
    setEditValue(currentValue || '')
  }

  const saveEdit = () => {
    if (!editingCell || !onAttributeEdit) return

    onAttributeEdit(editingCell.resultId, editingCell.attributeKey, editValue || null)
    setEditingCell(null)
    setEditValue('')
  }

  const cancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  // Handle row expansion
  const toggleRowExpansion = (resultId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(resultId)) {
        next.delete(resultId)
      } else {
        next.add(resultId)
      }
      return next
    })
  }

  return (
    <div className={`surface border-border/60 ${className}`}>
      {/* Header & Filters */}
      <div className="p-6 border-b border-border/60 bg-card/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <h3 className="text-md font-semibold tracking-tight text-foreground">Extraction Results</h3>
          <div className="text-xs text-muted-foreground">
            {processedResults.length} of {results.length} results
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-medium tracking-wide text-muted-foreground uppercase mb-1">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
              <input
                type="text"
                placeholder="Search files..."
                value={filterConfig.search}
                onChange={(e) => setFilterConfig(prev => ({ ...prev, search: e.target.value }))}
                className="input-base pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium tracking-wide text-muted-foreground uppercase mb-1">Status</label>
            <select
              value={filterConfig.status}
              onChange={(e) => setFilterConfig(prev => ({ ...prev, status: e.target.value as FilterConfig['status'] }))}
              className="input-base"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-medium tracking-wide text-muted-foreground uppercase mb-1">Confidence</label>
            <select
              value={filterConfig.confidence}
              onChange={(e) => setFilterConfig(prev => ({ ...prev, confidence: e.target.value as FilterConfig['confidence'] }))}
              className="input-base"
            >
              <option value="all">All Confidence</option>
              <option value="high">High (80%+)</option>
              <option value="medium">Medium (60-79%)</option>
              <option value="low">Low (&lt;60%)</option>
            </select>
          </div>

          <div className="flex items-end">
            {onSelectionChange && (
              <button
                onClick={handleSelectAll}
                className="btn-outline-accent text-primary hover:bg-primary/10"
              >
                {selectedRows.length === processedResults.length ? 'Deselect All' : 'Select All'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {onSelectionChange && (
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.length === processedResults.length && processedResults.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 accent-primary focus:ring-ring"
                  />
                </th>
              )}
              <th className="w-12 px-4 py-3"></th>
              
              {/* Sortable columns */}
              <TableHeader label="File" sortKey="fileName" sortConfig={sortConfig} onSort={handleSort} />
              <TableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} />
              <TableHeader label="Confidence" sortKey="confidence" sortConfig={sortConfig} onSort={handleSort} />
              <TableHeader label="Created" sortKey="createdAt" sortConfig={sortConfig} onSort={handleSort} />
              
              {/* Attribute columns - show first 5, rest in expanded view */}
              {attributeKeys.slice(0, 5).map(key => (
                <th key={key} className="px-4 py-3 text-left text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {key.replace(/_/g, ' ')}
                </th>
              ))}
              
              <th className="w-20 px-4 py-3 text-right text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="divide-y divide-border/60">
            <AnimatePresence>
              {processedResults.map((result) => (
                <ResultRow
                  key={result.id}
                  result={result}
                  attributeKeys={attributeKeys}
                  isSelected={selectedRows.includes(result.id)}
                  isExpanded={expandedRows.has(result.id)}
                  editingCell={editingCell}
                  editValue={editValue}
                  onSelect={() => handleRowSelect(result.id)}
                  onToggleExpand={() => toggleRowExpansion(result.id)}
                  onStartEdit={startEdit}
                  onSaveEdit={saveEdit}
                  onCancelEdit={cancelEdit}
                  onEditValueChange={setEditValue}
                  onRetry={onRetry}
                  onDownload={onDownload}
                  onImageClick={onImageClick}
                  showSelection={!!onSelectionChange}
                />
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {processedResults.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-sm text-muted-foreground mb-1">No extraction results found</p>
          <p className="text-xs text-muted-foreground/70">
            {results.length === 0 
              ? 'Start by uploading images and running extraction'
              : 'Try adjusting your filters'}
          </p>
        </div>
      )}
    </div>
  )
}

interface TableHeaderProps {
  label: string
  sortKey: string
  sortConfig: SortConfig
  onSort: (key: string) => void
}

const TableHeader: React.FC<TableHeaderProps> = ({ label, sortKey, sortConfig, onSort }) => {
  const isActive = sortConfig.key === sortKey
  
  return (
    <th 
      className="px-4 py-3 text-left text-[10px] font-medium tracking-wide text-muted-foreground uppercase cursor-pointer hover:bg-muted/70 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        {isActive ? (
          sortConfig.direction === 'asc' ? 
          <ChevronUp className="w-4 h-4" /> : 
          <ChevronDown className="w-4 h-4" />
        ) : (
          <div className="w-4 h-4" />
        )}
      </div>
    </th>
  )
}

interface ResultRowProps {
  result: ExtractionResult
  attributeKeys: string[]
  isSelected: boolean
  isExpanded: boolean
  editingCell: {resultId: string, attributeKey: string} | null
  editValue: string
  showSelection: boolean
  onSelect: () => void
  onToggleExpand: () => void
  onStartEdit: (resultId: string, attributeKey: string, currentValue: string | null) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditValueChange: (value: string) => void
  onRetry?: ((resultId: string) => void) | undefined
  onDownload?: ((result: ExtractionResult) => void) | undefined
  onImageClick?: ((imageUrl: string, fileName?: string) => void) | undefined
}

const ResultRow: React.FC<ResultRowProps> = ({
  result,
  attributeKeys,
  isSelected,
  isExpanded,
  editingCell,
  editValue,
  showSelection,
  onSelect,
  onToggleExpand,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange,
  onRetry,
  onDownload,
  onImageClick
}) => {
  const StatusIcon = ({ status }: { status: ExtractionResult['status'] }) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`${isSelected ? 'data-[selected=true]' : ''}`}
      >
        {showSelection && (
          <td className="px-4 py-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="w-4 h-4 accent-primary focus:ring-ring"
            />
          </td>
        )}
        
        <td className="px-4 py-4">
          <button
            onClick={onToggleExpand}
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </td>

        <td className="px-4 py-4">
          <div className="flex items-center space-x-2">
            {onImageClick && (
              <button
                onClick={() => onImageClick('', result.fileName)}
                className="text-primary hover:text-primary/80"
              >
                <ImageIcon className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="text-sm font-medium text-foreground truncate max-w-xs">
                {result.fileName}
              </div>
              <div className="text-[10px] text-muted-foreground/70">
                {new Date(result.createdAt).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </td>

        <td className="px-4 py-4">
          <div className="flex items-center space-x-2">
            <StatusIcon status={result.status} />
            <span className="text-xs font-medium capitalize status-badge status-${result.status}">{result.status}</span>
          </div>
        </td>

        <td className="px-4 py-4">
          {isCompletedExtraction(result) ? (
            <div className="flex items-center space-x-2">
              <div className={`confidence-pill ${
                result.confidence >= 80 ? 'confidence-high' : result.confidence >= 60 ? 'confidence-medium' : 'confidence-low'
              }`}>{result.confidence}%</div>
            </div>
          ) : (
            <span className="text-muted-foreground/50 text-sm">—</span>
          )}
        </td>

        <td className="px-4 py-4 text-xs text-muted-foreground">
          {new Date(result.createdAt).toLocaleDateString()}
        </td>

        {/* First 5 attribute columns */}
        {attributeKeys.slice(0, 5).map(key => (
          <AttributeCell
            key={key}
            resultId={result.id}
            attributeKey={key}
            attribute={isCompletedExtraction(result) ? result.attributes[key] : undefined}
            isEditing={editingCell?.resultId === result.id && editingCell?.attributeKey === key}
            editValue={editValue}
            onStartEdit={onStartEdit}
            onSaveEdit={onSaveEdit}
            onCancelEdit={onCancelEdit}
            onEditValueChange={onEditValueChange}
          />
        ))}

        <td className="px-4 py-4 text-right">
          <div className="flex items-center justify-end space-x-2">
            {result.status === 'failed' && onRetry && (
              <button
                onClick={() => onRetry(result.id)}
                className="text-primary hover:text-primary/80"
                title="Retry extraction"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
            {onDownload && (
              <button
                onClick={() => onDownload(result)}
                className="text-success hover:text-success/80"
                title="Download result"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
            <button className="text-muted-foreground/50 hover:text-foreground">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </td>
      </motion.tr>

      {/* Expanded row showing all attributes */}
      {isExpanded && (
        <motion.tr
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-muted/50"
        >
          <td colSpan={8 + (showSelection ? 1 : 0)} className="px-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {attributeKeys.map(key => {
                const attribute = isCompletedExtraction(result) ? result.attributes[key] : undefined
                return (
                  <div key={key} className="border border-border/60 rounded-md p-3 bg-card/50 backdrop-blur-sm">
                    <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <AttributeCell
                      resultId={result.id}
                      attributeKey={key}
                      attribute={attribute}
                      isEditing={editingCell?.resultId === result.id && editingCell?.attributeKey === key}
                      editValue={editValue}
                      onStartEdit={onStartEdit}
                      onSaveEdit={onSaveEdit}
                      onCancelEdit={onCancelEdit}
                      onEditValueChange={onEditValueChange}
                      fullWidth
                    />
                  </div>
                )
              })}
            </div>
          </td>
        </motion.tr>
      )}
    </>
  )
}

interface AttributeCellProps {
  resultId: string
  attributeKey: string
  attribute?: AttributeDetail | undefined
  isEditing: boolean
  editValue: string
  fullWidth?: boolean
  onStartEdit: (resultId: string, attributeKey: string, currentValue: string | null) => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onEditValueChange: (value: string) => void
}

const AttributeCell: React.FC<AttributeCellProps> = ({
  resultId,
  attributeKey,
  attribute,
  isEditing,
  editValue,
  fullWidth = false,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onEditValueChange
}) => {
  if (!attribute) {
    return (
      <td className={`px-4 py-4 ${fullWidth ? '' : 'max-w-xs'}`}>
        <span className="text-muted-foreground/40 text-sm">—</span>
      </td>
    )
  }

  if (isEditing) {
    return (
      <td className={`px-4 py-4 ${fullWidth ? '' : 'max-w-xs'}`}>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={editValue}
            onChange={(e) => onEditValueChange(e.target.value)}
            className="input-base px-2 py-1 h-8"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') onSaveEdit()
              if (e.key === 'Escape') onCancelEdit()
            }}
          />
          <button
            onClick={onSaveEdit}
            className="text-success hover:text-success/80"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={onCancelEdit}
            className="text-destructive hover:text-destructive/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </td>
    )
  }

  return (
    <td className={`px-4 py-4 ${fullWidth ? '' : 'max-w-xs'}`}>
      <div 
        className="group cursor-pointer cell-editable"
        onClick={() => onStartEdit(resultId, attributeKey, attribute.value)}
      >
        <div className="flex items-center space-x-2">
          <span className={`text-sm ${attribute.value ? 'text-foreground' : 'text-muted-foreground/40'} truncate`}>
            {attribute.value || '—'}
          </span>
          <Edit3 className="w-3 h-3 cell-edit-icon" />
        </div>
        {attribute.confidence !== undefined && (
          <div className="text-[10px] text-muted-foreground/60 mt-1">
            {attribute.confidence}% confidence
          </div>
        )}
      </div>
    </td>
  )
}