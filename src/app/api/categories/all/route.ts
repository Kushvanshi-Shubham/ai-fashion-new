import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Load all categories (for admin or full list)
    const { CATEGORY_DEFINITIONS } = await import('../../../../data/categoryDefinitions')
    
    // Return simplified list with just essential info
    type CategoryRaw = { id: string; displayName: string; department: string; subDepartment: string; isActive?: boolean; attributes?: Record<string, unknown> }
    const simplifiedCategories = (CATEGORY_DEFINITIONS as CategoryRaw[]).map((cat) => ({
      id: cat.id,
      name: cat.displayName,
      department: cat.department,
      subDepartment: cat.subDepartment,
      isActive: cat.isActive,
      enabledAttributes: Object.values(cat.attributes ?? {}).filter(Boolean).length
    }))
    
    // Group by department
    const grouped = {
      KIDS: simplifiedCategories.filter(c => c.department === 'KIDS'),
      MENS: simplifiedCategories.filter(c => c.department === 'MENS'),  
      LADIES: simplifiedCategories.filter(c => c.department === 'LADIES')
    }
    
    return NextResponse.json({
      success: true,
      data: {
        categories: simplifiedCategories,
        grouped: grouped,
        summary: {
          total: simplifiedCategories.length,
          kids: grouped.KIDS.length,
          mens: grouped.MENS.length,
          ladies: grouped.LADIES.length
        }
      }
    })
    
  } catch (error) {
    console.error('All categories API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load all categories' },
      { status: 500 }
    )
  }
}
