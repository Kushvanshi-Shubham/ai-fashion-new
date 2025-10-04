import { NextRequest, NextResponse } from 'next/server'
import { CategoryFormData } from '@/types/fashion'
import { rateLimit } from '@/lib/rate-limit'
import { CategoryConfig } from '@/types/import-types'

interface CacheEntry {
  data: CategoryFormData
  expiry: number
}

// Cache for category data
const categoryCache = new Map<string, CacheEntry>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Rate limiting configuration
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  maxRequests: 60,
  blockDuration: 120 * 1000 // 2 minutes
})

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  try {
    // Apply rate limiting
    await limiter.check(request, 'CATEGORY_API') // 60 requests per minute
  } catch {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  // Validate category ID
  const categoryId = params.id
  if (!categoryId) {
    return NextResponse.json({ success: false, error: 'Missing category id', code: 'MISSING_CATEGORY_ID' }, { status: 400 })
  }

  if (!categoryId.match(/^[a-zA-Z0-9_-]+$/)) {
    return NextResponse.json({
      success: false,
      error: 'Invalid category ID format',
      code: 'INVALID_CATEGORY_ID'
    }, { status: 400 })
  }
  const startTime = Date.now()

  try {
    console.log(`📋 Loading category: ${categoryId}`)

    // Check cache first
    const cached = categoryCache.get(categoryId)
    if (cached && cached.expiry > Date.now()) {
      console.log(`✅ Cache hit for category: ${categoryId}`)
      return NextResponse.json({
        success: true,
        data: cached.data,
        fromCache: true,
        processingTime: Date.now() - startTime
      })
    }

    // Import data dynamically to avoid loading all at startup
    const { CATEGORY_DEFINITIONS } = await import('../../../../../data/categoryDefinitions')
    const { MASTER_ATTRIBUTES } = await import('../../../../../data/masterAttributes')

    // Find category
    const category = CATEGORY_DEFINITIONS.find((cat: CategoryConfig) => cat.id === categoryId)
    if (!category) {
      return NextResponse.json({
        success: false,
        error: `Category '${categoryId}' not found`,
        availableCategories: CATEGORY_DEFINITIONS.slice(0, 10).map((c: CategoryConfig) => c.id),
        code: 'CATEGORY_NOT_FOUND'
      }, { status: 404 })
    }

    // Generate form fields efficiently
    const fields = []
    let enabledCount = 0
    let aiExtractableCount = 0

    for (const [attributeKey, isEnabled] of Object.entries(category.attributes)) {
      if (!isEnabled) continue

      const attributeConfig = MASTER_ATTRIBUTES[attributeKey]
      if (!attributeConfig) {
        console.warn(`⚠️  Attribute definition missing: ${attributeKey}`)
        continue
      }

      // Parse options if they exist
      let options: { shortForm: string; fullForm: string }[] | undefined = undefined
      if (attributeConfig.allowedValues && Array.isArray(attributeConfig.allowedValues)) {
        // Limit options to prevent large payloads and convert to proper format
        options = attributeConfig.allowedValues.slice(0, 20).map((value: unknown) => {
          if (typeof value === 'string') {
            return { shortForm: value, fullForm: value }
          }
          if (value && typeof value === 'object' && 'shortForm' in value && 'fullForm' in value) {
            return { shortForm: String(value.shortForm), fullForm: String(value.fullForm) }
          }
          // Fallback for malformed data
          const stringValue = String(value)
          return { shortForm: stringValue, fullForm: stringValue }
        })
      }

      // Map attribute type to valid field types
      let fieldType: 'select' | 'text' | 'number' | 'boolean' = 'text'
      const attrType = attributeConfig.type?.toLowerCase()
      if (attrType === 'select' || (options && options.length > 0)) {
        fieldType = 'select'
      } else if (attrType === 'number' || attrType === 'numeric') {
        fieldType = 'number'
      } else if (attrType === 'boolean' || attrType === 'bool') {
        fieldType = 'boolean'
      }

      const field = {
        key: attributeKey,
        label: attributeConfig.label,
        type: fieldType,
        required: false, // Could be enhanced based on category rules
        ...(options && { options }),
        ...(attributeConfig.description && { description: attributeConfig.description }),
        aiExtractable: true,
        aiWeight: 1.0
      } as const

      fields.push(field)
      enabledCount++
      if (field.aiExtractable) aiExtractableCount++
    }

    // Sort fields by importance (those with options first, then by label)
    fields.sort((a, b) => {
      if (a.options && !b.options) return -1
      if (!a.options && b.options) return 1
      return a.label.localeCompare(b.label)
    })

    const formData: CategoryFormData = {
      categoryId: category.id,
      categoryCode: category.category || category.id,
      categoryName: category.displayName,
      department: category.department,
      subDepartment: category.subDepartment,
      description: category.description || `${category.department} ${category.subDepartment} category`,
      totalAttributes: Object.keys(category.attributes).length,
      enabledAttributes: enabledCount,
      isActive: category.isActive !== false,
      extractableAttributes: aiExtractableCount,
      fields: fields
    }

    // Cache the result
    categoryCache.set(categoryId, {
      data: formData,
      expiry: Date.now() + CACHE_TTL
    })

    // Cleanup cache periodically
    if (categoryCache.size > 100) {
      const now = Date.now()
      for (const [key, entry] of categoryCache.entries()) {
        if (entry.expiry <= now) {
          categoryCache.delete(key)
        }
      }
      console.log(`🧹 Category cache cleaned, size: ${categoryCache.size}`)
    }

    console.log(`📋 Category loaded: ${formData.categoryName} (${enabledCount}/${Object.keys(category.attributes).length} attributes)`)

    return NextResponse.json({
      success: true,
      data: formData,
      fromCache: false,
      processingTime: Date.now() - startTime,
      metadata: {
        totalAttributesInCategory: Object.keys(category.attributes).length,
        enabledAttributes: enabledCount,
        aiExtractableAttributes: aiExtractableCount,
        attributesWithOptions: fields.filter(f => f.options).length
      }
    })

  } catch (_error) {
    console.error(`❌ Category loading failed for ${categoryId}:`, _error)

    return NextResponse.json({
      success: false,
      error: 'Failed to load category configuration',
      details: _error instanceof Error ? _error.message : 'Unknown error',
      categoryId,
      processingTime: Date.now() - startTime,
      code: 'CATEGORY_LOAD_ERROR'
    }, { status: 500 })
  }
}

// Health check endpoint
export async function HEAD(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  const categoryId = params.id
  
  try {
    const { CATEGORY_DEFINITIONS } = await import('../../../../../data/categoryDefinitions')
    const exists = CATEGORY_DEFINITIONS.some((cat: CategoryConfig) => cat.id === categoryId)
    
    return new NextResponse(null, { 
      status: exists ? 200 : 404,
      headers: {
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'X-Category-Exists': exists.toString()
      }
    })
  } catch (error) {
    console.error('Health check failed:', error instanceof Error ? error.message : 'Unknown error')
    return new NextResponse(null, { status: 500 })
  }
}