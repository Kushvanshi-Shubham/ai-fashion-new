'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import ExtractionResults from '@/components/ExtractionResults'
import { ExtractionResult } from '@/types/fashion'
import { Button } from '@/components/ui/button'
import { RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface DatabaseAttribute {
  value: string | null
  confidence?: number
  reasoning?: string
  fieldLabel?: string
  isValid?: boolean
}

interface DatabaseResult {
  id: string
  fileName: string
  createdAt: string
  status: string
  attributes: Record<string, DatabaseAttribute>
  confidence: number
  tokensUsed: number
  processingTime: number
  fromCache: boolean
  error?: string
}

interface ApiResponse {
  success: boolean
  data?: {
    results: DatabaseResult[]
    pagination: {
      page: number
      limit: number
      totalCount: number
      totalPages: number
      hasMore: boolean
    }
    stats: {
      total: number
      avgConfidence: number
      avgProcessingTime: number
      totalTokens: number
    }
  }
  error?: string
}

export default function ExtractionsPage() {
  const [results, setResults] = useState<ExtractionResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState({
    total: 0,
    avgConfidence: 0,
    avgProcessingTime: 0,
    totalTokens: 0
  })

  const fetchResults = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/results?limit=50&sortBy=createdAt&sortOrder=desc')
      const data: ApiResponse = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch results')
      }

      if (data.data) {
        // Transform API results to match ExtractionResult interface
        const transformedResults: ExtractionResult[] = data.data.results.map((result: DatabaseResult) => {
          if (result.status === 'completed') {
            return {
              id: result.id,
              fileName: result.fileName,
              createdAt: result.createdAt,
              status: 'completed' as const,
              attributes: Object.fromEntries(
                Object.entries(result.attributes).map(([key, attr]) => [
                  key, 
                  {
                    value: attr?.value || null,
                    confidence: attr?.confidence || result.confidence || 0,
                    reasoning: attr?.reasoning || 'Extracted via AI',
                    fieldLabel: attr?.fieldLabel || key.replace(/_/g, ' '),
                    isValid: attr?.value !== null && attr?.value !== ''
                  }
                ])
              ),
              confidence: result.confidence || 0,
              tokensUsed: result.tokensUsed || 0,
              processingTime: result.processingTime || 0,
              fromCache: result.fromCache || false
            }
          } else {
            return {
              id: result.id,
              fileName: result.fileName,
              createdAt: result.createdAt,
              status: 'failed' as const,
              error: result.error || 'Unknown error',
              fromCache: result.fromCache || false
            }
          }
        })

        setResults(transformedResults)
        setStats(data.data.stats)
      }
    } catch (err) {
      console.error('Failed to fetch extraction results:', err)
      setError(err instanceof Error ? err.message : 'Unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchResults()
  }, [])

  const handleRetry = async (resultId: string) => {
    // In a real implementation, you might want to requeue the extraction
    console.log('Retry extraction for:', resultId)
    // For now, just refresh the results
    await fetchResults()
  }

  const handleDownload = (result: ExtractionResult) => {
    // Only allow download for completed extractions
    if (result.status !== 'completed') {
      console.warn('Cannot download incomplete extraction result')
      return
    }

    // Create CSV download for individual result
    const headers = ['Attribute', 'Value', 'Confidence', 'Reasoning']
    
    const rows = Object.entries(result.attributes).map(([key, detail]) => {
      if (detail && typeof detail === 'object' && 'value' in detail) {
        const attr = detail as { 
          value: unknown
          confidence?: number
          fieldLabel?: string
          reasoning?: string
        }
        return {
          Attribute: attr.fieldLabel || key,
          Value: attr.value || 'Not detected',
          Confidence: `${attr.confidence || 0}%`,
          Reasoning: attr.reasoning || 'N/A'
        }
      }
      return {
        Attribute: key,
        Value: detail || 'Not detected',
        Confidence: `${result.confidence}%`,
        Reasoning: 'N/A'
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
    a.download = `extraction-${result.fileName}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center space-y-4">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-gray-600">Loading extraction results...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      className="container mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Extraction Results</h1>
          </div>
          <p className="text-gray-600">
            View and manage your AI extraction results. Total: {stats.total} extractions
          </p>
        </div>

        <Button onClick={fetchResults} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Extractions</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{stats.avgConfidence}%</div>
          <div className="text-sm text-gray-500">Avg Confidence</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">{stats.avgProcessingTime}ms</div>
          <div className="text-sm text-gray-500">Avg Time</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">{stats.totalTokens.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Total Tokens</div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="text-red-600 font-medium">Error loading results:</div>
            <div className="text-red-700">{error}</div>
          </div>
          <Button 
            onClick={fetchResults}
            variant="outline" 
            size="sm" 
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Results Component */}
      <ExtractionResults
        results={results}
        onRetry={handleRetry}
        onDownload={handleDownload}
        className="bg-white rounded-lg"
      />

      {/* Empty State for First Time Users */}
      {!loading && !error && results.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Extractions Yet</h3>
          <p className="text-gray-500 mb-4">
            Start by uploading images and extracting attributes to see results here.
          </p>
          <Button asChild>
            <Link href="/category-workflow">
              Start First Extraction
            </Link>
          </Button>
        </div>
      )}
    </motion.div>
  )
}