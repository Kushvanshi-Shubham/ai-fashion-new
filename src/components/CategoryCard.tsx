'use client'

import React, { memo } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle2, 
  Circle, 
  Layers, 
  TrendingUp, 
  Zap, 
  Baby,
  User,
  UserCheck,
  Shirt
} from 'lucide-react'
import { CategoryFormData, Category } from '@/types/fashion'
import { Badge } from '@/components/ui/badge'

interface CategoryCardProps {
  category: Partial<CategoryFormData> | Partial<Category>
  isSelected: boolean
  onSelect: (category: CategoryFormData) => void
  disabled?: boolean
  showStats?: boolean
  className?: string
  animationIndex?: number // optional stable index for staggered animations
}

const CategoryCard = memo(function CategoryCard({
  category,
  isSelected,
  onSelect,
  disabled = false,
  showStats = true,
  className = '',
  animationIndex = 0
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
    if (percentage >= 80) return 'text-emerald-600 dark:text-emerald-400'
    if (percentage >= 60) return 'text-amber-600 dark:text-amber-400'
    return 'text-red-500 dark:text-red-400'
  }

  const getDepartmentIcon = (department: string) => {
    switch (department) {
      case 'KIDS':
        return Baby
      case 'MENS':
        return User
      case 'LADIES':
        return UserCheck
      default:
        return Shirt
    }
  }

  const getDepartmentGradient = (department: string) => {
    switch (department) {
      case 'KIDS':
        return 'from-purple-500/10 to-purple-600/10 border-purple-200/60 dark:border-purple-400/30'
      case 'MENS':
        return 'from-blue-500/10 to-blue-600/10 border-blue-200/60 dark:border-blue-400/30'
      case 'LADIES':
        return 'from-pink-500/10 to-pink-600/10 border-pink-200/60 dark:border-pink-400/30'
      default:
        return 'from-slate-500/10 to-slate-600/10 border-slate-200/60 dark:border-slate-400/30'
    }
  }

  const getDepartmentBadgeColor = (department: string) => {
    switch (department) {
      case 'KIDS':
        return 'bg-purple-100 text-purple-700 border-purple-200/60 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-600/30'
      case 'MENS':
        return 'bg-blue-100 text-blue-700 border-blue-200/60 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-600/30'
      case 'LADIES':
        return 'bg-pink-100 text-pink-700 border-pink-200/60 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-600/30'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200/60 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-600/30'
    }
  }

  const DepartmentIcon = getDepartmentIcon(cf.department ?? 'UNKNOWN')

  return (
    <motion.div
      whileHover={{ 
        scale: disabled ? 1 : 1.02, 
        y: disabled ? 0 : -4,
      }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={handleSelect}
      className={`
        relative surface cursor-pointer group overflow-hidden
        ${isSelected 
          ? 'border-primary/60 shadow-elevated bg-gradient-to-br from-primary/5 via-primary/3 to-transparent' 
          : 'border-border/50 hover:border-primary/30'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        ${!cf.isActive ? 'opacity-75' : ''}
        ${className}
      `}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        ease: [0.22, 1, 0.36, 1],
        delay: Math.min(animationIndex * 0.025, 0.25) // deterministic, avoids hydration mismatch
      }}
    >
      {/* Selection Indicator */}
      <motion.div 
        className="absolute top-4 right-4 z-10"
        initial={false}
        animate={{ scale: isSelected ? 1.1 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {isSelected ? (
          <CheckCircle2 className="w-5 h-5 text-primary drop-shadow-sm" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground/60 group-hover:text-primary/60 transition-colors duration-200" />
        )}
      </motion.div>

      {/* Header */}
      <div className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <motion.div 
            className={`
              w-12 h-12 rounded-xl flex items-center justify-center
              bg-gradient-to-br ${getDepartmentGradient(cf.department ?? 'UNKNOWN')} 
              border shadow-soft
            `}
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <DepartmentIcon className="w-5 h-5 text-foreground/80" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground text-lg leading-tight mb-2 truncate" title={cf.categoryName ?? cf.name}>
              {cf.categoryName ?? cf.name}
            </h3>
            <div className="flex items-center space-x-2">
              <Badge 
                variant="outline" 
                className={`text-xs px-2 py-1 border ${getDepartmentBadgeColor(cf.department ?? 'UNKNOWN')}`}
              >
                {cf.department ?? 'UNKNOWN'}
              </Badge>
              {cf.subDepartment && (
                <span className="text-xs text-muted-foreground font-medium">
                  {cf.subDepartment}
                </span>
              )}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-4" title={cf.description}>
          {cf.description}
        </p>

        {/* Stats */}
        {showStats && (
          <div className="space-y-4">
            {/* Attributes Counter */}
            <div className="flex items-center justify-between p-3 bg-muted/40 rounded-lg">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">Attributes</span>
              </div>
              <span className="text-sm font-semibold text-foreground">
                {cf.enabledAttributes ?? 0}/{cf.totalAttributes ?? 0}
              </span>
            </div>

            {/* Completeness Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">Completeness</span>
                <span className={`text-xs font-semibold ${getCompletenessColor(completenessPercentage)}`}>
                  {completenessPercentage}%
                </span>
              </div>
              <div className="w-full bg-muted/60 rounded-full h-2 overflow-hidden">
                <motion.div
                  className={`h-2 rounded-full ${
                    completenessPercentage >= 80 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' :
                    completenessPercentage >= 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 
                    'bg-gradient-to-r from-red-500 to-red-400'
                  }`}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: `${completenessPercentage}%`, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Feature Pills */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3" />
                <span className="font-medium">AI Ready</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-primary">
                <Zap className="w-3 h-3" />
                <span className="font-medium">Fast Extract</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Status Badge */}
      {!cf.isActive && (
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="text-xs px-2 py-1 bg-muted text-muted-foreground">
            Inactive
          </Badge>
        </div>
      )}

      {/* Hover Glow Effect */}
      <motion.div
        className="absolute inset-0 rounded-lg pointer-events-none opacity-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      {/* Selection Highlight */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none border-2 border-primary/20"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
      )}
    </motion.div>
  )
})

export default CategoryCard