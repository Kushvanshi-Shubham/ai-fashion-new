'use client'

import Link from 'next/link'
import { ArrowLeft, TrendingUp, Activity, Zap, DollarSign } from 'lucide-react'

export default function AnalyticsPage() {
  // Mock data for demo
  const stats = {
    totalExtractions: 1247,
    avgAccuracy: 0.91,
    avgProcessingTime: 2.4,
    totalCost: 45.67,
    todayExtractions: 23,
    successRate: 0.98
  }

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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Extractions</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalExtractions.toLocaleString()}
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  +{stats.todayExtractions} today
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Accuracy</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {Math.round(stats.avgAccuracy * 100)}%
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  +2% from last week
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Processing Time</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.avgProcessingTime}s
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  -0.3s improvement
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Cost</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${stats.totalCost}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  $0.037 per extraction
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Daily Extractions
            </h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Chart coming soon...</p>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Category Breakdown
            </h3>
            <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">Chart coming soon...</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
