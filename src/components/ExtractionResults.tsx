"use client"
import React, { memo, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Eye,
  Filter,
  Search,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react'
import { ExtractionResult, AttributeDetail, isCompletedExtraction } from '@/types'

interface ExtractionResultsProps {
  results: ExtractionResult[]
  onRetry?: (resultId: string) => void
  onDownload?: (result: ExtractionResult) => void
  className?: string
}

type FilterType = 'all' | 'completed' | 'failed' | 'high-confidence' | 'low-confidence'
type SortType = 'recent' | 'confidence' | 'name' | 'processing-time'

const ExtractionResults = memo(function ExtractionResults({
  results,
  onRetry,
  onDownload,
  className = ''
}: ExtractionResultsProps) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [sort, setSort] = useState<SortType>('recent')
  const [search, setSearch] = useState('')
  const [selectedResult, setSelectedResult] = useState<ExtractionResult | null>(null)

  // Filter and sort results
  const filteredAndSortedResults = useMemo(() => {
    let filtered = results.filter(result => {
      // Apply filters
      switch (filter) {
        case 'completed':
          return result.status === 'completed'
        case 'failed':
          return result.status === 'failed'
        case 'high-confidence':
          return isCompletedExtraction(result) && result.confidence >= 80
        case 'low-confidence':
          return isCompletedExtraction(result) && result.confidence < 60
        default:
          return true
      }
    })

    // Apply search
    if (search) {
      filtered = filtered.filter(result =>
        result.fileName.toLowerCase().includes(search.toLowerCase()) ||
        result.id.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply sort
    filtered.sort((a, b) => {
      switch (sort) {
        case 'confidence':
          return (isCompletedExtraction(b) ? b.confidence : -Infinity) - (isCompletedExtraction(a) ? a.confidence : -Infinity)
        case 'name':
          return a.fileName.localeCompare(b.fileName)
        case 'processing-time':
          return (isCompletedExtraction(a) ? a.processingTime : Infinity) - (isCompletedExtraction(b) ? b.processingTime : Infinity)
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    return filtered
  }, [results, filter, sort, search])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = results.length
    const completed = results.filter(r => r.status === 'completed').length
    const failed = results.filter(r => r.status === 'failed').length
    const avgConfidence = completed > 0
      ? Math.round(results.filter(isCompletedExtraction).reduce((sum, r) => sum + r.confidence, 0) / completed)
      : 0
    const totalTokens = results.reduce((sum, r) => sum + (isCompletedExtraction(r) ? r.tokensUsed : 0), 0)
    const avgProcessingTime = total > 0
      ? Math.round(results.reduce((sum, r) => sum + (isCompletedExtraction(r) ? r.processingTime : 0), 0) / total)
      : 0

    return {
      total,
      completed,
      failed,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      avgConfidence,
      totalTokens,
      avgProcessingTime
    }
  }, [results])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500 animate-pulse" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const exportResults = () => {
    const headers = ['fileName','status','confidence','tokensUsed','processingTime','createdAt','attributeCount','extractedCount']

    const rows = results.map(result => {
      const isDone = isCompletedExtraction(result)
      const attributes = isDone ? result.attributes : {}
      const attributeCount = Object.keys(attributes || {}).length
      const extractedCount = Object.values(attributes || {}).filter((attr: unknown) => {
        if (!attr || typeof attr !== 'object') return false
        const maybe = attr as AttributeDetail
        return maybe.value !== null
      }).length

      return {
        fileName: result.fileName,
        status: result.status,
        confidence: isDone ? (typeof result.confidence === 'number' ? result.confidence : '') : '',
        tokensUsed: isDone ? (typeof result.tokensUsed === 'number' ? result.tokensUsed : '') : '',
        processingTime: isDone ? (typeof result.processingTime === 'number' ? result.processingTime : '') : '',
        createdAt: result.createdAt,
        attributeCount,
        extractedCount
      }
    })

    const escape = (v: unknown) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }

    const csvContent = [
      headers.join(','),
      ...rows.map((r: Record<string, unknown>) => headers.map(h => escape(r[h])).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extraction-results-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (results.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <TrendingUp className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
        <p className="text-gray-500">Upload images and select a category to start extracting attributes.</p>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with Stats */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Extraction Results</h2>
          <button
            onClick={exportResults}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export CSV</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <div className="text-sm text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.successRate}%</div>
            <div className="text-sm text-gray-500">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.avgConfidence}%</div>
            <div className="text-sm text-gray-500">Avg Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.avgProcessingTime}ms</div>
            <div className="text-sm text-gray-500">Avg Time</div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Results</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="high-confidence">High Confidence (≥80%)</option>
              <option value="low-confidence">Low Confidence (&lt;60%)</option>
            </select>
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="confidence">Highest Confidence</option>
            <option value="name">Name A-Z</option>
            <option value="processing-time">Fastest Processing</option>
          </select>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredAndSortedResults.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg border hover:shadow-md transition-all duration-200"
            >
              {/* Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium text-gray-900 truncate" title={result.fileName}>
                      {result.fileName}
                    </span>
                  </div>
                                <div className="flex items-center space-x-2">
                                  {result.fromCache && (
                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                      Cached
                                    </span>
                                  )}
                                  <span className={`px-2 py-1 text-xs rounded-full ${isCompletedExtraction(result) ? getConfidenceColor(result.confidence) : 'text-gray-600 bg-gray-100'}`}>
                                    {isCompletedExtraction(result) ? `${result.confidence}%` : '—'}
                                  </span>
                                </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{new Date(result.createdAt).toLocaleString()}</span>
                  <span>{isCompletedExtraction(result) ? `${result.processingTime}ms` : '—'}</span>
                </div>
              </div>

              {/* Attributes Summary */}
              <div className="p-4">
                <div className="space-y-2">
                  {/* Attribute Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Attributes Extracted:</span>
                      <span className="font-medium">
                          {isCompletedExtraction(result) ? Object.values(result.attributes).filter((attr) => {
                            if (!attr || typeof attr !== 'object') return false
                            const maybe = attr as AttributeDetail
                            return maybe.value !== null
                          }).length : 0}/
                          {isCompletedExtraction(result) ? Object.keys(result.attributes).length : 0}
                        </span>
                    </div>

                    {/* Token Usage */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Tokens Used:</span>
                      <span className="font-medium">{isCompletedExtraction(result) ? result.tokensUsed.toLocaleString() : '—'}</span>
                    </div>

                    {/* Error Message */}
                    {result.status === 'failed' && (() => {
                      const failed = result as import('@/types/fashion').FailedExtractionResult
                      return failed.error ? (
                        <div className="flex items-start space-x-2 p-2 bg-red-50 rounded-md">
                          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-red-700">{failed.error}</span>
                        </div>
                      ) : null
                    })()}
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between">
                <button
                  onClick={() => setSelectedResult(result)}
                  className="flex items-center space-x-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Details</span>
                </button>

                <div className="flex items-center space-x-2">
                  {result.status === 'failed' && onRetry && (
                    <button
                      onClick={() => onRetry(result.id)}
                      className="flex items-center space-x-1 px-2 py-1 text-sm text-orange-600 hover:text-orange-800 transition-colors"
                      title="Retry extraction"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}

                  {onDownload && (
                    <button
                      onClick={() => onDownload(result)}
                      className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      title="Download result"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* No filtered results */}
      {filteredAndSortedResults.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Matching Results</h3>
          <p className="text-gray-500">Try adjusting your filters or search terms.</p>
        </div>
      )}

      {/* Detailed Result Modal */}
      <AnimatePresence>
        {selectedResult && (
          <ResultDetailModal
            result={selectedResult}
            onClose={() => setSelectedResult(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
})

// Result Detail Modal Component
const ResultDetailModal = memo(function ResultDetailModal({
  result,
  onClose
}: {
  result: ExtractionResult
  onClose: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Extraction Details</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">File Name:</span>
                  <span className="ml-2 font-medium">{result.fileName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="ml-2 font-medium">{result.status}</span>
                </div>
                {isCompletedExtraction(result) && (
                  <>
                    <div>
                      <span className="text-gray-600">Confidence:</span>
                      <span className="ml-2 font-medium">{result.confidence}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Processing Time:</span>
                      <span className="ml-2 font-medium">{result.processingTime}ms</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Tokens Used:</span>
                      <span className="ml-2 font-medium">{result.tokensUsed.toLocaleString()}</span>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-gray-600">Created:</span>
                  <span className="ml-2 font-medium">
                    {new Date(result.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Extracted Attributes */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Extracted Attributes</h4>
              <div className="space-y-2">
                {isCompletedExtraction(result) && Object.entries(result.attributes).map(([key, detailRaw]) => {
                  const detail = detailRaw as AttributeDetail
                  return (
                    <div
                      key={key}
                      className={`p-3 rounded-md border ${
                        detail.value 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{detail.fieldLabel}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          detail.confidence >= 80 
                            ? 'bg-green-100 text-green-800'
                            : detail.confidence >= 60
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {detail.confidence}%
                        </span>
                      </div>
                      <div className="text-sm text-gray-900">
                        <strong>Value:</strong> {detail.value || 'Not detected'}
                      </div>
                      {detail.reasoning && (
                        <div className="text-xs text-gray-600 mt-1">
                          <strong>Reasoning:</strong> {detail.reasoning}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
})

export default ExtractionResults