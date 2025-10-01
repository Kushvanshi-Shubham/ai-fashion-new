'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Zap, Shield, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { Category } from '@/types'
import CategoryCard from '@/components/CategoryCard'
import ImageUpload from '@/components/ImageUpload'
import ExtractionResults from '@/components/ExtractionResults'
import { useExtractionStore } from '@/store/useExtractionStore'

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showDemo, setShowDemo] = useState(false)

  const {
    selectedCategory,
    uploadedImages,
    results,
    isProcessing,
    currentProgress,
    error,
    setCategory,
    addImages,
    clearImages,
    startExtraction,
    setError
  } = useExtractionStore()

  // Wrap fetchCategories in useCallback to satisfy eslint deps
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories')
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        setCategories(result.data)
      } else {
        setCategories([]) // fallback to empty array
        setError('Failed to load categories')
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err)
      setCategories([]) // fallback to empty array
      setError('Failed to connect to server')
    } finally {
      setLoading(false)
    }
  }, [setError])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleImageUpload = (files: File[]) => {
    addImages(files)
    setError(undefined)
  }

  const handleCategorySelect = (category: Category) => {
    setCategory(selectedCategory?.id === category.id ? undefined : category)
    setError(undefined)
  }

  const handleStartExtraction = async () => {
    if (!selectedCategory) {
      setError('Please select a category first')
      return
    }

    if (uploadedImages.length === 0) {
      setError('Please upload at least one image')
      return
    }

    const firstImage = uploadedImages[0]
    await startExtraction(firstImage.id)
  }

  const handleClearAll = () => {
    clearImages()
    setCategory(undefined)
    setError(undefined)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl font-medium text-gray-700 dark:text-gray-300">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                AI Fashion Extractor
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Extract fashion attributes with AI precision
              </p>
            </div>
          </div>

          <nav className="flex items-center space-x-4">
            <Link href="/admin" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
              Admin
            </Link>
            <Link href="/analytics" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors">
              Analytics
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            AI-Powered Fashion Analysis
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            Upload fashion images and let our advanced AI extract detailed attributes 
            like color, material, style, and more with industry-leading accuracy.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <div className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4 mr-2" />3s Processing
            </div>
            <div className="flex items-center px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4 mr-2" />95%+ Accuracy
            </div>
            <div className="flex items-center px-4 py-2 bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded-full text-sm font-medium">
              <BarChart3 className="w-4 h-4 mr-2" />Advanced AI
            </div>
          </div>
        </motion.div>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-800 dark:text-red-300 font-medium">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Section */}
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
          <div className="mb-6">
            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Upload Fashion Images</h3>
            <p className="text-gray-600 dark:text-gray-300">Drag and drop or click to upload images of clothing items for AI analysis</p>
          </div>
          <ImageUpload onUpload={handleImageUpload} maxFiles={5} disabled={isProcessing} />
        </motion.section>

        {/* Category Selection */}
        {uploadedImages.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 border border-gray-200 dark:border-gray-700">
            <div className="mb-6">
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">Select Category</h3>
              <p className="text-gray-600 dark:text-gray-300">Choose the category that best describes your uploaded items</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(categories || []).map((category) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  isSelected={selectedCategory?.id === category.id}
                  onSelect={handleCategorySelect}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Action Buttons */}
        {uploadedImages.length > 0 && selectedCategory && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="text-center mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={handleStartExtraction} disabled={isProcessing} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold rounded-lg text-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed min-w-[200px]">
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 inline mr-2" />
                    Start AI Extraction
                  </>
                )}
              </button>
              <button onClick={handleClearAll} disabled={isProcessing} className="px-6 py-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Clear All
              </button>
            </div>
          </motion.section>
        )}
      </main>
    </div>
  )
}
