import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Extract API called')
    
    const body = await request.json()
    const { imageUrl, categoryId } = body
    
    console.log('📷 Image URL:', imageUrl)
    console.log('🏷️  Category ID:', categoryId)
    
    if (!imageUrl || !categoryId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: imageUrl and categoryId' 
        },
        { status: 400 }
      )
    }
    
    // For now, return a mock response to test the endpoint
    const mockResult = {
      success: true,
      data: {
        requestId: crypto.randomUUID(),
        categoryId,
        extractedAttributes: {
          "color_-_main": "BLU",
          "neck": "RN_NK",
          "length": "REGULAR"
        },
        confidence: 0.85,
        processingTime: 1500,
        aiModel: "gpt-4-vision-preview",
        cost: 0.0234,
        attributeCount: {
          total: 44,
          enabled: 25,
          extracted: 3,
          withValues: 3
        }
      }
    }
    
    console.log('✅ Returning mock result')
    return NextResponse.json(mockResult)
    
  } catch (error) {
    console.error('❌ Extract API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'API error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Extract API is working. Use POST method with imageUrl and categoryId.' 
  })
}
