import { NextRequest, NextResponse } from 'next/server'
import { FashionAIService } from '@/lib/ai/fashion-ai-service'

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  
  try {
    console.log(`🚀 New extraction request: ${requestId}`)
    
    const { imageUrl, categoryId } = await request.json()
    
    if (!imageUrl || !categoryId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: imageUrl and categoryId' 
        },
        { status: 400 }
      )
    }
    
    console.log(`📷 Image: ${imageUrl}`)
    console.log(`🏷️  Category: ${categoryId}`)
    
    // Get category form data (using your existing API)
    const categoryResponse = await fetch(
      `${request.nextUrl.origin}/api/categories/${categoryId}/form`
    )
    
    if (!categoryResponse.ok) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      )
    }
    
    const categoryResult = await categoryResponse.json()
    if (!categoryResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to load category data' },
        { status: 500 }
      )
    }
    
    const categoryData = categoryResult.data
    console.log(`📋 Category loaded: ${categoryData.categoryName} (${categoryData.enabledAttributes} attributes)`)
    
    // Validate image URL format
    if (!imageUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && !imageUrl.startsWith('data:image/')) {
      return NextResponse.json(
        { success: false, error: 'Invalid image format. Supported: jpg, jpeg, png, gif, webp' },
        { status: 400 }
      )
    }
    
    // Call AI service
    const extractionResult = await FashionAIService.extractAttributes(
      imageUrl,
      categoryData
    )
    
    console.log(`✅ Extraction completed for ${requestId}`)
    
    // Return comprehensive result
    return NextResponse.json({
      success: extractionResult.success,
      data: {
        requestId,
        categoryId,
        categoryName: categoryData.categoryName,
        department: categoryData.department,
        subDepartment: categoryData.subDepartment,
        
        // Extraction results
        extractedAttributes: extractionResult.attributes,
        confidence: extractionResult.confidence,
        
        // Metadata
        processingTime: extractionResult.processingTime,
        aiModel: extractionResult.aiModel,
        
        // Usage statistics
        tokenUsage: extractionResult.tokenUsage,
        cost: extractionResult.cost,
        
        // Debugging info
        errors: extractionResult.errors || [],
        attributeCount: {
          total: categoryData.totalAttributes,
          enabled: categoryData.enabledAttributes,
          extracted: Object.keys(extractionResult.attributes).length,
          withValues: Object.values(extractionResult.attributes).filter(v => v !== null).length
        }
      }
    })
    
  } catch (error) {
    console.error(`❌ Extraction failed for ${requestId}:`, error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'AI extraction failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        requestId
      },
      { status: 500 }
    )
  }
}
