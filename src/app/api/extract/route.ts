import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RateLimitExceededError } from '@/lib/rate-limit'
import { prisma } from '@/lib/database'
import { resolveModel } from '@/lib/ai/model-pricing'
import { CategoryFormData } from '@/types/fashion'
import { validateImage } from '@/lib/validation'
import { addJob } from '@/lib/queue/job-manager'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_DIMENSION = 4096
const MIN_DIMENSION = 50

// Rate limiter for extractions - 10 requests per minute
const extractionLimiter = rateLimit({
  interval: 60 * 1000,
  maxRequests: 20, // Increased for async flow
  blockDuration: 60 * 1000, // Block for 1 minute
  maxStoreSize: 1000
})

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
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

    const categoryPayload = await categoryResponse.json()
    const categoryData: CategoryFormData = (categoryPayload && typeof categoryPayload === 'object' && 'data' in categoryPayload)
      ? (categoryPayload.data as CategoryFormData)
      : (categoryPayload as CategoryFormData)

    if (!categoryData || !Array.isArray(categoryData.fields) || categoryData.fields.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category data received from categories service',
        code: 'INVALID_CATEGORY_DATA',
        requestId,
        timestamp: new Date().toISOString()
      }, { status: 502 })
    }

    // Create and queue the job
    const selectedModel = resolveModel()
    const job = addJob({
      imageBuffer: imageValidation.optimizedBuffer!,
      imageType: file.type,
      category: categoryData,
      model: selectedModel,
    });

    // Return a 202 Accepted response
    return NextResponse.json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        message: 'Extraction job has been queued.',
        timestamp: new Date().toISOString(),
      },
       rateLimit: {
        remaining: rateLimitInfo.remaining,
        reset: new Date(rateLimitInfo.reset).toISOString(),
        total: rateLimitInfo.total
      }
    }, { 
      status: 202,
      headers: {
        'Location': `/api/extract/status/${job.id}`,
        'X-RateLimit-Remaining': rateLimitInfo.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimitInfo.reset).toISOString(),
        'X-RateLimit-Total': rateLimitInfo.total.toString()
      }
    });
    
  } catch (error) {
    console.error('Extraction job creation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = 'JOB_CREATION_FAILED'
    
    // Log failed attempt for analytics
    if (process.env.DATABASE_URL) {
      try {
        await prisma.extractionEvent.create({
          data: {
            categoryCode: 'UNKNOWN',
            status: 'FAILED',
            fromCache: false,
            errorCode,
            errorMessage,
            aiModel: 'gpt-4-vision-preview'
          }
        })
      } catch (err) {
        console.warn('[analytics] Failed to persist failed job creation event', err)
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: errorCode,
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 500 })
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
