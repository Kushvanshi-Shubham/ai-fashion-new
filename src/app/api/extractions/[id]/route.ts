// src/app/api/extractions/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params
  try {
    const id = params.id
    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing extraction id' }, { status: 400 })
    }

    const extraction = await prisma.extraction.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            code: true,
            displayName: true,
            description: true,
            attributeConfigs: {
              where: { isEnabled: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                attribute: true
              }
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
  } catch (_error) {
    console.error('Extraction fetch error:', _error)
    return NextResponse.json(
      {
        success: false,
  error: 'Failed to fetch extraction',
  details: _error instanceof Error ? _error.message : 'Unknown error',
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: crypto.randomUUID()
        }
      },
      { status: 500 }
    )
  }
}
