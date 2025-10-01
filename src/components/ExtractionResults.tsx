'use client'

import { ExtractionResult } from '@/types'
import { CheckCircle, XCircle, Clock, Zap, DollarSign, Download, Eye } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'
import { useState } from 'react'

interface ExtractionResultsProps {
  result: ExtractionResult
  onDownload?: (result: ExtractionResult) => void
  onView?: (result: ExtractionResult) => void
  className?: string
}

export default function ExtractionResults({ 
  result, 
  onDownload, 
  onView,
  className 
}: ExtractionResultsProps) {
  const [showAllAttributes, setShowAllAttributes] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'PROCESSING':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400'
    return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
  }

  const extractedAttributes = Object.entries(result.extractedData).filter(
    ([key]) => !['confidence_scores', 'metadata'].includes(key)
  )

  const confidenceScores = result.extractedData.confidence_scores || {}
  const metadata = result.extractedData.metadata || {}

  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden",
      className
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon(result.status)}
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Extraction Results
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            {onView && (
              <button
                onClick={() => onView(result)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                <Eye className="w-4 h-4 mr-1" />
                View Details
              </button>
            )}
            {onDownload && (
              <button
                onClick={() => onDownload(result)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            )}
          </div>
        </div>

        {/* Category and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Category</p>
            <p className="font-medium text-gray-900 dark:text-gray-100">{result.category.name}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Overall Confidence</p>
            <div className="flex items-center space-x-2">
              <span className={cn(
                "px-2 py-1 rounded-full text-sm font-medium",
                getConfidenceColor(result.confidence)
              )}>
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Processing Time</p>
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {(result.processingTime / 1000).toFixed(2)}s
              </span>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cost</p>
            <div className="flex items-center space-x-1">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {formatCurrency(result.cost)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Extracted Attributes */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Extracted Attributes
          </h4>
          {extractedAttributes.length > 6 && (
            <button
              onClick={() => setShowAllAttributes(!showAllAttributes)}
              className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showAllAttributes ? 'Show Less' : `Show All (${extractedAttributes.length})`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {extractedAttributes
            .slice(0, showAllAttributes ? extractedAttributes.length : 6)
            .map(([key, value]) => {
              const confidence = confidenceScores[key] || 0
              const attribute = result.category.attributes?.find(attr => attr.key === key)
              
              return (
                <div
                  key={key}
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900 dark:text-gray-100">
                      {attribute?.label || key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h5>
                    {confidence > 0 && (
                      <span className={cn(
                        "px-2 py-1 rounded text-xs font-medium",
                        getConfidenceColor(confidence)
                      )}>
                        {Math.round(confidence * 100)}%
                      </span>
                    )}
                  </div>
                  
                  <div className="text-gray-700 dark:text-gray-300">
                    {typeof value === 'boolean' ? (
                      <span className={value ? 'text-green-600' : 'text-red-600'}>
                        {value ? 'Yes' : 'No'}
                      </span>
                    ) : typeof value === 'object' && value !== null ? (
                      <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <span className="font-medium">
                        {String(value).replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
        </div>

        {/* Metadata */}
        {Object.keys(metadata).length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Processing Details</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {metadata.total_attributes && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Total Attributes:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {metadata.total_attributes}
                  </span>
                </div>
              )}
              {metadata.extracted_attributes && (
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Extracted:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                    {metadata.extracted_attributes}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-500 dark:text-gray-400">AI Model:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {result.aiModel}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Tokens Used:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-gray-100">
                  {result.tokenUsage.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
