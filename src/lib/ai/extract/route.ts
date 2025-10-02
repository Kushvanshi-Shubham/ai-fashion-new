import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { aiService } from '../ai-services'
import { ExtractionResult } from '@/types/fashion'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export async function POST(this: any, request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    console.log(`🚀 [${requestId}] Starting extraction request`)

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const categoryId = formData.get('categoryId') as string
    const options = formData.get('options') ? JSON.parse(formData.get('options') as string) : {}

    // Validation
    if (!file) {
      return NextResponse.json({
        success: false,
        error: 'No file provided',
        requestId,
        code: 'FILE_MISSING'
      }, { status: 400 })
    }

    if (!categoryId) {
      return NextResponse.json({
        success: false,
        error: 'Category ID is required',
        requestId,
        code: 'CATEGORY_MISSING'
      }, { status: 400 })
    }

    // File validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}`,
        requestId,
        code: 'INVALID_FILE_TYPE'
      }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `File too large: ${Math.round(file.size / 1024 / 1024)}MB. Maximum: ${MAX_FILE_SIZE / 1024 / 1024}MB`,
        requestId,
        code: 'FILE_TOO_LARGE'
      }, { status: 400 })
    }

    // Get category data
    const categoryResponse = await fetch(`${request.nextUrl.origin}/api/categories/${categoryId}/form`, {
      cache: 'force-cache'
    })

    if (!categoryResponse.ok) {
      return NextResponse.json({
        success: false,
        error: `Category not found: ${categoryId}`,
        requestId,
        code: 'CATEGORY_NOT_FOUND'
      }, { status: 404 })
    }

    const categoryResult = await categoryResponse.json()
    if (!categoryResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to load category configuration',
        requestId,
        code: 'CATEGORY_CONFIG_ERROR'
      }, { status: 500 })
    }

    const categoryData = categoryResult.data
    console.log(`📋 [${requestId}] Category: ${categoryData.categoryName} (${categoryData.enabledAttributes} attributes)`)

    // Process image
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Optimize image with Sharp
    let optimizedBuffer: Buffer
    try {
      const image = sharp(buffer)
      const metadata = await image.metadata()
      
      console.log(`🖼️  [${requestId}] Original: ${metadata.width}x${metadata.height}, ${Math.round(buffer.length / 1024)}KB`)

      // Optimize for AI processing
      optimizedBuffer = await image
        .resize(1024, 1024, { 
          fit: 'inside', 
          withoutEnlargement: true 
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toBuffer()

      console.log(`✨ [${requestId}] Optimized: ${Math.round(optimizedBuffer.length / 1024)}KB`)

    } catch (imageError) {
      console.error(`❌ [${requestId}] Image processing failed:`, imageError)
      return NextResponse.json({
        success: false,
        error: 'Invalid or corrupted image file',
        requestId,
        code: 'IMAGE_PROCESSING_ERROR'
      }, { status: 400 })
    }

    // AI extraction
    console.log(`🧠 [${requestId}] Starting AI analysis...`)
    const extractionResult = await aiService.extractAttributes(
      optimizedBuffer,
      categoryData,
      options
    )

    if (extractionResult.status === 'failed') {
      console.error(`❌ [${requestId}] AI extraction failed:`, extractionResult.error)
      return NextResponse.json({
        success: false,
        error: 'AI extraction failed',
        details: extractionResult.error,
        requestId,
        code: 'AI_EXTRACTION_ERROR'
      }, { status: 500 })
    }

    // Calculate success metrics
    const totalAttributes = Object.keys(extractionResult.attributes).length
    const extractedAttributes = Object.values(extractionResult.attributes)
      .filter(attr => attr.value !== null).length
    const successRate = totalAttributes > 0 ? extractedAttributes / totalAttributes : 0

    // Comprehensive response
    const response = {
      success: true,
      data: {
        requestId,
        timestamp: new Date().toISOString(),

        // File info
        file: {
          name: file.name,
          size: file.size,
          type: file.type,
          optimizedSize: optimizedBuffer.length
        },

        // Category info
        category: {
          id: categoryId,
          name: categoryData.categoryName,
          department: categoryData.department,
          subDepartment: categoryData.subDepartment,
          totalAttributes: categoryData.totalAttributes,
          enabledAttributes: categoryData.enabledAttributes
        },

        // Extraction results
        extraction: {
          id: extractionResult.id,
          status: extractionResult.status,
          attributes: extractionResult.attributes,
          confidence: extractionResult.confidence,
          fromCache: extractionResult.fromCache || false
        },

        // Performance metrics
        performance: {
          processingTime: Date.now() - startTime,
          aiProcessingTime: extractionResult.processingTime,
          tokensUsed: extractionResult.tokensUsed,
          cost: this.calculateCost(extractionResult.tokensUsed)
        },

        // Quality metrics
        metrics: {
          totalAttributes,
          extractedAttributes,
          successRate: Math.round(successRate * 100),
          confidenceDistribution: this.calculateConfidenceDistribution(extractionResult.attributes)
        }
      }
    }

    console.log(`✅ [${requestId}] Extraction completed: ${Math.round(successRate * 100)}% success rate`)
    return NextResponse.json(response)

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ [${requestId}] Request failed after ${processingTime}ms:`, error)

    return NextResponse.json({
      success: false,
      error: 'Internal server error during extraction',
      details: error instanceof Error ? error.message : 'Unknown error',
      requestId,
      processingTime,
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    const healthCheck = await aiService.healthCheck()
    const stats = aiService.getStats()

    return NextResponse.json({
      service: 'AI Fashion Extraction API',
      status: 'active',
      version: '2.0.0',
      health: healthCheck,
      statistics: stats,
      timestamp: new Date().toISOString(),
      limits: {
        maxFileSize: `${MAX_FILE_SIZE / 1024 / 1024}MB`,
        allowedTypes: ALLOWED_TYPES
      }
    })
  } catch (error) {
    return NextResponse.json({
      service: 'AI Fashion Extraction API',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to calculate API cost
interface BatchExtractionResult {
  id: string
  success: boolean
  result?: ExtractionResult
  error?: string
}

// Batch size for concurrent processing
const BATCH_SIZE = 3

async function processBatch(images: File[], categoryId: string): Promise<BatchExtractionResult[]> {
  const results: BatchExtractionResult[] = []
  
  // Process images in parallel within batch size limit
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE)
    const batchPromises = batch.map(async (image) => {
      try {
        const result = await aiService.extractAttributes(image, categoryId)
        return {
          id: crypto.randomUUID(),
          success: true,
          result
        }
      } catch (error) {
        return {
          id: crypto.randomUUID(),
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })
    
    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
  }
  
  return results
}

function calculateCost(tokens: number): number {
  // GPT-4 Vision optimized pricing
  const inputRate = 0.01  // $0.01 per 1K input tokens
  const outputRate = 0.03 // $0.03 per 1K output tokens
  
  // Dynamic token split based on response size
  const inputTokens = Math.round(tokens * 0.7)
  const outputTokens = Math.round(tokens * 0.3)
  
  return (inputTokens * inputRate + outputTokens * outputRate) / 1000
}

// Helper function to calculate confidence distribution
function calculateConfidenceDistribution(attributes: Record<string, any>) {
  const confidences = Object.values(attributes)
    .map((attr: any) => attr.confidence)
    .filter(conf => conf > 0)

  if (confidences.length === 0) {
    return { high: 0, medium: 0, low: 0 }
  }

  const high = confidences.filter(c => c >= 80).length
  const medium = confidences.filter(c => c >= 60 && c < 80).length
  const low = confidences.filter(c => c < 60).length

  return {
    high: Math.round((high / confidences.length) * 100),
    medium: Math.round((medium / confidences.length) * 100),
    low: Math.round((low / confidences.length) * 100)
  }
}