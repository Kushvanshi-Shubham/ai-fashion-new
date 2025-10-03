'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Settings, 
  BarChart3, 
  Database,
  Users,
  Shield,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

import { CardList } from '@/components/ui/card-list'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading'
import { Category } from '@/types'
import { CategoryFormData } from '@/types'

interface AdminStats {
  totalCategories: number
  totalAttributes: number
  extractableAttributes: number
  recentExtractions: number
  activeUsers: number
}

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [, setSelectedCategory] = useState<CategoryFormData | null>(null)
  const [stats, setStats] = useState<AdminStats>({
    totalCategories: 0,
    totalAttributes: 0,
    extractableAttributes: 0,
    recentExtractions: 0,
    activeUsers: 0
  })

  useEffect(() => {
    fetchCategories()
    fetchStats()
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

  const fetchStats = async () => {
    try {
      // Mock stats for now - replace with actual API call
      setStats({
        totalCategories: 283,
        totalAttributes: 850,
        extractableAttributes: 625,
        recentExtractions: 1247,
        activeUsers: 42
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  // Convert categories to CardList format
  const categoryCards = categories.map(category => ({
    id: category.id,
    title: `${category.department} → ${category.subDepartment}`,
    description: `${category.name} - ${category.totalAttributes || 0} total attributes`,
    status: category.isActive ? 'active' as const : 'inactive' as const,
    tags: [`${category.totalAttributes || 0} attributes`],
    metadata: {
      'Category Name': category.name,
      'Enabled': category.enabledAttributes || 0,
      'Department': category.department
    },
    actions: [
      {
        label: 'Edit Category',
        icon: <Settings className="w-4 h-4" />,
        onClick: () => setSelectedCategory({
          categoryId: category.id,
          categoryCode: category.id, // Using id as code
          categoryName: category.name,
          department: category.department,
          subDepartment: category.subDepartment,
          description: category.description,
          isActive: category.isActive,
          totalAttributes: category.totalAttributes || 0,
          enabledAttributes: category.enabledAttributes || 0,
          extractableAttributes: category.enabledAttributes || 0,
          fields: []
        })
      },
      {
        label: 'View Analytics',
        icon: <BarChart3 className="w-4 h-4" />,
        onClick: () => console.log('Analytics for', category.id)
      }
    ]
  }))



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">
            Manage categories, attributes, and system settings
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" asChild>
            <Link href="/analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </Link>
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Category
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Categories</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Categories</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.filter(c => c.isActive).length}</div>
            <p className="text-xs text-muted-foreground">
              Currently enabled
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Extractable Attributes</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.extractableAttributes}</div>
            <p className="text-xs text-muted-foreground">
              AI-powered extraction
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Management */}
      {loading ? (
        <Card>
          <CardContent className="p-12">
            <div className="flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          </CardContent>
        </Card>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <EmptyState
              title="No Categories Found"
              description="Get started by creating your first fashion category"
              icon={<Settings className="w-12 h-12" />}
              action={{
                label: "Create Category",
                onClick: () => console.log('Create category')
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <CardList
          items={categoryCards}
          title="Category Management"
          description="Manage fashion categories, attributes, and configurations"
          searchable={true}
          sortable={true}
          layout="grid"
          gridCols={3}
          onItemClick={(item) => {
            const category = categories.find(c => c.id === item.id)
            if (category) {
              setSelectedCategory({
                categoryId: category.id,
                categoryCode: category.id,
                categoryName: category.name,
                department: category.department,
                subDepartment: category.subDepartment,
                description: category.description,
                isActive: category.isActive,
                totalAttributes: category.totalAttributes || 0,
                enabledAttributes: category.enabledAttributes || 0,
                extractableAttributes: category.enabledAttributes || 0,
                fields: []
              })
            }
          }}
        />
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common administrative tasks and utilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Upload className="w-6 h-6" />
              <span>Import Categories</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Download className="w-6 h-6" />
              <span>Export Data</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <RefreshCw className="w-6 h-6" />
              <span>Sync Attributes</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Shield className="w-6 h-6" />
              <span>Manage Users</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
