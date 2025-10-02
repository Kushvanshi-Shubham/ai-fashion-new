
'use client'
import React, { Suspense } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Zap, Shield, BarChart3, Upload, Brain, Clock } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useExtraction } from '@/hooks/useExtraction'
import { useCategoryManagement } from '@/hooks/useExtraction'

// Dynamically import heavy components to improve initial load
const CategoryCard = dynamic(() => import('@/components/CategoryCard'), {
  loading: () => <CategoryCardSkeleton />,
  ssr: false
})

const ImageUpload = dynamic(() => import('@/components/ImageUpload'), {
  loading: () => <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />,
  ssr: false
})

const ExtractionResults = dynamic(() => import('@/components/ExtractionResults'), {
  loading: () => <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />,
  ssr: false
})

// Loading skeleton component
const CategoryCardSkeleton = () => (
  <div className="p-4 border-2 border-gray-200 bg-white rounded-lg animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-gray-300 rounded" />
        <div className="w-24 h-4 bg-gray-300 rounded" />
      </div>
      <div className="w-5 h-5 bg-gray-300 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="w-full h-3 bg-gray-300 rounded" />
      <div className="w-3/4 h-3 bg-gray-300 rounded" />
    </div>
    <div className="mt-3 space-y-2">
      <div className="flex justify-between">
        <div className="w-16 h-3 bg-gray-300 rounded" />
        <div className="w-8 h-3 bg-gray-300 rounded" />
      </div>
      <div className="w-full h-2 bg-gray-200 rounded">
        <div className="w-1/2 h-2 bg-gray-300 rounded" />
      </div>
    </div>
  </div>
)

