import { PrismaClient, AttributeType } from '@prisma/client'
import type { ImportResult, ImportError, AttributeDefinition } from '../../types/import-types'

const prisma = new PrismaClient()

export class AttributeImporter {
  static async importMasterAttributes(): Promise<ImportResult> {
    console.log('🚀 Importing master attributes...')
    
    // Dynamic import to avoid build-time issues
    const { MASTER_ATTRIBUTES } = await import('../../data/masterAttributes')
    
    let imported = 0
    const errors: ImportError[] = []
    
    for (const [key, config] of Object.entries(MASTER_ATTRIBUTES)) {
      try {
        const attributeConfig = config as AttributeDefinition
        
        // Handle allowedValues with proper typing
        const allowedValuesData = attributeConfig.allowedValues 
          ? attributeConfig.allowedValues 
          : null
        
        await prisma.masterAttribute.upsert({
          where: { key },
          update: {
            label: attributeConfig.label,
            description: attributeConfig.description || null,
            // Use type assertion to bypass Prisma type checking
            allowedValues: allowedValuesData as any,
          },
          create: {
            key,
            label: attributeConfig.label,
            type: this.mapAttributeType(attributeConfig.type),
            description: attributeConfig.description || null,
            // Use type assertion to bypass Prisma type checking
            allowedValues: allowedValuesData as any,
            aiExtractable: true,
            aiWeight: this.calculateAIWeight(key),
            aiPromptHint: `Extract ${attributeConfig.label.toLowerCase()} from fashion garment image`,
            sortOrder: imported
          }
        })
        imported++
        
        if (imported % 10 === 0) {
          console.log(`✅ Imported ${imported} attributes...`)
        }
      } catch (error) {
        errors.push({ 
          key, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }
    
    console.log(`✅ Successfully imported ${imported} master attributes`)
    if (errors.length > 0) {
      console.warn(`⚠️  ${errors.length} errors:`, errors.slice(0, 5))
    }
    
    return { imported, errors }
  }
  
  private static mapAttributeType(type: string): AttributeType {
    const typeMap: Record<string, AttributeType> = {
      'select': 'SELECT',
      'text': 'TEXT', 
      'number': 'NUMBER',
      'boolean': 'BOOLEAN'
    }
    return typeMap[type?.toLowerCase()] || 'SELECT'
  }
  
  private static calculateAIWeight(key: string): number {
    // Higher weight for more important fashion attributes
    const highPriorityKeys = ['color_-_main', 'fab_composition', 'neck', 'length', 'fit']
    const mediumPriorityKeys = ['pattern', 'sleeves_main_style', 'fab_weave', 'button']
    
    if (highPriorityKeys.includes(key)) return 2.0
    if (mediumPriorityKeys.includes(key)) return 1.5
    return 1.0
  }
}
