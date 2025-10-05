import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const categoryId = searchParams.get('categoryId')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const search = searchParams.get('search')

    // Build where clause
    const where: Record<string, unknown> = {}
    
    if (status) {
      where.status = status
    }
    
    if (categoryId) {
      where.categoryId = categoryId
    }
    
    if (search) {
      where.OR = [
        { fileName: { contains: search, mode: 'insensitive' } },
        { originalFileName: { contains: search, mode: 'insensitive' } },
        { categoryName: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Calculate pagination
    const skip = (page - 1) * limit

    // Fetch results with pagination
    const [results, totalCount] = await Promise.all([
      prisma.extractionResult.findMany({
        where,
        orderBy: {
          [sortBy]: sortOrder
        },
        skip,
        take: limit,
      }),
      prisma.extractionResult.count({ where })
    ])

    // Calculate summary stats
    const stats = await prisma.extractionResult.aggregate({
      where,
      _count: { id: true },
      _avg: { 
        confidence: true,
        tokensUsed: true,
        processingTime: true
      },
      _sum: {
        tokensUsed: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        results,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + results.length < totalCount
        },
        stats: {
          total: stats._count.id || 0,
          avgConfidence: Math.round(stats._avg.confidence || 0),
          avgProcessingTime: Math.round(stats._avg.processingTime || 0),
          totalTokens: stats._sum.tokensUsed || 0
        }
      }
    })
  } catch (error) {
    console.error('[Results API] Error fetching extraction results:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch extraction results',
      code: 'FETCH_FAILED'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Result ID is required',
        code: 'MISSING_ID'
      }, { status: 400 })
    }

    await prisma.extractionResult.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Extraction result deleted successfully'
    })
  } catch (error) {
    console.error('[Results API] Error deleting extraction result:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to delete extraction result',
      code: 'DELETE_FAILED'
    }, { status: 500 })
  }
}