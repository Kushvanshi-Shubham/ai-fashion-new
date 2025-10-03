import { NextResponse } from 'next/server'

// Response cache
import type { CategoryListResponse } from '@/types/fashion'

let cachedResponse: { data: CategoryListResponse, timestamp: number } | null = null
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutes

export async function GET(request: Request) {
  const startTime = Date.now()
  const url = new URL(request.url)
  const limit = parseInt(url.searchParams.get('limit') || '50')
  const offset = parseInt(url.searchParams.get('offset') || '0')
  const department = url.searchParams.get('department')
  const search = url.searchParams.get('search')

  try {
    // Check cache for basic request (no filters)
    if (!department && !search && offset === 0 && limit === 50) {
      if (cachedResponse && (Date.now() - cachedResponse.timestamp) < CACHE_DURATION) {
        console.log('✅ Returning cached categories response')
        return NextResponse.json({
          ...cachedResponse.data,
          fromCache: true,
          processingTime: Date.now() - startTime
        })
      }
    }

    // Load data efficiently
    const { CATEGORY_DEFINITIONS } = await import('../../../data/categoryDefinitions')
    
    // Apply filters
    type CategoryRaw = {
      id: string
      displayName: string
      description?: string
      department: string
      subDepartment: string
      isActive?: boolean
      attributes?: Record<string, unknown>
      createdAt?: string
    }

  // CATEGORY_DEFINITIONS may have richer types (Date etc.) — cast via unknown to our narrow view
  let filteredCategories = (CATEGORY_DEFINITIONS as unknown) as CategoryRaw[]

    if (department) {
      filteredCategories = filteredCategories.filter((cat) => 
        cat.department.toLowerCase() === department.toLowerCase()
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filteredCategories = filteredCategories.filter((cat) =>
        cat.displayName.toLowerCase().includes(searchLower) ||
        cat.id.toLowerCase().includes(searchLower) ||
        cat.department.toLowerCase().includes(searchLower) ||
        cat.subDepartment.toLowerCase().includes(searchLower)
      )
    }

    // Apply pagination
    const total = filteredCategories.length
    const paginatedCategories = filteredCategories.slice(offset, offset + limit)

    // Format response efficiently
    const formattedCategories = paginatedCategories.map((cat) => {
      const enabledCount = Object.values(cat.attributes ?? {}).filter(Boolean).length
      const totalCount = Object.keys(cat.attributes ?? {}).length

      return {
        id: cat.id,
        name: cat.displayName,
        description: cat.description || `${cat.department} ${cat.subDepartment} category`,
        department: cat.department,
        subDepartment: cat.subDepartment,
        isActive: cat.isActive !== false,
        enabledAttributes: enabledCount,
        totalAttributes: totalCount,
        completeness: totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0,
        createdAt: cat.createdAt || new Date('2024-01-01').toISOString()
      }
    })

    // Generate summary statistics
    const summary = {
      total,
      returned: formattedCategories.length,
      offset,
      limit,
      hasMore: (offset + limit) < total,
      byDepartment: {
        KIDS: filteredCategories.filter((c) => c.department === 'KIDS').length,
        MENS: filteredCategories.filter((c) => c.department === 'MENS').length,
        LADIES: filteredCategories.filter((c) => c.department === 'LADIES').length
      },
      avgAttributesPerCategory: Math.round(
        filteredCategories.reduce((sum: number, cat) => 
          sum + Object.values(cat.attributes ?? {}).filter(Boolean).length, 0
        ) / Math.max(filteredCategories.length, 1)
      )
    }

    const response = {
      success: true,
      data: {
        categories: formattedCategories,
        pagination: {
          offset,
          limit,
          total,
          hasMore: summary.hasMore
        },
        summary,
        filters: {
          department: department || null,
          search: search || null
        }
      },
      fromCache: false,
      processingTime: Date.now() - startTime,
      metadata: {
        apiVersion: '2.0.0',
        dataVersion: '1.0.0',
        timestamp: new Date().toISOString()
      }
    }

    // Cache basic response (no filters)
    if (!department && !search && offset === 0 && limit === 50) {
      cachedResponse = {
        data: response.data,
        timestamp: Date.now()
      }
    }

    console.log(`📊 Categories loaded: ${formattedCategories.length}/${total} (${Date.now() - startTime}ms)`)
    return NextResponse.json(response)

  } catch (_error) {
    console.error('Categories API error:', _error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to load categories',
      details: _error instanceof Error ? _error.message : 'Unknown error',
      processingTime: Date.now() - startTime,
      code: 'CATEGORIES_LOAD_ERROR'
    }, { status: 500 })
  }
}

// Health check endpoint
export async function HEAD() {
  try {
    const { CATEGORY_DEFINITIONS } = await import('../../../data/categoryDefinitions')
    const count = CATEGORY_DEFINITIONS.length
    
    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Total-Categories': count.toString(),
        'Cache-Control': 'public, max-age=300',
        'X-API-Version': '2.0.0'
      }
    })
  } catch {
    return new NextResponse(null, { status: 500 })
  }
}

// Clear cache endpoint (for admin use)
export async function DELETE() {
  cachedResponse = null
  return NextResponse.json({
    success: true,
    message: 'Category cache cleared'
  })
}
