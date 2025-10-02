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
      className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}
    >
      <div className="p-4">
        {/* Header with selection info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-900">{stats.total} items selected</span>
            </div>
            <div className="text-sm text-gray-500">
              {stats.completed > 0 && <span className="mr-3">{stats.completed} completed</span>}
              {stats.failed > 0 && <span className="mr-3 text-red-600">{stats.failed} failed</span>}
              {stats.processing > 0 && <span className="mr-3 text-blue-600">{stats.processing} processing</span>}
              {stats.pending > 0 && <span className="text-gray-600">{stats.pending} pending</span>}
            </div>
          </div>
          <button
            onClick={onClearSelection}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowEditForm(!showEditForm)}
            disabled={stats.completed === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              stats.completed > 0
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Bulk Edit</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showEditForm ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={onBulkDownload}
            disabled={stats.completed === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              stats.completed > 0
                ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Download All</span>
          </button>

          <button
            onClick={onBulkRetry}
            disabled={stats.failed === 0}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              stats.failed > 0
                ? 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                : 'bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Failed ({stats.failed})</span>
          </button>

          <button
            onClick={onBulkDelete}
            className="flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors"
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
              className="mt-4 p-4 bg-gray-50 rounded-md border"
            >
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Bulk Edit {stats.completed} completed extraction{stats.completed !== 1 ? 's' : ''}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Attribute
                  </label>
                  <select
                    value={editForm.attribute}
                    onChange={(e) => setEditForm(prev => ({ ...prev, attribute: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Operation
                  </label>
                  <select
                    value={editForm.operation}
                    onChange={(e) => setEditForm(prev => ({ ...prev, operation: e.target.value as BulkEditFormData['operation'] }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="set">Set Value</option>
                    <option value="clear">Clear Value</option>
                    <option value="append">Append to Value</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    value={editForm.value}
                    onChange={(e) => setEditForm(prev => ({ ...prev, value: e.target.value }))}
                    disabled={editForm.operation === 'clear'}
                    placeholder={editForm.operation === 'clear' ? 'Will be cleared' : 'Enter value...'}
                    className={`w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      editForm.operation === 'clear' ? 'bg-gray-100 text-gray-400' : ''
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-xs text-gray-500">
                  This will update the &quot;{editForm.attribute}&quot; attribute for all {stats.completed} completed extractions
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowEditForm(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkEdit}
                    disabled={!editForm.attribute}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      editForm.attribute
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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