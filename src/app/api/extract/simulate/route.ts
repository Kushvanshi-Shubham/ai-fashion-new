import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { delay } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const startTime = Date.now()

  try {
    const formData = await request.formData()
    const image = formData.get('image') as File
    const categoryId = formData.get('categoryId') as string

    if (!image || !categoryId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: image and categoryId',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId
          }
        },
        { status: 400 }
      )
    }

    // Validate file type
    if (!image.type.startsWith('image/')) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid file type. Please upload an image file.',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId
          }
        },
        { status: 400 }
      )
    }

    // Get category with attributes
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        attributes: {
          where: { isActive: true, aiExtractable: true },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Category not found',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId
          }
        },
        { status: 404 }
      )
    }

    // Create image URL (in real app, this would be uploaded to storage)
    const imageUrl = URL.createObjectURL(image)

    // Simulate processing time
    await delay(2000 + Math.random() * 2000) // 2-4 seconds

    // Generate simulated extraction results
    const extractedData: Record<string, any> = {}
    const confidenceScores: Record<string, number> = {}

    for (const attribute of category.attributes) {
      let value = null
      const confidence = 0.7 + Math.random() * 0.25 // 0.7-0.95

      if (attribute.type === 'SELECT' && attribute.options) {
        const options = JSON.parse(attribute.options as string)
        if (options && options.length > 0) {
          const randomOption = options[Math.floor(Math.random() * options.length)]
          value = randomOption.value
        }
      } else if (attribute.type === 'TEXT') {
        value = `Simulated ${attribute.label.toLowerCase()}`
      } else if (attribute.type === 'NUMBER') {
        value = Math.floor(Math.random() * 100) + 1
      } else if (attribute.type === 'BOOLEAN') {
        value = Math.random() > 0.5
      } else if (attribute.type === 'COLOR') {
        const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']
        value = colors[Math.floor(Math.random() * colors.length)]
      }

      if (value !== null) {
        extractedData[attribute.key] = value
        confidenceScores[attribute.key] = confidence
      }
    }

    const processingTime = Date.now() - startTime
    const overallConfidence = Object.values(confidenceScores).reduce((a, b) => a + b, 0) / Object.values(confidenceScores).length

    // Create extraction record
    const extraction = await prisma.extraction.create({
      data: {
        imageUrl: `simulated-${requestId}`,
        imageMetadata: {
          width: 800,
          height: 600,
          format: image.type,
          size: image.size,
          name: image.name
        },
        categoryId: category.id,
        extractedData: {
          ...extractedData,
          confidence_scores: confidenceScores,
          metadata: {
            total_attributes: category.attributes.length,
            extracted_attributes: Object.keys(extractedData).length,
            avg_confidence: overallConfidence
          }
        },
        confidence: overallConfidence,
        aiModel: 'simulation-model-v1',
        promptVersion: 'v1.0',
        processingTime,
        tokenUsage: 150 + Math.floor(Math.random() * 200),
        cost: 0.05 + Math.random() * 0.1,
        status: 'COMPLETED',
        sessionId: requestId
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: extraction,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        processingTime
      }
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error('Extraction simulation error:', error)

    return NextResponse.json(
      { 
        success: false, 
        error: 'Extraction simulation failed',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          processingTime
        }
      },
      { status: 500 }
    )
  }
}
