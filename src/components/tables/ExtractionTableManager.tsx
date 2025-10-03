'use client'

import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { RichDataTable } from './RichDataTable'
import { BulkEditOperations } from './BulkEditOperations'
import { ExtractionResult, isCompletedExtraction } from '@/types/fashion'

import { exportExtractionsToXlsx } from '@/lib/export/xlsx'
import { toast } from 'sonner'

interface ExtractionTableManagerProps {
  results: ExtractionResult[]
  onRetry?: (resultId: string) => void
  onImageClick?: (imageUrl: string, fileName?: string) => void
  className?: string
}

export const ExtractionTableManager: React.FC<ExtractionTableManagerProps> = ({
  results,
  onRetry,
  onImageClick,
  className = ''
}) => {
  const [selectedRows, setSelectedRows] = useState<string[]>([])


  // Get selected results
  const selectedResults = useMemo(() => {
    return results.filter(result => selectedRows.includes(result.id))
  }, [results, selectedRows])

  // Handle individual attribute editing
  const handleAttributeEdit = async (resultId: string, attributeKey: string, newValue: string | null) => {
    const result = results.find(r => r.id === resultId)
    if (!result || !isCompletedExtraction(result)) {
      toast.error('Cannot edit attributes on incomplete extractions')
      return
    }

    try {
      // For now, we'll just show success and emit a custom event that parent can handle
      // In a full implementation, this would persist to database
      console.log(`Editing attribute ${attributeKey} for result ${resultId}:`, newValue)
      toast.success('Attribute updated successfully')
      
      // Emit custom event for parent components to handle
      window.dispatchEvent(new CustomEvent('attributeEdited', {
        detail: { resultId, attributeKey, newValue }
      }))
    } catch (error) {
      console.error('Failed to update attribute:', error)
      toast.error('Failed to update attribute')
    }
  }

  // Handle bulk editing
  const handleBulkEdit = async (attribute: string, value: string | null) => {
    const completedResults = selectedResults.filter(isCompletedExtraction)
    
    if (completedResults.length === 0) {
      toast.error('No completed extractions selected')
      return
    }

    try {
      // For now, we'll just show success and emit a custom event that parent can handle
      // In a full implementation, this would persist to database
      console.log(`Bulk editing attribute ${attribute} for ${completedResults.length} results:`, value)
      toast.success(`Updated ${attribute} for ${completedResults.length} extractions`)
      
      // Emit custom event for parent components to handle
      window.dispatchEvent(new CustomEvent('bulkAttributeEdited', {
        detail: { 
          resultIds: completedResults.map(r => r.id), 
          attribute, 
          value 
        }
      }))
    } catch (error) {
      console.error('Failed to bulk edit:', error)
      toast.error('Failed to apply bulk edit')
    }
  }

  // Handle bulk download
  const handleBulkDownload = async () => {
    const completedResults = selectedResults.filter(isCompletedExtraction)
    
    if (completedResults.length === 0) {
      toast.error('No completed extractions selected')
      return
    }

    try {
      // Convert to the expected format for the export function
      const exportData = completedResults.map(result => ({
        id: result.id,
        fileName: result.fileName,
        status: 'COMPLETED' as const,
        attributes: result.attributes,
        performance: {
          tokensUsed: result.tokensUsed,
          processingTime: result.processingTime
        }
      }))

      await exportExtractionsToXlsx(exportData, {
        filename: `bulk_export_${new Date().toISOString().split('T')[0]}.xlsx`
      })
      toast.success(`Downloaded ${completedResults.length} extraction results`)
    } catch (error) {
      console.error('Failed to download results:', error)
      toast.error('Failed to download results')
    }
  }

  // Handle single result download
  const handleSingleDownload = async (result: ExtractionResult) => {
    if (!isCompletedExtraction(result)) {
      toast.error('Cannot download incomplete extraction')
      return
    }

    try {
      const exportData = [{
        id: result.id,
        fileName: result.fileName,
        status: 'COMPLETED' as const,
        attributes: result.attributes,
        performance: {
          tokensUsed: result.tokensUsed,
          processingTime: result.processingTime
        }
      }]

      const fileName = `${result.fileName.split('.')[0]}_extraction.xlsx`
      await exportExtractionsToXlsx(exportData, { filename: fileName })
      toast.success('Extraction result downloaded')
    } catch (error) {
      console.error('Failed to download result:', error)
      toast.error('Failed to download result')
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedResults.length === 0) return

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedResults.length} extraction result(s)? This action cannot be undone.`
    )

    if (!confirmed) return

    try {
      // For now, we'll just show success and emit a custom event that parent can handle
      // In a full implementation, this would remove from database
      console.log('Deleting results:', selectedResults.map(r => r.id))
      
      setSelectedRows([])
      toast.success(`Deleted ${selectedResults.length} extraction results`)
      
      // Emit custom event for parent components to handle
      window.dispatchEvent(new CustomEvent('resultsDeleted', {
        detail: { resultIds: selectedResults.map(r => r.id) }
      }))
    } catch (error) {
      console.error('Failed to delete results:', error)
      toast.error('Failed to delete results')
    }
  }

  // Handle bulk retry
  const handleBulkRetry = async () => {
    const failedResults = selectedResults.filter(r => r.status === 'failed')
    
    if (failedResults.length === 0) {
      toast.error('No failed extractions selected')
      return
    }

    if (!onRetry) {
      toast.error('Retry function not available')
      return
    }

    try {
      failedResults.forEach(result => {
        onRetry(result.id)
      })

      toast.success(`Retrying ${failedResults.length} failed extractions`)
    } catch (error) {
      console.error('Failed to retry extractions:', error)
      toast.error('Failed to retry extractions')
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Bulk Operations Panel */}
      {selectedRows.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <BulkEditOperations
            selectedResults={selectedResults}
            onBulkEdit={handleBulkEdit}
            onBulkDownload={handleBulkDownload}
            onBulkDelete={handleBulkDelete}
            onBulkRetry={handleBulkRetry}
            onClearSelection={() => setSelectedRows([])}
          />
        </motion.div>
      )}

      {/* Main Data Table */}
      <RichDataTable
        results={results}
        selectedRows={selectedRows}
        onSelectionChange={setSelectedRows}
        onRetry={onRetry}
        onDownload={handleSingleDownload}
        onAttributeEdit={handleAttributeEdit}
        onImageClick={onImageClick}
        className="shadow-sm"
      />

      {/* Footer Stats */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span>Total Results: <strong>{results.length}</strong></span>
            <span>Completed: <strong>{results.filter(r => r.status === 'completed').length}</strong></span>
            <span>Failed: <strong>{results.filter(r => r.status === 'failed').length}</strong></span>
            <span>Processing: <strong>{results.filter(r => r.status === 'processing').length}</strong></span>
          </div>
          {selectedRows.length > 0 && (
            <div>
              <strong>{selectedRows.length}</strong> selected
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExtractionTableManager
