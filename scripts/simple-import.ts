import { PrismaClient, AttributeType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Simple Fashion Data Import')
  console.log('=============================')
  
  try {
    // Step 1: Create departments first
    console.log('Creating departments...')
    const departments = [
      { code: 'KIDS', name: 'Kids Fashion' },
      { code: 'MENS', name: 'Mens Fashion' },
      { code: 'LADIES', name: 'Ladies Fashion' }
    ]
    
    for (const dept of departments) {
      await prisma.department.upsert({
        where: { code: dept.code },
        update: {},
        create: dept
      })
      console.log(`✅ Created department: ${dept.name}`)
    }
    
    // Step 2: Create sub-departments
    console.log('\nCreating sub-departments...')
    const subDepartments = [
      { code: 'IB', name: 'Infant Boys', deptCode: 'KIDS' },
      { code: 'IG', name: 'Infant Girls', deptCode: 'KIDS' },
      { code: 'KBL', name: 'Kids Boys Lower', deptCode: 'KIDS' },
      { code: 'KGL', name: 'Kids Girls Lower', deptCode: 'KIDS' },
      { code: 'KBSETS', name: 'Kids Boys Sets', deptCode: 'KIDS' },
      { code: 'KBU', name: 'Kids Boys Upper', deptCode: 'KIDS' },
      { code: 'KGWL', name: 'Kids Girls Winter Lower', deptCode: 'KIDS' },
      { code: 'KGWU', name: 'Kids Girls Winter Upper', deptCode: 'KIDS' },
      { code: 'KBWL', name: 'Kids Boys Winter Lower', deptCode: 'KIDS' },
      { code: 'KBWSETS', name: 'Kids Boys Winter Sets', deptCode: 'KIDS' },
      { code: 'KBWU', name: 'Kids Boys Winter Upper', deptCode: 'KIDS' },
      { code: 'ML', name: 'Mens Lower', deptCode: 'MENS' },
      { code: 'MO', name: 'Mens Other', deptCode: 'MENS' },
      { code: 'MSL', name: 'Mens Sport Lower', deptCode: 'MENS' },
      { code: 'MSU', name: 'Mens Sport Upper', deptCode: 'MENS' },
      { code: 'MU', name: 'Mens Upper', deptCode: 'MENS' },
      { code: 'MW', name: 'Mens Winter', deptCode: 'MENS' },
      { code: 'LL', name: 'Ladies Lower', deptCode: 'LADIES' },
      { code: 'LU', name: 'Ladies Upper', deptCode: 'LADIES' },
      { code: 'LW', name: 'Ladies Winter', deptCode: 'LADIES' }
    ]
    
    for (const subDept of subDepartments) {
      const department = await prisma.department.findUnique({
        where: { code: subDept.deptCode }
      })
      
      if (department) {
        await prisma.subDepartment.upsert({
          where: {
            departmentId_code: {
              departmentId: department.id,
              code: subDept.code
            }
          },
          update: {},
          create: {
            code: subDept.code,
            name: subDept.name,
            departmentId: department.id
          }
        })
        console.log(`✅ Created sub-department: ${subDept.name}`)
      }
    }
    
    // Step 3: Import just a few sample attributes first
    console.log('\nImporting sample attributes...')
    const sampleAttributes = [
      {
        key: 'color_-_main',
        label: 'COLOR - MAIN',
        type: 'SELECT' as AttributeType,  // Fix: Cast to AttributeType
        description: 'Main color of the garment'
      },
      {
        key: 'neck',
        label: 'NECK',
        type: 'SELECT' as AttributeType,  // Fix: Cast to AttributeType
        description: 'Neck style and collar type'
      },
      {
        key: 'length',
        label: 'LENGTH',
        type: 'SELECT' as AttributeType,  // Fix: Cast to AttributeType
        description: 'Garment length'
      }
    ]
    
    for (const attr of sampleAttributes) {
      await prisma.masterAttribute.upsert({
        where: { key: attr.key },
        update: {},
        create: {
          key: attr.key,
          label: attr.label,
          type: attr.type,
          description: attr.description,
          aiExtractable: true,
          aiWeight: 1.0
        }
      })
      console.log(`✅ Created attribute: ${attr.label}`)
    }
    
    // Step 4: Create one sample category
    console.log('\nCreating sample category...')
    const sampleSubDept = await prisma.subDepartment.findFirst({
      where: { code: 'IB' }
    })
    
    if (sampleSubDept) {
      const sampleCategory = await prisma.category.create({
        data: {
          code: 'IB_BERMUDA_SAMPLE',
          displayName: 'IB Bermuda Sample',
          description: 'Sample category for testing',
          subDepartmentId: sampleSubDept.id,
          isActive: true
        }
      })
      
      // Add attribute mappings
      const attributes = await prisma.masterAttribute.findMany()
      for (const attr of attributes) {
        await prisma.categoryAttributeConfig.create({
          data: {
            categoryId: sampleCategory.id,
            attributeId: attr.id,
            isEnabled: true,
            isRequired: false
          }
        })
      }
      
      console.log('✅ Created sample category with attribute mappings')
    }
    
    // Final stats
    const [deptCount, subDeptCount, attrCount, catCount] = await Promise.all([
      prisma.department.count(),
      prisma.subDepartment.count(), 
      prisma.masterAttribute.count(),
      prisma.category.count()
    ])
    
    console.log('\n✅ SIMPLE IMPORT COMPLETED!')
    console.log('==========================')
    console.log(`• Departments: ${deptCount}`)
    console.log(`• Sub-Departments: ${subDeptCount}`)
    console.log(`• Attributes: ${attrCount}`)
    console.log(`• Categories: ${catCount}`)
    console.log('\n🎉 Basic structure is ready!')
    console.log('Now you can test the system before importing all data.')
    
  } catch (error) {
    console.error('❌ Import failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
