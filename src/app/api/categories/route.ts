import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Import your data files directly - no database needed!
    const { CATEGORY_DEFINITIONS } = await import('../../../data/categoryDefinitions')
    const { MASTER_ATTRIBUTES } = await import('../../../data/masterAttributes')
    
    console.log(`📊 Loaded ${CATEGORY_DEFINITIONS.length} categories from JSON`)
    
    // Format for frontend (limit to first 50 for performance)
    const formattedCategories = CATEGORY_DEFINITIONS.slice(0, 50).map((cat: any) => {
      // Count enabled attributes
      const enabledCount = Object.values(cat.attributes).filter(Boolean).length
      const totalCount = Object.keys(cat.attributes).length
      
      return {
        id: cat.id,
        name: cat.displayName,
        description: cat.description || `${cat.department} ${cat.subDepartment} category`,
        department: cat.department,
        subDepartment: cat.subDepartment,
        isActive: cat.isActive,
        enabledAttributes: enabledCount,
        totalAttributes: totalCount,
        // Add some metadata for UI
        category: cat.category,
        createdAt: cat.createdAt || new Date().toISOString()
      }
    })
    
    // Group by department for better UX
    const groupedData = {
      categories: formattedCategories,
      summary: {
        total: formattedCategories.length,
        byDepartment: {
          KIDS: formattedCategories.filter(c => c.department === 'KIDS').length,
          MENS: formattedCategories.filter(c => c.department === 'MENS').length,
          LADIES: formattedCategories.filter(c => c.department === 'LADIES').length
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      data: groupedData
    })
    
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to load categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
