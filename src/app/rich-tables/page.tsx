'use client'

import React from 'react'
import { ExtractionTableManager } from '@/components/tables/ExtractionTableManager'
import { ExtractionResult } from '@/types/fashion'
import { toast } from 'sonner'

// Sample data for demonstration
const sampleResults: ExtractionResult[] = [
  {
    id: '1',
    fileName: 'summer_dress_blue.jpg',
    status: 'completed',
    attributes: {
      category: { value: 'Dress', confidence: 95, reasoning: 'Clear dress silhouette', fieldLabel: 'Category', isValid: true },
      color: { value: 'Blue', confidence: 92, reasoning: 'Dominant blue color', fieldLabel: 'Primary Color', isValid: true },
      material: { value: 'Cotton', confidence: 88, reasoning: 'Fabric texture visible', fieldLabel: 'Material', isValid: true },
      size: { value: 'M', confidence: 85, reasoning: 'Standard medium fit', fieldLabel: 'Size', isValid: true },
      brand: { value: 'Zara', confidence: 78, reasoning: 'Brand tag visible', fieldLabel: 'Brand', isValid: true },
      price: { value: '$89.99', confidence: 90, reasoning: 'Price tag clearly visible', fieldLabel: 'Price', isValid: true },
      style: { value: 'Casual', confidence: 87, reasoning: 'Casual design elements', fieldLabel: 'Style', isValid: true },
      season: { value: 'Summer', confidence: 93, reasoning: 'Light fabric, sleeveless', fieldLabel: 'Season', isValid: true }
    },
    confidence: 89,
    tokensUsed: 1250,
    processingTime: 3200,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    fromCache: false
  },
  {
    id: '2',
    fileName: 'winter_jacket_black.jpg',
    status: 'completed',
    attributes: {
      category: { value: 'Jacket', confidence: 98, reasoning: 'Clearly a jacket', fieldLabel: 'Category', isValid: true },
      color: { value: 'Black', confidence: 96, reasoning: 'Solid black color', fieldLabel: 'Primary Color', isValid: true },
      material: { value: 'Polyester', confidence: 82, reasoning: 'Synthetic material appearance', fieldLabel: 'Material', isValid: true },
      size: { value: 'L', confidence: 80, reasoning: 'Large size indicated', fieldLabel: 'Size', isValid: true },
      brand: { value: 'North Face', confidence: 91, reasoning: 'Brand logo visible', fieldLabel: 'Brand', isValid: true },
      price: { value: '$199.99', confidence: 88, reasoning: 'Price on label', fieldLabel: 'Price', isValid: true },
      style: { value: 'Outdoor', confidence: 89, reasoning: 'Outdoor jacket features', fieldLabel: 'Style', isValid: true },
      season: { value: 'Winter', confidence: 95, reasoning: 'Heavy insulation visible', fieldLabel: 'Season', isValid: true }
    },
    confidence: 90,
    tokensUsed: 1180,
    processingTime: 2800,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
    fromCache: false
  },
  {
    id: '3',
    fileName: 'sneakers_white_nike.jpg',
    status: 'completed',
    attributes: {
      category: { value: 'Sneakers', confidence: 97, reasoning: 'Athletic shoe design', fieldLabel: 'Category', isValid: true },
      color: { value: 'White', confidence: 94, reasoning: 'Predominantly white', fieldLabel: 'Primary Color', isValid: true },
      material: { value: 'Leather', confidence: 85, reasoning: 'Leather upper visible', fieldLabel: 'Material', isValid: true },
      size: { value: '9.5', confidence: 83, reasoning: 'Size marking visible', fieldLabel: 'Size', isValid: true },
      brand: { value: 'Nike', confidence: 99, reasoning: 'Nike swoosh logo', fieldLabel: 'Brand', isValid: true },
      price: { value: '$129.99', confidence: 86, reasoning: 'Price sticker present', fieldLabel: 'Price', isValid: true },
      style: { value: 'Athletic', confidence: 92, reasoning: 'Sports shoe design', fieldLabel: 'Style', isValid: true }
    },
    confidence: 91,
    tokensUsed: 1320,
    processingTime: 3600,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
    fromCache: false
  },
  {
    id: '4',
    fileName: 'jeans_denim_blue.jpg',
    status: 'processing',
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() // 5 minutes ago
  },
  {
    id: '5',
    fileName: 'shirt_cotton_plaid.jpg',
    status: 'failed',
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    error: 'Image quality too low for accurate extraction'
  },
  {
    id: '6',
    fileName: 'handbag_leather_brown.jpg',
    status: 'completed',
    attributes: {
      category: { value: 'Handbag', confidence: 96, reasoning: 'Clear handbag structure', fieldLabel: 'Category', isValid: true },
      color: { value: 'Brown', confidence: 93, reasoning: 'Rich brown leather', fieldLabel: 'Primary Color', isValid: true },
      material: { value: 'Leather', confidence: 91, reasoning: 'Genuine leather texture', fieldLabel: 'Material', isValid: true },
      brand: { value: 'Coach', confidence: 87, reasoning: 'Coach logo embossed', fieldLabel: 'Brand', isValid: true },
      price: { value: '$349.99', confidence: 89, reasoning: 'Price tag visible', fieldLabel: 'Price', isValid: true },
      style: { value: 'Professional', confidence: 86, reasoning: 'Business-appropriate design', fieldLabel: 'Style', isValid: true }
    },
    confidence: 90,
    tokensUsed: 1420,
    processingTime: 3900,
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
    fromCache: false
  },
  {
    id: '7',
    fileName: 'watch_gold_luxury.jpg',
    status: 'completed',
    attributes: {
      category: { value: 'Watch', confidence: 99, reasoning: 'Clearly a wristwatch', fieldLabel: 'Category', isValid: true },
      color: { value: 'Gold', confidence: 95, reasoning: 'Gold-tone metal', fieldLabel: 'Primary Color', isValid: true },
      material: { value: 'Stainless Steel', confidence: 88, reasoning: 'Metal construction', fieldLabel: 'Material', isValid: true },
      brand: { value: 'Rolex', confidence: 94, reasoning: 'Rolex crown logo', fieldLabel: 'Brand', isValid: true },
      price: { value: '$8,999.99', confidence: 76, reasoning: 'Luxury price point estimated', fieldLabel: 'Price', isValid: false },
      style: { value: 'Luxury', confidence: 98, reasoning: 'High-end design elements', fieldLabel: 'Style', isValid: true }
    },
    confidence: 92,
    tokensUsed: 1680,
    processingTime: 4200,
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 minutes ago
    fromCache: true
  }
]

