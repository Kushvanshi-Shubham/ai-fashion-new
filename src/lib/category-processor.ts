import { CATEGORY_DEFINITIONS } from '@/data/categoryDefinitions';
import { MASTER_ATTRIBUTES } from '@/data/masterAttributes';
import { CategoryFormData, AttributeField } from '@/types/fashion';

export interface CategoryHierarchy {
  departments: string[];
  subDepartments: Record<string, string[]>;
  categories: Record<string, Record<string, CategoryOption[]>>;
}

export interface CategoryOption {
  id: string;
  code: string;
  name: string;
  description?: string | undefined;
  totalAttributes: number;
  enabledAttributes: number;
  extractableAttributes: number;
  attributes: Record<string, boolean>;
}

export interface ProcessedCategory {
  department: string;
  subDepartment: string;
  category: CategoryOption;
}

/**
 * Processes the raw category definitions into a structured hierarchy
 */
export function processCategoryDefinitions(): CategoryHierarchy {
  const departments = new Set<string>();
  const subDepartments: Record<string, Set<string>> = {};
  const categories: Record<string, Record<string, CategoryOption[]>> = {};

  Object.entries(CATEGORY_DEFINITIONS).forEach(([key, categoryData]) => {
    const department = categoryData.department;
    const subDepartment = categoryData.subDepartment;
    
    // Add department
    departments.add(department);
    
    // Add subdepartment
    if (!subDepartments[department]) {
      subDepartments[department] = new Set();
    }
    subDepartments[department].add(subDepartment);
    
    // Add category
    if (!categories[department]) {
      categories[department] = {};
    }
    if (!categories[department][subDepartment]) {
      categories[department][subDepartment] = [];
    }

    // Count attributes
    const attributes = categoryData.attributes || {};
    const attributeKeys = Object.keys(attributes);
    const totalAttributes = attributeKeys.length;
    const enabledAttributes = attributeKeys.filter(attr => attributes[attr] === true).length;
    const extractableAttributes = attributeKeys.filter(attr => {
      return attributes[attr] === true && MASTER_ATTRIBUTES[attr]?.type;
    }).length;

    const categoryOption: CategoryOption = {
      id: key,
      code: key,
      name: key.replace(/_/g, ' ').toUpperCase(),
      description: categoryData.description,
      totalAttributes,
      enabledAttributes,
      extractableAttributes,
      attributes
    };

    categories[department][subDepartment].push(categoryOption);
  });

  // Convert sets to arrays and sort
  const result: CategoryHierarchy = {
    departments: Array.from(departments).sort(),
    subDepartments: {},
    categories
  };

  // Convert subdepartment sets to sorted arrays
  Object.keys(subDepartments).forEach(dept => {
    const subDeptSet = subDepartments[dept];
    if (subDeptSet) {
      result.subDepartments[dept] = Array.from(subDeptSet).sort();
    }
  });

  // Sort categories within each group
  Object.keys(categories).forEach(dept => {
    const deptCategories = categories[dept];
    if (deptCategories) {
      Object.keys(deptCategories).forEach(subDept => {
        const categoryList = deptCategories[subDept];
        if (categoryList) {
          categoryList.sort((a, b) => a.name.localeCompare(b.name));
        }
      });
    }
  });

  return result;
}

/**
 * Creates CategoryFormData from selected category
 */
