import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitExceededError } from '@/lib/rate-limit'

import { aiService } from '@/lib/ai/ai-services'
import { CategoryFormData } from '@/types/fashion'
import { validateImage } from '@/lib/validation'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_DIMENSION = 4096
const MIN_DIMENSION = 50

// Rate limiter for extractions - 10 requests per minute
const extractionLimiter = rateLimit({
  interval: 60 * 1000,
  maxRequests: 10,
  blockDuration: 120 * 1000, // Block for 2 minutes if exceeded
  maxStoreSize: 1000
})

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()
  let rateLimitInfo;

  try {
    // Apply rate limiting
    try {
      rateLimitInfo = await extractionLimiter.check(request, 'EXTRACTION')
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          requestId,
          retryAfter: error.retryAfter,
          timestamp: new Date().toISOString()
        }, {
        status: 429,
        headers: new Headers({
          'Retry-After': Math.ceil(error.retryAfter / 1000).toString(),
          'X-RateLimit-Reset': new Date(Date.now() + error.retryAfter).toISOString()
        })
      })
      }
      throw error
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categoryId = formData.get('categoryId') as string

    // Validate inputs
    if (!file || !categoryId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        code: 'MISSING_FIELDS',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Validate image
    const imageValidation = await validateImage(file, {
      maxSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_TYPES,
      maxDimension: MAX_DIMENSION,
      minDimension: MIN_DIMENSION
    })

    if (!imageValidation.valid) {
      return NextResponse.json({
        success: false,
        error: imageValidation.error,
        code: 'INVALID_IMAGE',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    // Get category data
    const categoryResponse = await fetch(`${request.nextUrl.origin}/api/categories/${categoryId}/form`)
    
    if (!categoryResponse.ok) {
      return NextResponse.json({
        success: false,
        error: 'Category not found',
        code: 'INVALID_CATEGORY',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 404 })
    }

    // The categories API returns a wrapped response { success, data, ... }
    const categoryPayload = await categoryResponse.json()
    // Support both wrapped and raw CategoryFormData shapes
    const categoryData: CategoryFormData = (categoryPayload && typeof categoryPayload === 'object' && 'data' in categoryPayload)
      ? (categoryPayload.data as CategoryFormData)
      : (categoryPayload as CategoryFormData)

    // Validate categoryData shape
    if (!categoryData || !Array.isArray(categoryData.fields) || categoryData.fields.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category data received from categories service',
        code: 'INVALID_CATEGORY_DATA',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 502 })
    }

    // Process image with AI
      const extractionResult = await aiService.extractAttributes(
      imageValidation.optimizedBuffer!,
      categoryData,
      {
        model: 'gpt-4-vision-preview',
        maxTokens: 1500,
        temperature: 0.1,
        cacheEnabled: true,
        cacheTTL: 3600 * 24
      }
    )
    
    const processingTime = Date.now() - startTime
    const timestamp = new Date().toISOString()

    return NextResponse.json({
      success: true,
      data: {
        requestId,
        timestamp,
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          optimizedSize: imageValidation.optimizedBuffer!.length
        },
        category: {
          id: categoryId,
          name: categoryData.categoryName,
          department: categoryData.department,
          subDepartment: categoryData.subDepartment,
          totalAttributes: categoryData.totalAttributes,
          enabledAttributes: categoryData.enabledAttributes
        },
        extraction: extractionResult,
        performance: {
          processingTime,
          optimizationTime: imageValidation.metadata?.duration || 0
        }
      },
      rateLimit: {
        remaining: rateLimitInfo.remaining,
        reset: new Date(rateLimitInfo.reset).toISOString(),
        total: rateLimitInfo.total
      }
    }, {
      headers: {
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitInfo.reset).toISOString(),
        'X-RateLimit-Total': rateLimitInfo.total.toString()
      }
    })
    
  } catch (error) {
    console.error('Extraction error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = error instanceof Error ? (error.name === 'RateLimitExceededError' ? 'RATE_LIMIT_EXCEEDED' : 'EXTRACTION_ERROR') : 'UNKNOWN_ERROR'
    
    const statusCode = errorCode === 'RATE_LIMIT_EXCEEDED' ? 429 : 500
    const responseInit: ResponseInit = { status: statusCode }
    if (error instanceof RateLimitExceededError) {
      responseInit.headers = new Headers({
        'Retry-After': Math.ceil(error.retryAfter / 1000).toString(),
        'X-RateLimit-Reset': new Date(Date.now() + error.retryAfter).toISOString()
      })
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode,
      requestId,
      timestamp: new Date().toISOString()
    }, responseInit)
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'AI Fashion Extraction API',
    version: '2.0.0',
    endpoints: {
      post: {
        description: 'Extract attributes from fashion image',
        accepts: 'multipart/form-data',
        required: ['file', 'categoryId'],
        limits: {
          maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
          allowedTypes: ALLOWED_TYPES,
          maxDimension: `${MAX_DIMENSION}px`,
          minDimension: `${MIN_DIMENSION}px`,
          rateLimit: {
            maxRequests: 10,
            interval: '1 minute',
            blockDuration: '2 minutes'
          }
        }
      }
    }
  })
}