export default function RichDataTablesDemo() {
  const handleRetry = (resultId: string) => {
    toast.info(`Retrying extraction for result ${resultId}`)
    // In real implementation, this would trigger a retry
    console.log('Retrying extraction for:', resultId)
  }

  const handleImageClick = (imageUrl: string, fileName?: string) => {
    toast.info(`Opening image: ${fileName || imageUrl}`)
    // In real implementation, this would open image in a modal or new tab
    console.log('Opening image:', { imageUrl, fileName })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Rich Data Tables Demo
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            Comprehensive extraction results table with inline editing, sorting, filtering, and bulk operations
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="text-sm font-medium text-blue-800 mb-2">Features Demonstrated:</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-blue-700">
              <div>• Inline attribute editing</div>
              <div>• Advanced sorting & filtering</div>
              <div>• Multi-row selection</div>
              <div>• Bulk edit operations</div>
              <div>• Bulk download (Excel)</div>
              <div>• Expandable row details</div>
              <div>• Status indicators</div>
              <div>• Confidence scoring</div>
              <div>• Professional layout</div>
            </div>
          </div>
        </div>

        {/* Rich Data Table */}
        <ExtractionTableManager
          results={sampleResults}
          onRetry={handleRetry}
          onImageClick={handleImageClick}
          className="mb-8"
        />

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Use</h2>
          <div className="space-y-4 text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Table Features:</h3>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Sorting:</strong> Click column headers to sort by that field</li>
                <li>• <strong>Filtering:</strong> Use the filter controls to narrow down results</li>
                <li>• <strong>Row Expansion:</strong> Click the chevron to see all attributes</li>
                <li>• <strong>Inline Editing:</strong> Click any attribute value to edit it directly</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Bulk Operations:</h3>
              <ul className="space-y-1 ml-4">
                <li>• <strong>Selection:</strong> Check rows to select them for bulk operations</li>
                <li>• <strong>Bulk Edit:</strong> Edit attributes across multiple selected items</li>
                <li>• <strong>Download:</strong> Export selected results to Excel format</li>
                <li>• <strong>Retry:</strong> Retry failed extractions in bulk</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Status Indicators:</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span>Completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                  <span>Processing</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span>Failed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded-full bg-gray-400"></div>
                  <span>Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}