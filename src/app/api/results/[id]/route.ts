import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Result ID is required',
        code: 'MISSING_ID'
      }, { status: 400 })
    }

    const result = await prisma.extractionResult.findUnique({
      where: { id }
    })

    if (!result) {
      return NextResponse.json({
        success: false,
        error: 'Extraction result not found',
        code: 'NOT_FOUND'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('[Results API] Error fetching extraction result:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch extraction result',
      code: 'FETCH_FAILED'
    }, { status: 500 })
  }
}