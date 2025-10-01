'use client'

import { Category } from '@/types'
import { Check, Tag, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryCardProps {
  category: Category
  isSelected: boolean
  onSelect: (category: Category) => void
  showDetails?: boolean
  className?: string
}

export default function CategoryCard({ 
  category, 
  isSelected, 
  onSelect, 
  showDetails = true,
  className 
}: CategoryCardProps) {
  const activeAttributes = category.attributes?.filter(attr => attr.isActive) || []
  const aiExtractableCount = activeAttributes.filter(attr => attr.aiExtractable).length

  return (
    <div
      className={cn(
        "relative border rounded-lg p-6 cursor-pointer transition-all duration-200 hover:shadow-lg group",
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200 dark:bg-blue-900/20 dark:border-blue-400 dark:ring-blue-800"
          : "border-gray-200 hover:border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        className
      )}
      onClick={() => onSelect(category)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(category)
        }
      }}
      aria-pressed={isSelected}
      aria-label={`Select ${category.name} category`}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center">
          <Check className="w-4 h-4" />
        </div>
      )}

      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <Tag className={cn(
              "w-5 h-5",
              isSelected ? "text-blue-600" : "text-gray-500"
            )} />
            <h3 className={cn(
              "text-lg font-semibold",
              isSelected ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-gray-100"
            )}>
              {category.name}
            </h3>
          </div>
          
          <Settings className={cn(
            "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
            isSelected ? "text-blue-600" : "text-gray-400"
          )} />
        </div>

        {/* Description */}
        {category.description && (
          <p className={cn(
            "text-sm leading-relaxed",
            isSelected ? "text-blue-700 dark:text-blue-200" : "text-gray-600 dark:text-gray-300"
          )}>
            {category.description}
          </p>
        )}

        {/* Details */}
        {showDetails && (
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className={cn(
                "flex items-center space-x-1",
                isSelected ? "text-blue-600 dark:text-blue-300" : "text-gray-500 dark:text-gray-400"
              )}>
                <span className="font-medium">{activeAttributes.length}</span>
                <span>attributes</span>
              </span>
              
              <span className={cn(
                "flex items-center space-x-1",
                isSelected ? "text-blue-600 dark:text-blue-300" : "text-gray-500 dark:text-gray-400"
              )}>
                <span className="font-medium">{aiExtractableCount}</span>
                <span>AI-enabled</span>
              </span>
            </div>

            {/* Active Status */}
            <div className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              category.isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
            )}>
              {category.isActive ? 'Active' : 'Inactive'}
            </div>
          </div>
        )}

        {/* Attributes Preview */}
        {showDetails && activeAttributes.length > 0 && (
          <div className="space-y-2">
            <div className={cn(
              "text-xs font-medium",
              isSelected ? "text-blue-700 dark:text-blue-200" : "text-gray-700 dark:text-gray-300"
            )}>
              Key Attributes:
            </div>
            <div className="flex flex-wrap gap-1">
              {activeAttributes.slice(0, 4).map((attr) => (
                <span
                  key={attr.id}
                  className={cn(
                    "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                    isSelected
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                    !attr.aiExtractable && "opacity-60"
                  )}
                >
                  {attr.label}
                  {!attr.aiExtractable && (
                    <span className="ml-1 opacity-60">•</span>
                  )}
                </span>
              ))}
              {activeAttributes.length > 4 && (
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  isSelected
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-800/30 dark:text-blue-300"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                )}>
                  +{activeAttributes.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