export function createCategoryFormData(
  department: string,
  subDepartment: string,
  categoryOption: CategoryOption
): CategoryFormData {
  const attributes = categoryOption.attributes || {};
  const fields: AttributeField[] = [];

  // Create fields for enabled attributes
  Object.entries(attributes).forEach(([key, isEnabled]) => {
    if (isEnabled && MASTER_ATTRIBUTES[key]) {
      const masterAttr = MASTER_ATTRIBUTES[key];
      
      const field: AttributeField = {
        key,
        label: masterAttr.label,
        type: masterAttr.type,
        required: Boolean(masterAttr.required),
        ...(masterAttr.description && { description: masterAttr.description }),
        aiExtractable: true,
        aiWeight: 1.0
      };

      // Add options for select fields
      if (masterAttr.type === 'select' && masterAttr.allowedValues) {
        field.options = masterAttr.allowedValues;
      }

      fields.push(field);
    }
  });

  // Sort fields by label
  fields.sort((a, b) => a.label.localeCompare(b.label));

  return {
    categoryId: categoryOption.id,
    categoryCode: categoryOption.code,
    categoryName: categoryOption.name,
    department,
    subDepartment,
    ...(categoryOption.description && { description: categoryOption.description }),
    isActive: true,
    totalAttributes: categoryOption.totalAttributes,
    enabledAttributes: categoryOption.enabledAttributes,
    extractableAttributes: categoryOption.extractableAttributes,
    fields
  };
}

/**
 * Gets all categories for a specific department and subdepartment
 */
export function getCategoriesForPath(
  department: string,
  subDepartment: string
): CategoryOption[] {
  const hierarchy = processCategoryDefinitions();
  return hierarchy.categories[department]?.[subDepartment] || [];
}

/**
 * Searches categories by name or code
 */
export function searchCategories(query: string): ProcessedCategory[] {
  const hierarchy = processCategoryDefinitions();
  const results: ProcessedCategory[] = [];
  const searchTerm = query.toLowerCase();

  Object.keys(hierarchy.categories).forEach(department => {
    const deptCategories = hierarchy.categories[department];
    if (deptCategories) {
      Object.keys(deptCategories).forEach(subDepartment => {
        const categoryList = deptCategories[subDepartment];
        if (categoryList) {
          categoryList.forEach(category => {
            if (
              category.name.toLowerCase().includes(searchTerm) ||
              category.code.toLowerCase().includes(searchTerm) ||
              category.description?.toLowerCase().includes(searchTerm)
            ) {
              results.push({
                department,
                subDepartment,
                category
              });
            }
          });
        }
      });
    }
  });

  return results.sort((a, b) => a.category.name.localeCompare(b.category.name));
}

/**
 * Gets category statistics
 */
export function getCategoryStats() {
  const hierarchy = processCategoryDefinitions();
  
  let totalCategories = 0;
  let totalAttributes = 0;
  let totalEnabledAttributes = 0;

  Object.keys(hierarchy.categories).forEach(department => {
    const deptCategories = hierarchy.categories[department];
    if (deptCategories) {
      Object.keys(deptCategories).forEach(subDepartment => {
        const categories = deptCategories[subDepartment];
        if (categories) {
          totalCategories += categories.length;
          
          categories.forEach(category => {
            totalAttributes += category.totalAttributes;
            totalEnabledAttributes += category.enabledAttributes;
          });
        }
      });
    }
  });

  return {
    totalDepartments: hierarchy.departments.length,
    totalSubDepartments: Object.values(hierarchy.subDepartments).reduce((sum, subs) => sum + subs.length, 0),
    totalCategories,
    totalAttributes,
    totalEnabledAttributes,
    averageAttributesPerCategory: totalCategories > 0 ? Math.round(totalAttributes / totalCategories) : 0,
    averageEnabledAttributesPerCategory: totalCategories > 0 ? Math.round(totalEnabledAttributes / totalCategories) : 0
  };
}

/**
 * Validates if a category path exists
 */
export function validateCategoryPath(
  department: string,
  subDepartment: string,
  categoryCode: string
): boolean {
  const hierarchy = processCategoryDefinitions();
  
  if (!hierarchy.departments.includes(department)) {
    return false;
  }
  
  if (!hierarchy.subDepartments[department]?.includes(subDepartment)) {
    return false;
  }
  
  const categories = hierarchy.categories[department]?.[subDepartment] || [];
  return categories.some(cat => cat.code === categoryCode);
}

// Cache the processed hierarchy for performance
let cachedHierarchy: CategoryHierarchy | null = null;

export function getCachedHierarchy(): CategoryHierarchy {
  if (!cachedHierarchy) {
    cachedHierarchy = processCategoryDefinitions();
  }
  return cachedHierarchy;
}