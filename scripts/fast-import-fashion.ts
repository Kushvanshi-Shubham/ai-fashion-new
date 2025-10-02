import { PrismaClient, AttributeType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 FAST Fashion Data Import')
  console.log('===========================')
  
  const startTime = Date.now()
  
  try {
    // Step 1: Import attributes first (we know this works)
    console.log('\n📋 Phase 1: Importing Master Attributes...')
    const { MASTER_ATTRIBUTES } = await import('../src/data/masterAttributes')
    
    let attrCount = 0
    for (const [key, config] of Object.entries(MASTER_ATTRIBUTES)) {
      const attributeConfig = config as any
      
      await prisma.masterAttribute.upsert({
        where: { key },
        update: {},
        create: {
          key,
          label: attributeConfig.label,
          type: attributeConfig.type === 'select' ? 'SELECT' as AttributeType : 'TEXT' as AttributeType,
          description: attributeConfig.description || null,
          
          allowedValues: attributeConfig.allowedValues || null,
          aiExtractable: true,
          aiWeight: 1.0,
          aiPromptHint: `Extract ${attributeConfig.label.toLowerCase()} from image`,
          sortOrder: attrCount
        }
      })
      
      attrCount++
      if (attrCount % 10 === 0) {
        console.log(`✅ Imported ${attrCount} attributes...`)
      }
    }
    console.log(`✅ Total attributes imported: ${attrCount}`)
    
    // Step 2: Fast department creation (skip the complex logic)
    console.log('\n🏗️  Phase 2: Creating Department Structure...')
    
    // Create departments directly
    const departments = [
      { code: 'KIDS', name: 'Kids Fashion' },
      { code: 'MENS', name: 'Mens Fashion' }, 
      { code: 'LADIES', name: 'Ladies Fashion' }
    ]
    
    const deptMap: Record<string, string> = {}
    for (const dept of departments) {
      const created = await prisma.department.upsert({
        where: { code: dept.code },
        update: {},
        create: dept
      })
      deptMap[dept.code] = created.id
      console.log(`✅ Created department: ${dept.name}`)
    }
    
    // Create all sub-departments we found in your data
    const subDepartments = [
      'IB', 'IG', 'KBL', 'KBSETS', 'KBU', 'KGWL', 'KGWU', 'KBWL', 'KBWSETS', 'KBWU', // KIDS
      'ML', 'MO', 'MSL', 'MSU', 'MU', 'MW', 'MSIW', // MENS  
      'LKL', 'LL', 'LNL', 'LU', 'LW' // LADIES
    ]
    
    const subDeptMap: Record<string, string> = {}
    for (const subCode of subDepartments) {
      let parentDept = 'KIDS' // default
      if (subCode.startsWith('M')) parentDept = 'MENS'
      if (subCode.startsWith('L')) parentDept = 'LADIES'
      const parentId = deptMap[parentDept]
      if (!parentId) {
        console.warn(`Parent department id missing for ${parentDept}, skipping sub-dept ${subCode}`)
        continue
      }

      const created = await prisma.subDepartment.upsert({
        where: {
          departmentId_code: {
            departmentId: parentId,
            code: subCode
          }
        },
        update: {},
        create: {
          code: subCode,
          name: subCode,
          departmentId: parentId
        }
      })
      subDeptMap[subCode] = created.id
      console.log(`✅ Created sub-department: ${subCode}`)
    }
    
    // Step 3: Import categories FAST
    console.log('\n🏷️  Phase 3: Importing Categories...')
  const { CATEGORY_DEFINITIONS } = await import('../src/data/categoryDefinitions')

  let catCount = 0
  let mappingCount = 0
    
    for (const categoryDataRaw of (CATEGORY_DEFINITIONS as unknown[])) {
      const categoryData: any = categoryDataRaw
      try {
        // Find sub-department ID
        const subDeptId = subDeptMap[categoryData.subDepartment]
        if (!subDeptId) {
          console.warn(`⚠️  Sub-department not found: ${categoryData.subDepartment}`)
          continue
        }
        
        // Create category
        const category = await prisma.category.upsert({
          where: {
            subDepartmentId_code: {
              subDepartmentId: subDeptId,
              code: categoryData.id
            }
          },
          update: {},
          create: {
            code: categoryData.id,
            displayName: categoryData.displayName,
            description: categoryData.description || null,
            subDepartmentId: subDeptId,
            isActive: categoryData.isActive ?? true,
            sortOrder: catCount
          }
        })
        
        catCount++
        
        // Create attribute mappings (your true/false system)
  for (const [attributeKey, isEnabled] of Object.entries(categoryData.attributes || {})) {
          const masterAttribute = await prisma.masterAttribute.findUnique({
            where: { key: attributeKey }
          })
          
          if (masterAttribute) {
            await prisma.categoryAttributeConfig.upsert({
              where: {
                categoryId_attributeId: {
                  categoryId: category.id,
                  attributeId: masterAttribute.id
                }
              },
              update: { isEnabled: Boolean(isEnabled) },
              create: {
                categoryId: category.id,
                attributeId: masterAttribute.id,
                isEnabled: Boolean(isEnabled),
                isRequired: false
              }
            })
              mappingCount++
          }
        }
        
        if (catCount % 25 === 0) {
          console.log(`✅ Imported ${catCount} categories...`)
        }
        
      } catch (error) {
        console.error(`❌ Failed to import category ${categoryData.id}:`, error)
      }
    }
    
    // Final stats
    const [finalDeptCount, finalSubDeptCount, finalAttrCount, finalCatCount, finalMappingCount] = await Promise.all([
      prisma.department.count(),
      prisma.subDepartment.count(),
      prisma.masterAttribute.count(), 
      prisma.category.count(),
      prisma.categoryAttributeConfig.count()
    ])
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2)
    
    console.log('\n✅ FAST IMPORT COMPLETED!')
    console.log('========================')
    console.log(`⏱️  Total Time: ${totalTime}s`)
    console.log(`📊 Final Results:`)
    console.log(`   • Departments: ${finalDeptCount}`)
    console.log(`   • Sub-Departments: ${finalSubDeptCount}`)
    console.log(`   • Master Attributes: ${finalAttrCount}`)
    console.log(`   • Categories: ${finalCatCount}`)
    console.log(`   • Attribute Mappings: ${finalMappingCount}`)
  console.log(`   • Local mapping count: ${mappingCount}`)
    
    console.log('\n🎉 Your complete fashion dataset is ready!')
    console.log('🚀 Next: Test the API endpoints and build your AI system!')
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
