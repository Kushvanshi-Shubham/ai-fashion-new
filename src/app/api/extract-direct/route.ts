import { NextRequest, NextResponse } from 'next/server'
import { ExtractionService } from '@/lib/services/ai/ExtractionService'
import { validateImage } from '@/lib/validation'
import { prisma } from '@/lib/database'
import { rateLimit, RateLimitExceededError } from '@/lib/rate-limit'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_DIMENSION = 4096
const MIN_DIMENSION = 50

// Rate limiter - more generous for direct extraction
const extractionLimiter = rateLimit({
  interval: 60 * 1000,
  maxRequests: 10,
  blockDuration: 60 * 1000,
  maxStoreSize: 1000
})

export async function POST(request: NextRequest) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  
  console.log('[Direct Extract API] POST request received');
  
  try {
    // Apply rate limiting
    try {
      await extractionLimiter.check(request, 'DIRECT_EXTRACTION')
    } catch (error) {
      if (error instanceof RateLimitExceededError) {
        return NextResponse.json({
          success: false,
          error: 'Rate limit exceeded',
          code: 'RATE_LIMIT_EXCEEDED',
          requestId,
          retryAfter: error.retryAfter,
        }, { status: 429 })
      }
      throw error
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const categoryId = formData.get('categoryId') as string

    console.log(`[Direct Extract API] File: ${file ? file.name : 'null'}, CategoryId: ${categoryId || 'null'}`);

    // Validate inputs
    if (!file || !categoryId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: file and categoryId',
        code: 'MISSING_FIELDS',
        requestId,
      }, { status: 400 })
    }

    // Check environment
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'OpenAI API key not configured. Please check your environment variables.',
        code: 'MISSING_OPENAI_KEY',
        requestId,
      }, { status: 500 })
    }

    // Validate image
    const imageValidation = await validateImage(file, {
      maxSize: MAX_FILE_SIZE,
      allowedTypes: ALLOWED_TYPES,
      maxDimension: MAX_DIMENSION,
      minDimension: MIN_DIMENSION
    })

    if (!imageValidation.valid) {
      console.log(`[Direct Extract API] Image validation failed: ${imageValidation.error}`);
      return NextResponse.json({
        success: false,
        error: imageValidation.error,
        code: 'INVALID_IMAGE',
        requestId,
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
      }, { status: 404 })
    }

    const categoryPayload = await categoryResponse.json()
    const categoryData = (categoryPayload && typeof categoryPayload === 'object' && 'data' in categoryPayload)
      ? categoryPayload.data
      : categoryPayload

    if (!categoryData || !Array.isArray(categoryData.fields) || categoryData.fields.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid category data - no fields found',
        code: 'INVALID_CATEGORY_DATA',
        requestId,
      }, { status: 502 })
    }

    console.log(`[Direct Extract API] Processing with ${categoryData.fields.length} fields for category ${categoryData.categoryName}`);

    // Convert image to base64
    const imageBuffer = imageValidation.optimizedBuffer!

    // Initialize new extraction service
    const extractionService = new ExtractionService()
    
    // Convert fields to schema format for new service
    const schema = categoryData.fields.map((field: { key: string; label: string; type: string; required: boolean; options?: Array<{ shortForm: string; fullForm: string }> }) => ({
      key: field.key,
      label: field.label,
      type: field.type as 'text' | 'select' | 'number',
      required: field.required,
      allowedValues: field.options
    }))

    // Perform DIRECT extraction using NEW SERVICE (enhanced discovery mode)
    const startTime = Date.now()
    const base64Image = `data:${file.type};base64,${imageBuffer.toString('base64')}`
    const extractionResult = await extractionService.extractWithDiscovery(
      base64Image,
      schema,
      categoryData.categoryName,
      categoryData.fields
    )

    const processingTime = Date.now() - startTime

    // Convert attributes to format expected by frontend (using new AttributeDetail structure)
    const formattedAttributes: Record<string, { value: string | null; confidence: number; reasoning: string; fieldLabel: string; isValid: boolean }> = {};
    
    Object.entries(extractionResult.attributes).forEach(([key, attributeDetail]) => {
      if (!attributeDetail) return; // Skip null attributes
      
      const field = categoryData.fields.find((f: { key: string; label?: string }) => f.key === key);
      
      // Use the new AttributeDetail structure from old system
      const value = attributeDetail.schemaValue || attributeDetail.rawValue;
      const isDetected = value !== null && value !== undefined && value !== '';
      
      formattedAttributes[key] = {
        value: value ? String(value) : null,
        confidence: attributeDetail.visualConfidence,
        reasoning: attributeDetail.reasoning || (isDetected ? 'Detected in image' : 'Not detected in image'),
        fieldLabel: field?.label || key.replace(/[_-]/g, ' '),
        isValid: isDetected
      };
    });

    // Prepare result in the format expected by the frontend
    const result = {
      id: `result_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      fileName: file.name,
      status: 'completed' as const,
      categoryId: categoryData.categoryId,
      categoryName: categoryData.categoryName,
      attributes: formattedAttributes,
      confidence: extractionResult.overallConfidence || 0,
      tokensUsed: extractionResult.metadata.tokensUsed || 0,
      processingTime,
      modelUsed: 'gpt-4o',
      costUsd: 0,
      fromCache: false, // New service doesn't support caching yet
      createdAt: new Date().toISOString(),
      discoveries: extractionResult.discoveries || [] // Using actual discoveries from new service!
    }

    // Save to database for permanent storage (optional, doesn't block response)
    if (process.env.DATABASE_URL) {
      try {
        await prisma.extractionResult.create({
          data: {
            id: result.id,
            fileName: result.fileName,
            originalFileName: file.name,
            status: 'completed',
            categoryId: result.categoryId,
            categoryName: result.categoryName,
            attributes: JSON.parse(JSON.stringify(result.attributes)),
            confidence: result.confidence,
            tokensUsed: result.tokensUsed,
            processingTime: result.processingTime,
            modelUsed: result.modelUsed,
            costUsd: result.costUsd,
            fromCache: result.fromCache,
            jobId: `direct_${result.id}`,
            discoveries: JSON.parse(JSON.stringify(result.discoveries)),
          }
        })
        console.log(`[Direct Extract API] Saved result to database: ${result.id}`);
      } catch (dbError) {
        console.warn('[Direct Extract API] Failed to save to database:', dbError);
        // Don't fail the request if database save fails
      }
    }

    // Return immediate result (like your old project)
    return NextResponse.json({
      success: true,
      data: result,
      requestId,
      timestamp: new Date().toISOString()
    }, { status: 200 })

  } catch (error) {
    console.error('[Direct Extract API] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      success: false,
      error: errorMessage,
      code: 'EXTRACTION_ERROR',
      requestId,
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Direct AI Fashion Extraction API',
    version: '1.0.0',
    description: 'Immediate extraction results without job queuing',
    usage: 'POST with file and categoryId for instant results'
  })
}