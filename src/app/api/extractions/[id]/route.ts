import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const extraction = await prisma.extraction.findUnique({
      where: { id: params.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            description: true,
            attributes: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    })

    if (!extraction) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Extraction not found',
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: crypto.randomUUID()
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: extraction,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    })

  } catch (error) {
    console.error('Extraction fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch extraction',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      },
      { status: 500 }
    )
  }
}
