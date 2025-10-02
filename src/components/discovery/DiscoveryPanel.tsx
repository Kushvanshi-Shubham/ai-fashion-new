'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, TrendingUp, Plus, Loader2, AlertTriangle, CheckCircle, Filter } from 'lucide-react'
import type { DiscoveredAttribute, DiscoveryStats } from '@/types/discovery'

interface DiscoveryPanelProps {
  categoryId?: string
  onPromoteToSchema?: (discoveryKey: string, label?: string) => Promise<boolean>
  className?: string
}

interface DiscoveryResponse {
  success: boolean
  data?: {
    discoveries: DiscoveredAttribute[]
    stats: DiscoveryStats
  }
  error?: string
}

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({
  categoryId,
  onPromoteToSchema,
  className = ''
}) => {
  const [discoveries, setDiscoveries] = useState<DiscoveredAttribute[]>([])
  const [stats, setStats] = useState<DiscoveryStats>({
    totalFound: 0,
    highConfidence: 0,
    schemaPromotable: 0,
    uniqueKeys: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterLevel, setFilterLevel] = useState<'all' | 'promotable' | 'high'>('all')
  const [promotingKeys, setPromotingKeys] = useState<Set<string>>(new Set())

  // Fetch discoveries
  const loadDiscoveries = React.useCallback(async () => {
    if (!categoryId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.set('categoryId', categoryId)
      if (filterLevel === 'promotable') params.set('promotable', 'true')

      const response = await fetch(`/api/discoveries?${params}`)
      const result: DiscoveryResponse = await response.json()

      if (result.success && result.data) {
        setDiscoveries(result.data.discoveries)
        setStats(result.data.stats)
      } else {
        setError(result.error || 'Failed to load discoveries')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }, [categoryId, filterLevel])

  // Promote discovery to schema
  const handlePromote = async (discovery: DiscoveredAttribute) => {
    if (!categoryId || !onPromoteToSchema) return

    setPromotingKeys(prev => new Set(prev).add(discovery.key))

    try {
      const success = await onPromoteToSchema(discovery.key, discovery.label)
      if (success) {
        // Remove promoted discovery from list
        setDiscoveries(prev => prev.filter(d => d.key !== discovery.key))
        setStats(prev => ({
          ...prev,
          totalFound: prev.totalFound - 1,
          schemaPromotable: Math.max(0, prev.schemaPromotable - 1)
        }))
      }
    } catch (err) {
      console.error('Promotion failed:', err)
    } finally {
      setPromotingKeys(prev => {
        const next = new Set(prev)
        next.delete(discovery.key)
        return next
      })
    }
  }

  // Filter discoveries based on current filter level
  const filteredDiscoveries = discoveries.filter(d => {
    switch (filterLevel) {
      case 'promotable':
        return d.isPromotable
      case 'high':
        return d.confidence >= 80
      default:
        return true
    }
  })

  useEffect(() => {
    loadDiscoveries()
  }, [categoryId, filterLevel, loadDiscoveries])

  if (!categoryId) {
    return (
      <div className={`bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-8 text-center ${className}`}>
        <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Select a category to view discovered attributes</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-sm border ${className}`}
    >
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Discoveries</h3>
              <p className="text-sm text-gray-600">New attributes found during extraction</p>
            </div>
          </div>

          {loading && (
            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{stats.totalFound}</div>
            <div className="text-sm text-gray-500">Total Found</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.highConfidence}</div>
            <div className="text-sm text-gray-500">High Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.schemaPromotable}</div>
            <div className="text-sm text-gray-500">Promotable</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.uniqueKeys}</div>
            <div className="text-sm text-gray-500">Unique Keys</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">Filter:</span>
          {(['all', 'high', 'promotable'] as const).map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterLevel === level
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {level === 'all' ? 'All' : level === 'high' ? 'High Confidence' : 'Promotable'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </motion.div>
        )}

        {filteredDiscoveries.length === 0 ? (
          <div className="text-center py-8">
            <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {loading ? 'Loading discoveries...' : 'No discoveries found yet'}
            </p>
            <p className="text-sm text-gray-400">
              Process images with AI extraction to discover new attributes
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredDiscoveries.map((discovery) => (
                <DiscoveryCard
                  key={discovery.key}
                  discovery={discovery}
                  onPromote={handlePromote}
                  isPromoting={promotingKeys.has(discovery.key)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredDiscoveries.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Showing {filteredDiscoveries.length} of {discoveries.length} discoveries
            </span>
            <button
              onClick={loadDiscoveries}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </motion.div>
  )
}

interface DiscoveryCardProps {
  discovery: DiscoveredAttribute
  onPromote: (discovery: DiscoveredAttribute) => void
  isPromoting: boolean
}

const DiscoveryCard: React.FC<DiscoveryCardProps> = ({ discovery, onPromote, isPromoting }) => {
  const confidenceColor = discovery.confidence >= 80 
    ? 'text-green-600 bg-green-50' 
    : discovery.confidence >= 60 
    ? 'text-yellow-600 bg-yellow-50'
    : 'text-red-600 bg-red-50'

  const typeIcon = {
    text: '📝',
    select: '📋',
    number: '🔢'
  }[discovery.suggestedType] || '❓'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{typeIcon}</span>
            <h4 className="font-semibold text-gray-900">{discovery.label}</h4>
            <span className="text-xs text-gray-500">({discovery.suggestedType})</span>
            <div className={`px-2 py-1 rounded text-xs font-medium ${confidenceColor}`}>
              {discovery.confidence}%
            </div>
            {discovery.isPromotable && (
              <CheckCircle className="w-4 h-4 text-green-500" />
            )}
          </div>
          
          <div className="mb-2">
            <span className="text-sm text-gray-600">Value: </span>
            <span className="text-sm font-medium text-gray-900">{discovery.normalizedValue}</span>
          </div>
          
          <div className="mb-3">
            <span className="text-xs text-gray-500">
              Found {discovery.frequency} time{discovery.frequency !== 1 ? 's' : ''}
            </span>
          </div>
          
          <p className="text-xs text-gray-600 italic">{discovery.reasoning}</p>
        </div>

        <div className="ml-4 flex flex-col space-y-2">
          {discovery.isPromotable && (
            <button
              onClick={() => onPromote(discovery)}
              disabled={isPromoting}
              className="flex items-center space-x-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-md text-xs font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
            >
              {isPromoting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Plus className="w-3 h-3" />
              )}
              <span>{isPromoting ? 'Adding...' : 'Add to Schema'}</span>
            </button>
          )}
          
          <div className="flex items-center space-x-1 text-xs text-gray-400">
            <TrendingUp className="w-3 h-3" />
            <span>Score: {Math.round(discovery.frequency * discovery.confidence)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}