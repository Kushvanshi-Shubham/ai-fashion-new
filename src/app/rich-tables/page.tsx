'use client'

import React, { useState } from 'react'
import { DataTable } from '@/components/ui/data-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ExtractionResult, CompletedExtractionResult } from '@/types/fashion'
import { toast } from 'sonner'
import { Download, RefreshCw, Eye, Edit, CheckCircle, XCircle, Clock } from 'lucide-react'

// Type guard to check if result is completed
function isCompletedResult(result: ExtractionResult): result is CompletedExtractionResult {
  return result.status === 'completed'
}

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

export default function RichTablesPage() {
  const [loading, setLoading] = useState(false)

  // Transform fashion extraction data for the DataTable
  const tableData = sampleResults.map(result => ({
    id: result.id,
    fileName: result.fileName,
    status: result.status,
    confidence: isCompletedResult(result) ? result.confidence || 0 : 0,
    tokensUsed: isCompletedResult(result) ? result.tokensUsed || 0 : 0,
    processingTime: isCompletedResult(result) ? result.processingTime || 0 : 0,
    createdAt: result.createdAt,
    category: isCompletedResult(result) ? result.attributes?.category?.value || 'N/A' : 'N/A',
    color: isCompletedResult(result) ? result.attributes?.color?.value || 'N/A' : 'N/A',
    brand: isCompletedResult(result) ? result.attributes?.brand?.value || 'N/A' : 'N/A',
    price: isCompletedResult(result) ? result.attributes?.price?.value || 'N/A' : 'N/A'
  }))

  const columns = [
    {
      key: 'fileName' as const,
      header: 'File Name',
      sortable: true,
      render: (item: typeof tableData[0]) => (
        <div className="font-medium text-sm">{item.fileName}</div>
      )
    },
    {
      key: 'status' as const,
      header: 'Status',
      sortable: true,
      render: (item: typeof tableData[0]) => {
        const statusConfig = {
          completed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
          processing: { variant: 'secondary' as const, icon: Clock, color: 'text-blue-600' },
          failed: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
          pending: { variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' }
        }
        const config = statusConfig[item.status as keyof typeof statusConfig] || statusConfig.pending
        const Icon = config.icon
        
        return (
          <Badge variant={config.variant} className="gap-1">
            <Icon className="w-3 h-3" />
            {item.status}
          </Badge>
        )
      }
    },
    {
      key: 'category' as const,
      header: 'Category',
      sortable: true,
      render: (item: typeof tableData[0]) => (
        <Badge variant="outline">{item.category}</Badge>
      )
    },
    {
      key: 'color' as const,
      header: 'Color',
      sortable: true
    },
    {
      key: 'brand' as const,
      header: 'Brand',
      sortable: true
    },
    {
      key: 'price' as const,
      header: 'Price',
      sortable: true,
      render: (item: typeof tableData[0]) => (
        <span className="font-mono text-sm">{item.price}</span>
      )
    },
    {
      key: 'confidence' as const,
      header: 'Confidence',
      sortable: true,
      render: (item: typeof tableData[0]) => (
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium">{item.confidence}%</div>
          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${item.confidence}%` }}
            />
          </div>
        </div>
      )
    },
    {
      key: 'tokensUsed' as const,
      header: 'Tokens',
      sortable: true,
      render: (item: typeof tableData[0]) => (
        <span className="text-xs font-mono">{item.tokensUsed?.toLocaleString()}</span>
      )
    },
    {
      key: 'processingTime' as const,
      header: 'Time (ms)',
      sortable: true,
      render: (item: typeof tableData[0]) => (
        <span className="text-xs font-mono">{item.processingTime?.toLocaleString()}</span>
      )
    },
    {
      key: 'actions' as const,
      header: 'Actions',
      render: (item: typeof tableData[0]) => (
        <div className="flex gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => handleView(item.id)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => handleEdit(item.id)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0"
            onClick={() => handleDownload(item.id)}
          >
            <Download className="w-4 h-4" />
          </Button>
          {item.status === 'failed' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0"
              onClick={() => handleRetry(item.id)}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      )
    }
  ]

  const handleView = (id: string) => {
    console.log('Viewing:', id)
    toast.info('View Details', { description: `Opening details for extraction ${id}` })
  }

  const handleEdit = (id: string) => {
    console.log('Editing:', id)
    toast.info('Edit Mode', { description: `Editing extraction ${id}` })
  }

  const handleRetry = (id: string) => {
    console.log('Retrying:', id)
    toast.success('Retry Started', { description: 'Re-processing the extraction...' })
  }

  const handleDownload = (id: string) => {
    console.log('Downloading:', id)
    toast.success('Download Started', { description: 'Preparing extraction data...' })
  }

  const handleRefresh = () => {
    setLoading(true)
    console.log('Refreshing data...')
    toast.info('Refreshing', { description: 'Fetching latest extraction results...' })
    
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
      toast.success('Data Updated', { description: 'Extraction results refreshed' })
    }, 1500)
  }

  const handleExport = (selectedItems: typeof tableData) => {
    console.log('Exporting:', selectedItems.length, 'items')
    toast.success('Export Started', { 
      description: `Exporting ${selectedItems.length} extraction results to CSV` 
    })
  }

  const handleRowClick = (item: typeof tableData[0]) => {
    console.log('Row clicked:', item)
    toast.info('Row Selected', { description: `Selected extraction: ${item.fileName}` })
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Fashion Extraction Results</h1>
        <p className="text-xl text-muted-foreground max-w-3xl">
          Advanced data tables showcasing AI fashion extraction results with sorting, filtering, 
          and interactive features. Manage and analyze your fashion attribute data efficiently.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Extractions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sampleResults.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {sampleResults.filter(r => r.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {sampleResults.filter(r => r.status === 'processing').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(sampleResults.reduce((acc, r) => acc + (isCompletedResult(r) ? r.confidence || 0 : 0), 0) / sampleResults.length)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <div className="space-y-6">
        <DataTable
          data={tableData}
          columns={columns}
          title="Extraction Results"
          description="AI-powered fashion attribute extraction results with comprehensive data analysis"
          loading={loading}
          searchable
          filterable
          selectable
          exportable
          refreshable
          onRefresh={handleRefresh}
          onExport={handleExport}
          onRowClick={handleRowClick}
          emptyState={{
            title: 'No extractions found',
            description: 'Start processing fashion images to see extraction results here',
            action: { label: 'New Extraction', onClick: () => console.log('Navigate to upload') }
          }}
        />
      </div>
    </div>
  )
}
