'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, Plus, Settings, BarChart3 } from 'lucide-react'
import { Category } from '@/types'
import CategoryCard from '@/components/CategoryCard'
import { CategoryFormData } from '@/types'

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<CategoryFormData | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      const result = await response.json()
      
      if (result.success) {
        setCategories(result.data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Admin Panel
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage categories, attributes, and system settings
                </p>
              </div>
            </div>
            
            <nav className="flex items-center space-x-3">
              <Link
                href="/analytics"
                className="btn btn-outline"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Analytics
              </Link>
              <button className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Category
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading categories...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Categories</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{categories.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Categories</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {categories.filter(c => c.isActive).length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Attributes</p>
                              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                                {categories.reduce((acc, cat) => {
                                  // `Category` type in this app uses `totalAttributes`/`enabledAttributes` fields
                                  return acc + (typeof cat.totalAttributes === 'number' ? cat.totalAttributes : 0)
                                }, 0)}
                              </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Plus className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Categories Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Categories
                </h2>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {categories.length} total
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    isSelected={selectedCategory?.categoryId === category.id}
                    onSelect={(c) => setSelectedCategory(c)}
                  />
                ))}
              </div>
            </div>

            {/* Empty State */}
            {categories.length === 0 && (
              <div className="text-center py-12">
                <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No Categories Found
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Get started by creating your first category
                </p>
                <button className="btn btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Category
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
