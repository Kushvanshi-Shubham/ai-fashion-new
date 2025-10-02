import { NextRequest, NextResponse } from 'next/server'
import { discoveryManager } from '@/lib/services/discoveryManager'
import type { PromoteDiscoveryRequest, PromoteDiscoveryResponse } from '@/types/discovery'

// Promote discovery to schema
export async function POST(request: NextRequest) {
  try {
    const body: PromoteDiscoveryRequest = await request.json()
    
    if (!body.discoveryKey || !body.categoryId) {
      return NextResponse.json({
        success: false,
        error: 'Missing discoveryKey or categoryId'
      }, { status: 400 })
    }

    const schemaItem = discoveryManager.promoteToSchema(body.discoveryKey)
    
    if (!schemaItem) {
      return NextResponse.json({
        success: false,
        error: 'Discovery not found or not promotable'
      }, { status: 404 })
    }

    // Override label/type if provided
    if (body.label) schemaItem.label = body.label
    if (body.type) schemaItem.type = body.type

    const response: PromoteDiscoveryResponse = {
      success: true,
      schemaItem
    }

    console.log(`[Discovery] Promoted ${body.discoveryKey} for category ${body.categoryId}`)
    
    return NextResponse.json(response)
    
  } catch (error) {
    console.error('[Discovery API] Promote error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to promote discovery'
    }, { status: 500 })
  }
}