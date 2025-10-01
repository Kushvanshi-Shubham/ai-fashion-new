import { NextRequest, NextResponse } from "next/server";

// Define category type
interface Category {
  id: string;
  displayName: string;
  category: string;
  department: string;
  subDepartment: string;
  description?: string;
  isActive: boolean;
  attributes: Record<string, boolean>;
}

interface AttributeConfig {
  label: string;
  type: string;
  allowedValues?: string[];
  description?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const categoryId = params.id;
    console.log(`🔍 Looking for category: ${categoryId}`);

    // Import your data files directly
    const { CATEGORY_DEFINITIONS } = await import(
      "../../../../../data/categoryDefinitions"
    );
    const { MASTER_ATTRIBUTES } = await import(
      "../../../../../data/masterAttributes"
    );

    // Ensure CATEGORY_DEFINITIONS has proper typing
    const category = (CATEGORY_DEFINITIONS as Category[]).find(
      (cat) => cat.id === categoryId
    );

    if (!category) {
      console.log(`❌ Category not found: ${categoryId}`);
      return NextResponse.json(
        { error: `Category '${categoryId}' not found` },
        { status: 404 }
      );
    }

    console.log(`✅ Found category: ${category.displayName}`);

    // Generate form fields
    const fields: Array<{
      key: string;
      label: string;
      type: string;
      required: boolean;
      options: string[] | null;
      description: string;
      aiExtractable: boolean;
      aiWeight: number;
    }> = [];

    let enabledCount = 0;

    for (const [attributeKey, isEnabled] of Object.entries(
      category.attributes
    )) {
      if (isEnabled) {
        const attributeConfig = (MASTER_ATTRIBUTES as Record<
          string,
          AttributeConfig
        >)[attributeKey];

        if (attributeConfig) {
          fields.push({
            key: attributeKey,
            label: attributeConfig.label,
            type: attributeConfig.type.toLowerCase(),
            required: false,
            options: attributeConfig.allowedValues || null,
            description:
              attributeConfig.description ||
              `${attributeConfig.label} attribute`,
            aiExtractable: true,
            aiWeight: 1.0,
          });
          enabledCount++;
        } else {
          console.warn(`⚠️ Attribute definition not found: ${attributeKey}`);
        }
      }
    }

    // Sort fields by importance
    fields.sort((a, b) => {
      if (a.options && !b.options) return -1;
      if (!a.options && b.options) return 1;
      return a.label.localeCompare(b.label);
    });

    const formSchema = {
      categoryId: category.id,
      categoryCode: category.category,
      categoryName: category.displayName,
      department: category.department,
      subDepartment: category.subDepartment,
      description: category.description,
      isActive: category.isActive,

      // Attribute statistics
      totalAttributes: Object.keys(category.attributes).length,
      enabledAttributes: enabledCount,
      extractableAttributes: fields.filter((f) => f.aiExtractable).length,

      // Form fields
      fields,
    };

    console.log(
      `📋 Generated form with ${fields.length} fields for ${category.displayName}`
    );

    return NextResponse.json({
      success: true,
      data: formSchema,
    });
  } catch (error) {
    console.error("Form generation error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate form",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
