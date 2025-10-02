"use client"
'use client'
import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  Circle, 
  Layers, 
  TrendingUp, 
  Zap 
} from 'lucide-react'
import { CategoryFormData, Category } from '@/types/fashion'


interface CategoryCardProps {
  category: Partial<CategoryFormData> | Partial<Category>
  isSelected: boolean
  onSelect: (category: CategoryFormData) => void
  disabled?: boolean
  showStats?: boolean
  className?: string
}

const CategoryCard = memo(function CategoryCard({
  category,
  isSelected,
  onSelect,
  disabled = false,
  showStats = true,
  className = ''
}: CategoryCardProps) {
  // Narrow the incoming partial type for safe reads
  const cf = category as Partial<CategoryFormData> & Partial<Category>
  const enabled = cf.enabledAttributes ?? 0
  const total = cf.totalAttributes ?? 0
  const completenessPercentage = cf.completeness ?? Math.round((enabled / Math.max(total, 1)) * 100)

  const handleSelect = async () => {
    if (disabled) return
    
    try {
      // Fetch full category data
  const categoryId = cf.categoryId ?? cf.id
  const response = await fetch(`/api/categories/${categoryId}/form`)
      const result = await response.json()
      
      if (result.success) {
        onSelect(result.data)
      } else {
        console.error('Failed to load category:', result.error)
      }
    } catch (error) {
      console.error('Failed to load category:', error)
    }
  }

  const getCompletenessColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500'
    if (percentage >= 60) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case 'KIDS':
        return '👶'
      case 'MENS':
        return '👨'
      case 'LADIES':
        return '👩'
      default:
        return '👔'
    }
  }

  const getDepartmentColor = (department: string) => {
    switch (department) {
      case 'KIDS':
        return 'bg-purple-100 text-purple-800'
      case 'MENS':
        return 'bg-blue-100 text-blue-800'
      case 'LADIES':
        return 'bg-pink-100 text-pink-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.02, y: disabled ? 0 : -2 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={handleSelect}
      className={`
        relative p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
        ${isSelected 
          ? 'border-blue-500 bg-blue-50 shadow-md' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${!category.isActive ? 'opacity-75' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Selection Indicator */}
      <div className="absolute top-3 right-3">
        {isSelected ? (
          <CheckCircle className="w-5 h-5 text-blue-500" />
        ) : (
          <Circle className="w-5 h-5 text-gray-300" />
        )}
      </div>

      {/* Header */}
      <div className="mb-3">
        <div className="flex items-start space-x-2 mb-2">
          <span className="text-2xl">{getDepartmentIcon((cf.department ?? 'UNKNOWN') as string)}</span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate" title={cf.categoryName ?? cf.name}>
              {cf.categoryName ?? cf.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDepartmentColor(cf.department ?? 'UNKNOWN')}`}>
                {cf.department ?? 'UNKNOWN'}
              </span>
              <span className="text-xs text-gray-500">
                {cf.subDepartment}
              </span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2" title={cf.description}>
          {cf.description}
        </p>
      </div>

      {/* Stats */}
      {showStats && (
        <div className="space-y-2">
          {/* Attributes */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Layers className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Attributes</span>
            </div>
              <span className="text-sm font-medium text-gray-900">
              {cf.enabledAttributes ?? 0}/{cf.totalAttributes ?? 0}
            </span>
          </div>

          {/* Completeness Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Completeness</span>
              <span className={`text-xs font-medium ${getCompletenessColor(completenessPercentage)}`}>
                {completenessPercentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <motion.div
                className={`h-1.5 rounded-full ${
                  completenessPercentage >= 80 ? 'bg-green-500' :
                  completenessPercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${completenessPercentage}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
              />
            </div>
          </div>

          {/* Additional Stats */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>AI Ready</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-3 h-3" />
              <span>Fast Extract</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Badge */}
      {!cf.isActive && (
        <div className="absolute top-3 left-3">
          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
            Inactive
          </span>
        </div>
      )}

      {/* Hover Effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className={`
          w-full h-full rounded-lg 
          ${isSelected ? 'bg-blue-500/5' : 'bg-gray-900/5'}
        `} />
      </motion.div>
    </motion.div>
  )
})

export default CategoryCard