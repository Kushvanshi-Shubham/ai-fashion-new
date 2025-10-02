
'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  Sparkles, 
  Zap, 
  Shield, 
  BarChart3, 
  Upload, 
  Brain, 
  Clock,
  ArrowRight,
  Tags,
  Database
} from 'lucide-react'

export default function HomePage() {
  const features = [
    {
      icon: <Tags className="w-6 h-6" />,
      title: "Category-Driven Extraction",
      description: "Select Department → Sub-department → Category to define exactly which attributes to extract",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Brain className="w-6 h-6" />,
      title: "AI-Powered Analysis", 
      description: "GPT-4 Vision analyzes images and extracts only relevant attributes for your selected category",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Fast & Accurate",
      description: "Get precise fashion attribute extraction in seconds with industry-leading accuracy",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Database className="w-6 h-6" />,
      title: "Rich Data Tables",
      description: "Export results to Excel, CSV, or JSON with comprehensive data management features", 
      color: "from-green-500 to-emerald-500"
    }
  ]

  const stats = [
    { label: "Categories", value: "283", description: "Across all departments" },
    { label: "Attributes", value: "80+", description: "Detailed fashion properties" },
    { label: "Accuracy", value: "95%+", description: "AI extraction precision" },
    { label: "Speed", value: "3s", description: "Average processing time" }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Fashion Extractor</h1>
                <p className="text-sm text-gray-500">v2.0 - Category-Driven Analysis</p>
              </div>
            </div>

            <nav className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Admin
              </Link>
              <Link
                href="/analytics" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Analytics
              </Link>
              <Link
                href="/rich-tables"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Rich Tables
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16"
        >
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Powered by GPT-4 Vision</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Fashion 
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}Analysis
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12">
            Revolutionary category-driven extraction system. Select your fashion category, 
            upload images, and get precise AI analysis of only the attributes that matter.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link href="/category-workflow">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Upload className="w-5 h-5" />
                <span>Start Category Workflow</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </Link>
            
            <Link href="/rich-tables">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-full sm:w-auto bg-white text-gray-700 border-2 border-gray-300 px-8 py-4 rounded-lg font-semibold text-lg hover:border-gray-400 transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <BarChart3 className="w-5 h-5" />
                <span>View Rich Tables</span>
              </motion.button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm font-medium text-gray-600 mb-1">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.description}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pb-16"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Revolutionary Category-Driven Approach
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Unlike traditional tools that extract everything, our system only analyzes 
              attributes relevant to your selected fashion category.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start space-x-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-lg flex items-center justify-center text-white`}>
                    {feature.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Workflow Preview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="pb-16"
        >
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Simple 4-Step Workflow
              </h2>
              <p className="text-lg text-gray-600">
                Get started with category-driven AI extraction in just a few clicks
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { 
                  step: 1, 
                  title: "Select Category", 
                  description: "Choose Department → Sub-department → Major Category",
                  icon: <Tags className="w-6 h-6" />
                },
                { 
                  step: 2, 
                  title: "Review Attributes", 
                  description: "Preview which attributes will be extracted",
                  icon: <BarChart3 className="w-6 h-6" />
                },
                { 
                  step: 3, 
                  title: "Upload Images", 
                  description: "Add fashion images for AI analysis",
                  icon: <Upload className="w-6 h-6" />
                },
                { 
                  step: 4, 
                  title: "Get Results", 
                  description: "View and export detailed extraction results",
                  icon: <Shield className="w-6 h-6" />
                }
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white mx-auto mb-4">
                    {item.icon}
                  </div>
                  <div className="text-sm font-semibold text-blue-600 mb-2">
                    Step {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center mt-8">
              <Link href="/category-workflow">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2 mx-auto"
                >
                  <Clock className="w-5 h-5" />
                  <span>Try Category Workflow</span>
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
            </div>
          </div>
        </motion.div>
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
              <span>283 Categories</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}