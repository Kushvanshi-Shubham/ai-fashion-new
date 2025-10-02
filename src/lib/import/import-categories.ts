import { PrismaClient } from '@prisma/client'
import type { CategoryImportResult, ImportError, CategoryConfig } from '../../types/import-types'

const prisma = new PrismaClient()

export class CategoryImporter {
  static async importCategories(): Promise<CategoryImportResult> {
    console.log('🚀 Importing categories and mappings...')
    
    // Dynamic import
    const { CATEGORY_DEFINITIONS } = await import('../../data/categoryDefinitions')
    
    // Step 1: Create department structure
    await this.ensureDepartmentStructure(CATEGORY_DEFINITIONS as CategoryConfig[])
    
    let importedCategories = 0
    let importedMappings = 0
    const errors: ImportError[] = []
    
    for (const categoryData of CATEGORY_DEFINITIONS as CategoryConfig[]) {
      try {
        // Create/update category
        const category = await prisma.category.upsert({
          where: { 
            subDepartmentId_code: {
              subDepartmentId: await this.getSubDepartmentId(
                categoryData.department, 
                categoryData.subDepartment
              ),
              code: categoryData.id
            }
          },
          update: {
            displayName: categoryData.displayName,
            description: categoryData.description || null,
            isActive: categoryData.isActive ?? true
          },
          create: {
            code: categoryData.id,
            displayName: categoryData.displayName,
            description: categoryData.description || null,
            subDepartmentId: await this.getSubDepartmentId(
              categoryData.department,
              categoryData.subDepartment
            ),
            isActive: categoryData.isActive ?? true,
            sortOrder: importedCategories
          }
        })
        importedCategories++
        
        // Import your true/false attribute mappings
        for (const [attributeKey, isEnabled] of Object.entries(categoryData.attributes)) {
          try {
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
                update: { 
                  isEnabled: Boolean(isEnabled),
                  isRequired: false 
                },
                create: {
                  categoryId: category.id,
                  attributeId: masterAttribute.id,
                  isEnabled: Boolean(isEnabled),
                  isRequired: false
                }
              })
              importedMappings++
            }
          } catch (mappingError) {
            errors.push({
              category: categoryData.id,
              attribute: attributeKey,
              error: mappingError instanceof Error ? mappingError.message : 'Mapping error'
            })
          }
        }
        
        if (importedCategories % 50 === 0) {
          console.log(`✅ Imported ${importedCategories} categories...`)
        }
        
      } catch (error) {
        errors.push({
          category: categoryData.id,
          error: error instanceof Error ? error.message : 'Category error'
        })
      }
    }
    
    console.log(`✅ Imported ${importedCategories} categories`)
    console.log(`✅ Imported ${importedMappings} attribute mappings`)
    
    return { importedCategories, importedMappings, errors }
  }
  
  private static async ensureDepartmentStructure(categoryDefinitions: CategoryConfig[]): Promise<void> {
    console.log('🏗️  Creating department structure...')
    
    // Extract unique departments and sub-departments
    const deptStructure: Record<string, Set<string>> = {}
    
    categoryDefinitions.forEach(cat => {
      if (!deptStructure[cat.department]) {
        deptStructure[cat.department] = new Set()
      }
      if (cat.subDepartment) {
        const set = deptStructure[cat.department]
        if (set) set.add(cat.subDepartment)
      }
    })
    
    const departmentNames: Record<string, string> = {
      'KIDS': 'Kids Fashion',
      'MENS': 'Mens Fashion', 
      'WOMENS': 'Womens Fashion',
      'LADIES': 'Ladies Fashion'
    }
    
    const subDepartmentNames: Record<string, string> = {
      'IB': 'Infant Boys',
      'IG': 'Infant Girls', 
      'KB_L': 'Kids Boys Lower',
      'KB_SETS': 'Kids Boys Sets',
      'KB_U': 'Kids Boys Upper',
      'KGW_L': 'Kids Girls Lower',
      'KGW_U': 'Kids Girls Upper',
      'ML': 'Mens Lower',
      'MO': 'Mens Other',
      'MSL': 'Mens Sleepwear',
      'MW': 'Mens Winterwear',
      'MSIW': 'Mens Innerwear',
      'LKL': 'Ladies Kurta Lower',
      'LL': 'Ladies Lower',
      'LNL': 'Ladies Nightwear',
      'LU': 'Ladies Upper',
      'LW': 'Ladies Winterwear'
    }
    
    // Create departments and sub-departments
    for (const [deptCode, subDepts] of Object.entries(deptStructure)) {
      const department = await prisma.department.upsert({
        where: { code: deptCode },
        update: {},
        create: {
          code: deptCode,
          name: departmentNames[deptCode] || deptCode,
          description: `${deptCode} fashion department`
        }
      })
      
      for (const subDeptCode of Array.from(subDepts)) {
        await prisma.subDepartment.upsert({
          where: {
            departmentId_code: {
              departmentId: department.id,
              code: subDeptCode
            }
          },
          update: {},
          create: {
            code: subDeptCode,
            name: subDepartmentNames[subDeptCode] || subDeptCode,
            description: `${subDeptCode} under ${deptCode}`,
            departmentId: department.id
          }
        })
      }
    }
  }
  
  private static async getSubDepartmentId(deptCode: string, subDeptCode: string): Promise<string> {
    const department = await prisma.department.findUnique({
      where: { code: deptCode }
    })
    
    if (!department) {
      throw new Error(`Department ${deptCode} not found`)
    }
    
    const subDepartment = await prisma.subDepartment.findUnique({
      where: {
        departmentId_code: {
          departmentId: department.id,
          code: subDeptCode
        }
      }
    })
    
    if (!subDepartment) {
      throw new Error(`Sub-department ${subDeptCode} not found`)
    }
    
    return subDepartment.id
  }
}
