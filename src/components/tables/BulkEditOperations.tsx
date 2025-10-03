'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Edit3, 
  Download, 
  Trash2, 
  RefreshCw, 
  X,
  Check,
  ChevronDown,
  Users
} from 'lucide-react'
import { ExtractionResult, isCompletedExtraction } from '@/types/fashion'

interface BulkEditOperationsProps {
  selectedResults: ExtractionResult[]
  onBulkEdit: (attribute: string, value: string | null) => void
  onBulkDownload: () => void
  onBulkDelete: () => void
  onBulkRetry: () => void
  onClearSelection: () => void
  className?: string
}

interface BulkEditFormData {
  attribute: string
  value: string
  operation: 'set' | 'clear' | 'append'
}

export const BulkEditOperations: React.FC<BulkEditOperationsProps> = ({
  selectedResults,
  onBulkEdit,
  onBulkDownload,
  onBulkDelete,
  onBulkRetry,
  onClearSelection,
  className = ''
}) => {
  const [showEditForm, setShowEditForm] = useState(false)
  const [editForm, setEditForm] = useState<BulkEditFormData>({
    attribute: '',
    value: '',
    operation: 'set'
  })

  // Get common attributes across selected results
  const commonAttributes = useMemo(() => {
    const attributeSets = selectedResults
      .filter(isCompletedExtraction)
      .map(result => new Set(Object.keys(result.attributes)))
    
    if (attributeSets.length === 0) return []
    
    // Find intersection of all attribute sets
    const intersection = new Set(attributeSets[0])
    if (attributeSets[0] === undefined) return []
    
    for (let i = 1; i < attributeSets.length; i++) {
      const currentSet = attributeSets[i]
      if (!currentSet) continue
      
      for (const attr of intersection) {
        if (!currentSet.has(attr)) {
          intersection.delete(attr)
        }
      }
    }
    
    return Array.from(intersection).sort()
  }, [selectedResults])

  // Statistics about selected items
  const stats = useMemo(() => {
    const completed = selectedResults.filter(r => r.status === 'completed').length
    const failed = selectedResults.filter(r => r.status === 'failed').length
    const processing = selectedResults.filter(r => r.status === 'processing').length
    const pending = selectedResults.filter(r => r.status === 'pending').length
    
    return { completed, failed, processing, pending, total: selectedResults.length }
  }, [selectedResults])

  const handleBulkEdit = () => {
    if (!editForm.attribute || editForm.operation === 'clear') {
      onBulkEdit(editForm.attribute, null)
    } else if (editForm.operation === 'set') {
      onBulkEdit(editForm.attribute, editForm.value)
    } else if (editForm.operation === 'append') {
      // For append, we'll need to handle this in the parent component
      onBulkEdit(editForm.attribute, `APPEND:${editForm.value}`)
    }
    setShowEditForm(false)
    setEditForm({ attribute: '', value: '', operation: 'set' })
  }

  if (selectedResults.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`surface border-gray-200/60 ${className}`}
    >
      <div className="p-4 md:p-5">
        {/* Header with selection info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{stats.total} selected</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {stats.completed > 0 && <span className="status-badge status-completed">{stats.completed} done</span>}
              {stats.failed > 0 && <span className="status-badge status-failed">{stats.failed} failed</span>}
              {stats.processing > 0 && <span className="status-badge status-processing">{stats.processing} processing</span>}
              {stats.pending > 0 && <span className="status-badge status-pending">{stats.pending} pending</span>}
            </div>
          </div>
          <button
            onClick={onClearSelection}
            className="text-muted-foreground/50 hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            disabled={stats.completed === 0}
            className={`flex items-center space-x-2 rounded-md px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors border ${
              stats.completed > 0
                ? 'bg-primary-light/20 text-primary border-primary/30 hover:bg-primary-light/30'
                : 'bg-muted text-muted-foreground/50 cursor-not-allowed border-gray-200/50'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Bulk Edit</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showEditForm ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={onBulkDownload}
            disabled={stats.completed === 0}
            className={`flex items-center space-x-2 rounded-md px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors border ${
              stats.completed > 0
                ? 'bg-success-light/30 text-success border-success/40 hover:bg-success-light/50'
                : 'bg-muted text-muted-foreground/50 cursor-not-allowed border-gray-200/50'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download All</span>
          </button>

          <button
            onClick={onBulkRetry}
            disabled={stats.failed === 0}
            className={`flex items-center space-x-2 rounded-md px-3 py-2 text-xs font-medium tracking-wide uppercase transition-colors border ${
              stats.failed > 0
                ? 'bg-warning-light/40 text-warning border-warning/50 hover:bg-warning-light/60'
                : 'bg-muted text-muted-foreground/50 cursor-not-allowed border-gray-200/50'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Failed ({stats.failed})</span>
          </button>

          <button
            onClick={onBulkDelete}
            className="flex items-center space-x-2 rounded-md px-3 py-2 text-xs font-medium tracking-wide uppercase bg-destructive-light/40 text-destructive border border-destructive/40 hover:bg-destructive-light/60 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete All</span>
          </button>
        </div>

        {/* Bulk Edit Form */}
        <AnimatePresence>
          {showEditForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-md border border-gray-200/60 bg-muted/40 backdrop-blur-sm"
            >
              <h4 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground mb-3">
                Bulk Edit {stats.completed} completed extraction{stats.completed !== 1 ? 's' : ''}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-medium tracking-wide uppercase text-muted-foreground mb-1">Attribute</label>
                  <select
                    value={editForm.attribute}
                    onChange={(e) => setEditForm(prev => ({ ...prev, attribute: e.target.value }))}
                    className="input-base"
                  >
                    <option value="">Select attribute...</option>
                    {commonAttributes.map(attr => (
                      <option key={attr} value={attr}>
                        {attr.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium tracking-wide uppercase text-muted-foreground mb-1">Operation</label>
                  <select
                    value={editForm.operation}
                    onChange={(e) => setEditForm(prev => ({ ...prev, operation: e.target.value as BulkEditFormData['operation'] }))}
                    className="input-base"
                  >
                    <option value="set">Set Value</option>
                    <option value="clear">Clear Value</option>
                    <option value="append">Append to Value</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-medium tracking-wide uppercase text-muted-foreground mb-1">Value</label>
                  <input
                    type="text"
                    value={editForm.value}
                    onChange={(e) => setEditForm(prev => ({ ...prev, value: e.target.value }))}
                    disabled={editForm.operation === 'clear'}
                    placeholder={editForm.operation === 'clear' ? 'Will be cleared' : 'Enter value...'}
                    className={`input-base ${editForm.operation === 'clear' ? 'opacity-60' : ''}`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-[10px] text-muted-foreground/70">
                  This will update the &quot;{editForm.attribute}&quot; attribute for all {stats.completed} completed extractions
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkEdit}
                    disabled={!editForm.attribute}
                    className={`flex items-center space-x-2 rounded-md px-4 py-2 text-xs font-semibold tracking-wide uppercase transition-colors ${
                      editForm.attribute
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Apply Changes</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default BulkEditOperations
