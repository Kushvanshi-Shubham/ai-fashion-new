import { NextRequest, NextResponse } from 'next/server'
import { discoveryManager } from '@/lib/services/discoveryManager'
import type { DiscoveryApiResponse, DiscoverySettings } from '@/types/discovery'

// Get discoveries for a category
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const { searchParams } = new URL(request.url)
  const categoryId = searchParams.get('categoryId')
  const promotable = searchParams.get('promotable') === 'true'

  try {
    const discoveries = promotable 
      ? discoveryManager.getPromotableDiscoveries()
      : discoveryManager.getDiscoveriesForCategory(categoryId || undefined)
    
    const stats = discoveryManager.getDiscoveryStats(categoryId || undefined)
    
    const settings: DiscoverySettings = {
      enabled: true,
      minConfidence: 75,
      showInTable: true,
      autoPromote: false,
      maxDiscoveries: 50
    }

    const response: DiscoveryApiResponse = {
      success: true,
      data: {
        discoveries,
        stats,
        settings
      },
      processingTime: Date.now() - startTime
    }

    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[Discovery API] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get discoveries',
      processingTime: Date.now() - startTime
    }, { status: 500 })
  }
}

// Clear discoveries (admin/development endpoint)
export async function DELETE() {
  try {
    discoveryManager.clear()
    
    return NextResponse.json({
      success: true,
      message: 'Discoveries cleared'
    })
    
  } catch (error) {
    console.error('[Discovery API] Clear error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to clear discoveries'
    }, { status: 500 })
  }
}
