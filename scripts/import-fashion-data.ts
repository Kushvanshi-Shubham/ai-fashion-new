import { PrismaClient } from '@prisma/client'
import { AttributeImporter } from '../src/lib/import/import-attributes'
import { CategoryImporter } from '../src/lib/import/import-categories'

const prisma = new PrismaClient()

async function main(): Promise<void> {
  console.log('🎯 Fashion Data Import System')
  console.log('============================')
  
  const startTime = Date.now()
  
  try {
    // Step 1: Import master attributes
    console.log('\n📋 Phase 1: Master Attributes')
    const attributeResults = await AttributeImporter.importMasterAttributes()
    console.log(`Imported ${attributeResults.imported} attributes with ${attributeResults.errors.length} errors`)
    
    // Step 2: Import categories and mappings
    console.log('\n🏷️  Phase 2: Categories & Mappings')
    const categoryResults = await CategoryImporter.importCategories()
    console.log(`Imported ${categoryResults.importedCategories} categories with ${categoryResults.errors.length} errors`)
    
    // Step 3: Generate statistics
    console.log('\n📊 Generating Statistics...')
    const [
      deptCount,
      subDeptCount,
      attrCount,
      catCount,
      mappingCount
    ] = await prisma.$transaction([
      prisma.department.count(),
      prisma.subDepartment.count(),
      prisma.masterAttribute.count(),
      prisma.category.count(),
      prisma.categoryAttributeConfig.count()
    ])
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log('\n✅ IMPORT COMPLETED!')
    console.log('===================')
    console.log(`⏱️  Total Time: ${totalTime}s`)
    console.log(`📊 Results:`)
    console.log(`   • Departments: ${deptCount}`)
    console.log(`   • Sub-Departments: ${subDeptCount}`)  
    console.log(`   • Master Attributes: ${attrCount}`)
    console.log(`   • Categories: ${catCount}`)
    console.log(`   • Attribute Mappings: ${mappingCount}`)
    
    // Show import statistics
    console.log('\n📈 Import Results:')
    console.log(`   • Attributes Imported: ${attributeResults.imported}`)
    console.log(`   • Categories Imported: ${categoryResults.importedCategories}`)
    console.log(`   • Mappings Created: ${categoryResults.importedMappings}`)
    console.log(`   • Total Errors: ${attributeResults.errors.length + categoryResults.errors.length}`)
    
    // Quick verification
    const sampleCategory = await prisma.category.findFirst({
      include: {
        subDepartment: {
          include: { department: true }
        },
        attributeConfigs: {
          where: { isEnabled: true },
          take: 3
        }
      }
    })
    
    if (sampleCategory) {
      console.log(`\n🔍 Sample Category: ${sampleCategory.displayName}`)
      console.log(`   Path: ${sampleCategory.subDepartment?.department?.name} > ${sampleCategory.subDepartment?.name}`)
      console.log(`   Enabled Attributes: ${sampleCategory.attributeConfigs.length}`)
    }
    
    console.log('\n🎉 Your fashion data is ready!')
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('❌ IMPORT FAILED:', errorMessage)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