export default function HomePage() {
  const {
    selectedCategory,
    uploadedImages,
    results,
    isProcessing,
    error,
    stats,
    selectCategory,
    addImages,
    startExtraction,
    retryExtraction,
    clearError,
    canStartExtraction
  } = useExtraction({
    autoProcess: false,
    retryOnError: false,
    onSuccess: (result) => {
      console.log('Extraction completed:', result)
    },
    onError: (error) => {
      console.error('Extraction error:', error)
    }
  })

  const { 
    categories, 
    loading: categoriesLoading, 
    error: categoriesError,
    loadCategories 
  } = useCategoryManagement()

  // Handle image upload
  const handleImageUpload = (files: File[]) => {
    addImages(files)
    clearError()
  }

  // Handle category selection
  const handleCategorySelect = (category: any) => {
    selectCategory(category)
    clearError()
  }

  // Handle extraction start
  const handleStartExtraction = async () => {
    if (!canStartExtraction) {
      if (!selectedCategory) {
        // Error handling is done in the hook
        return
      }
    }
    
    await startExtraction()
  }

  // Handle retry
  const handleRetryExtraction = async (resultId: string) => {
    const imageId = uploadedImages.find(img => img.id === resultId)?.id
    if (imageId) {
      await retryExtraction(imageId)
    }
  }

  // Handle file download
  const handleDownloadResult = (result: any) => {
    const data = {
      fileName: result.fileName,
      status: result.status,
      confidence: result.confidence,
      attributes: result.attributes,
      processingTime: result.processingTime,
      tokensUsed: result.tokensUsed,
      createdAt: result.createdAt
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { 
      type: 'application/json' 
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extraction-${result.fileName}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Clear all data
  const handleClearAll = () => {
    // This would be handled by the store's cleanup method
    window.location.reload() // Simple approach for now
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Fashion Extractor</h1>
                <p className="text-sm text-gray-500">v2.0 - Advanced AI Analysis</p>
              </div>
            </div>

            {/* Stats in header */}
            {stats.total > 0 && (
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
                  <div className="text-gray-500">Processed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-green-600">{stats.successRate}%</div>
                  <div className="text-gray-500">Success</div>
                </div>
                {stats.completed > 0 && (
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {Math.round(stats.completed > 0 ? results.reduce((sum, r) => sum + r.confidence, 0) / stats.completed : 0)}%
                    </div>
                    <div className="text-gray-500">Avg Confidence</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>Powered by GPT-4 Vision</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Fashion Analysis
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Upload fashion images and let our advanced AI extract detailed attributes 
            like color, material, style, and more with industry-leading accuracy.
          </p>

          {/* Feature highlights */}
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>3s Processing</span>
            </div>
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>95%+ Accuracy</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>Advanced AI</span>
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-red-800 font-medium">Error</span>
              </div>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Dismiss
              </button>
            </div>
            <p className="text-red-700 mt-1">{error}</p>
          </motion.div>
        )}

        {/* Categories Error */}
        {categoriesError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-yellow-800 font-medium">Categories Loading Error</span>
              </div>
              <button
                onClick={() => loadCategories()}
                className="text-yellow-600 hover:text-yellow-800 text-sm"
              >
                Retry
              </button>
            </div>
            <p className="text-yellow-700 mt-1">{categoriesError}</p>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Upload and Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center space-x-2 mb-4">
                <Upload className="w-5 h-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900">Upload Fashion Images</h2>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">
                Drag and drop or click to upload images of clothing items for AI analysis
              </p>

              <Suspense fallback={<div className="h-32 bg-gray-100 rounded-lg animate-pulse" />}>
                <ImageUpload
                  onFilesSelected={handleImageUpload}
                  disabled={isProcessing}
                  existingFiles={uploadedImages.map(img => ({
                    id: img.id,
                    name: img.file.name,
                    size: img.file.size,
                    type: img.file.type,
                    preview: img.preview,
                    status: img.status,
                    progress: img.progress,
                    error: img.error
                  }))}
                  onRemoveFile={(id) => {
                    // Handle remove through store
                    // This would be implemented in the store
                  }}
                />
              </Suspense>
            </motion.div>

            {/* Action Buttons */}
            {uploadedImages.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {uploadedImages.length} image{uploadedImages.length !== 1 ? 's' : ''} ready
                    </span>
                    <span className="text-sm text-gray-600">
                      {selectedCategory ? `Category: ${selectedCategory.categoryName}` : 'No category selected'}
                    </span>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleStartExtraction}
                      disabled={!canStartExtraction}
                      className={`
                        flex-1 px-4 py-2 rounded-md font-medium transition-all duration-200
                        ${canStartExtraction
                          ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }
                      `}
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processing...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Zap className="w-4 h-4" />
                          <span>Start Extraction</span>
                        </div>
                      )}
                    </button>

                    <button
                      onClick={handleClearAll}
                      disabled={isProcessing}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md font-medium transition-colors"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column - Categories and Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Category Selection */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-5 h-5 bg-purple-500 rounded flex items-center justify-center">
                    <span className="text-white text-xs">🏷️</span>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Select Category</h2>
                </div>
                
                {selectedCategory && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ {selectedCategory.categoryName}
                  </div>
                )}
              </div>
              
              <p className="text-gray-600 text-sm mb-6">
                Choose the category that best describes your uploaded items
              </p>

              {categoriesLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <CategoryCardSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                  <Suspense fallback={
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <CategoryCardSkeleton key={i} />
                      ))}
                    </div>
                  }>
                    {categories.map((category) => (
                      <CategoryCard
                        key={category.id}
                        category={category}
                        isSelected={selectedCategory?.categoryId === category.id}
                        onSelect={handleCategorySelect}
                        disabled={isProcessing}
                      />
                    ))}
                  </Suspense>
                </div>
              )}
            </motion.div>

            {/* Results Section */}
            {results.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Suspense fallback={<div className="h-64 bg-gray-100 rounded-lg animate-pulse" />}>
                  <ExtractionResults
                    results={results}
                    onRetry={handleRetryExtraction}
                    onDownload={handleDownloadResult}
                  />
                </Suspense>
              </motion.div>
            )}
          </div>
        </div>

        {/* Processing Progress */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-x-0 bottom-6 max-w-md mx-auto px-4"
          >
            <div className="bg-white rounded-lg shadow-lg border p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">AI Analysis in Progress</div>
                  <div className="text-xs text-gray-500">
                    Processing {stats.processing} of {stats.total} images...
                  </div>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.total > 0 ? ((stats.completed + stats.failed) / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              © 2024 AI Fashion Extractor. Powered by advanced AI technology.
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>v2.0</span>
              <span>•</span>
              <span>GPT-4 Vision</span>
              <span>•</span>
              <span>{categories.length} Categories</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}