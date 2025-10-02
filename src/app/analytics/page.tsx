'use client'

import Link from 'next/link'
import { ArrowLeft, TrendingUp, Activity, Zap, DollarSign } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

export default function AnalyticsPage() {
  interface AnalyticsSummaryResponse {
    success: boolean
    data?: {
      totals?: {
        totalEvents: number
        successCount: number
        failedCount: number
        cachedCount: number
        successRate: number
        avgProcessingTimeMs: number
        avgTokens: number
      }
      categoryTop?: Array<{
        categoryCode: string
        count: number
        avgProcessingMs: number
        avgTokens: number
      }>
    }
  }

  const { data: summary, error, isLoading } = useQuery<AnalyticsSummaryResponse>({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const response = await fetch('/api/analytics/summary')
      if (!response.ok) throw new Error('Failed to fetch analytics summary')
      return response.json() as Promise<AnalyticsSummaryResponse>
    }
  })

  const totals = summary?.data?.totals
  const catTop = summary?.data?.categoryTop

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Analytics
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Performance metrics and usage statistics
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading analytics...</p>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">Analytics unavailable.</p>
        )}
        {totals && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.totalEvents}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">{Math.round(totals.successRate * 100)}% success</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Processing</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.avgProcessingTimeMs} ms</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">mean</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Tokens</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.avgTokens}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">per extraction</p>
                </div>
                <Activity className="w-8 h-8 text-green-500" />
              </div>
            </div>
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed / Failed</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{totals.successCount} / {totals.failedCount}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cached: {totals.cachedCount}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Charts Placeholder */}
        {catTop && (
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Categories</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4 font-medium">Category</th>
                    <th className="py-2 pr-4 font-medium">Count</th>
                    <th className="py-2 pr-4 font-medium">Avg Proc (ms)</th>
                    <th className="py-2 pr-4 font-medium">Avg Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  {catTop.map(row => (
                    <tr key={row.categoryCode} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-2 pr-4 font-mono">{row.categoryCode}</td>
                      <td className="py-2 pr-4">{row.count}</td>
                      <td className="py-2 pr-4">{row.avgProcessingMs}</td>
                      <td className="py-2 pr-4">{row.avgTokens}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
