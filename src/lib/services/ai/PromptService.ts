// Prompt Service based on proven old system - EXACT COPY
import type { SchemaItem, AttributeField } from '../../../types/extraction/ExtractionTypes';
// import type { AllowedValue } from '../../../types/category/CategoryTypes';

export class PromptService {
  
  // ✅ Original method for v1.0, enhanced for allowedValues objects and fullForm
  generateGenericPrompt(schema: SchemaItem[]): string {
    const attributeDescriptions = schema
      .map((item) => {
        const allowedValues =
          item.allowedValues?.length
            ? ` (allowed values: ${item.allowedValues
                .map((av) => av.fullForm ?? av.shortForm)
                .join(', ')})`
            : '';
        const fullForm = item.fullForm ? ` Full form: ${item.fullForm}.` : '';
        return `- ${item.key}: ${item.label}${allowedValues}${fullForm}`;
      })
      .join('\n');

    return `
You are an AI fashion attribute extraction specialist. Analyze this clothing image and extract the following attributes with high accuracy.

REQUIRED ATTRIBUTES:
${attributeDescriptions}

INSTRUCTIONS:
1. Examine the image carefully for each attribute
2. For select attributes, ONLY use values from the allowed list (use shortForm values)
3. For text/number attributes, provide precise descriptive values
4. If an attribute is not visible/applicable, use null
5. Provide confidence scores (0-100) for visual attributes

CRITICAL: Return ONLY valid JSON without markdown formatting or code blocks.

OUTPUT FORMAT (JSON ONLY):
{
  "attribute_key": {
    "rawValue": "extracted_value",
    "schemaValue": "normalized_value",
    "visualConfidence": 85,
    "reasoning": "brief_explanation"
  }
}

Return pure JSON only. No markdown, no explanations, no code blocks.`.trim();
  }

  // Category-specific prompts for better accuracy
  generateCategorySpecificPrompt(schema: SchemaItem[], categoryName: string): string {
    const basePrompt = this.generateGenericPrompt(schema);
    const categoryContext = this.getCategoryContext(categoryName);

    return `${basePrompt}

CATEGORY CONTEXT:
You are analyzing a ${categoryName}. ${categoryContext}
Pay special attention to attributes most relevant to this category type.

CRITICAL: Return pure JSON only, no markdown code blocks.`.trim();
  }

  // Discovery mode for finding new attributes (like your old system)
  generateDiscoveryPrompt(schema: SchemaItem[], attributeFields: AttributeField[] = [], categoryName?: string): string {
    const categoryHints = categoryName ? this.getDiscoveryHints(categoryName) : [];
    
    // Add attribute field context if provided
    const attributeContext = attributeFields.length > 0 
      ? `\nADDITIONAL CONTEXT FROM ATTRIBUTE FIELDS:\n${attributeFields.map(f => `- ${f.label} (${f.key}): ${f.type}${f.required ? ' [REQUIRED]' : ''}`).join('\n')}`
      : '';
    
    const hintsList = categoryHints.length > 0 
      ? `\nFOCUS AREAS FOR ${categoryName?.toUpperCase()}:\n${categoryHints.map(h => `- ${h}`).join('\n')}`
      : '';

    return `
You are an advanced AI fashion attribute extraction specialist. Analyze this clothing image comprehensively.

REQUIRED SCHEMA ATTRIBUTES (extract these first):
${schema
      .map(
        (item) =>
          `- ${item.key}: ${item.label}${
            item.allowedValues?.length
              ? ` (allowed: ${item.allowedValues
                  .map((av) => av.fullForm ?? av.shortForm)
                  .join(', ')})`
              : ''
          }`
      )
      .join('\n')}

${categoryName ? `CATEGORY CONTEXT: You are analyzing a ${categoryName}. ${this.getCategoryContext(categoryName)}` : ''}
${attributeContext}

DISCOVERY MODE - ALSO EXTRACT ADDITIONAL VISIBLE ATTRIBUTES:

BRAND & LABELS:
- Brand logos, designer labels, manufacturer tags
- Care instruction labels, size tags, country of origin
- Model numbers, style codes, fabric content labels

CONSTRUCTION & HARDWARE:
- Button details: material (plastic/metal/wood), style, count
- Zipper details: brand (YKK/other), material, color, style
- Hardware: buckles, grommets, rivets, snaps, hooks
- Stitching: color, style (flat-fell, overlock, topstitch)
- Seam details: French seams, bound seams, raw edges

FABRIC & TEXTURE:
- Fabric weave: twill, plain, herringbone, jacquard
- Texture: smooth, textured, ribbed, waffle, cable knit
- Surface treatments: stonewashed, distressed, coated
- Fabric weight: lightweight, medium, heavy, structured

DESIGN DETAILS:
- Embellishments: embroidery, appliqué, beading, sequins
- Prints: floral, geometric, abstract, text, brand logos
- Functional details: pockets (patch/welt/slash), belts, ties
- Decorative elements: piping, contrast trim, color blocking

${hintsList}

OUTPUT FORMAT - RETURN VALID JSON:
{
  "schemaAttributes": {
    "schema_key": {
      "rawValue": "exactly what you observe",
      "schemaValue": "normalized to fit schema",
      "visualConfidence": 85,
      "reasoning": "clear explanation"
    }
  },
  "discoveries": {
    "descriptive_key": {
      "rawValue": "detailed observation",
      "normalizedValue": "clean, structured value",
      "confidence": 82,
      "reasoning": "what you saw and why it's significant",
      "suggestedType": "text|select|number",
      "possibleValues": ["value1", "value2"]
    }
  }
}

CRITICAL RULES:
1. Only extract what you can clearly and confidently see
2. Use descriptive keys: "button_material" not "btn_mat"
3. Provide detailed reasoning for discoveries
4. Suggest data types: "select" for categories, "text" for descriptions
5. Include possible values for select types
6. Return pure JSON only - no markdown

Focus on commercially valuable attributes that fashion professionals would find useful.`.trim();
  }

  // Category-specific discovery hints
  getDiscoveryHints(categoryName: string): string[] {
    const hints: Record<string, string[]> = {
      'Kids Bermuda': [
        'waistband_type',
        'closure_type',
        'pocket_count',
        'leg_opening_style',
        'belt_loops',
        'fabric_stretch',
        'safety_features',
        'size_adjustability',
      ],
      'Ladies Cig Pant': [
        'waist_height',
        'leg_cut',
        'pleat_style',
        'hem_style',
        'fabric_drape',
        'closure_quality',
        'trouser_style',
        'professional_features',
      ],
      'Mens T Shirt': [
        'collar_style',
        'sleeve_hem',
        'side_seams',
        'shoulder_construction',
        'neckline_binding',
        'fabric_weight',
        'print_technique',
        'tag_style',
      ],
      // Add more as needed for your categories
      'M_TEES_HS': [
        'collar_style',
        'sleeve_hem',
        'side_seams',
        'shoulder_construction', 
        'neckline_binding',
        'fabric_weight',
        'print_technique',
        'tag_style',
        'brand_placement',
        'seam_construction'
      ]
    };

    return hints[categoryName] || [
      'fabric_texture',
      'construction_quality',
      'design_elements',
      'brand_details',
      'functional_features'
    ];
  }

  private getCategoryContext(categoryName: string): string {
    const contexts: Record<string, string> = {
      'Kids Bermuda':
        "Focus on casual wear attributes like fit, length, fabric type, and comfort features typical for children's shorts.",
      'Ladies Cig Pant':
        'Emphasize formal wear characteristics, fit type, fabric composition, and professional styling details.',
      'Mens T Shirt':
        'Prioritize casual wear elements like neck type, sleeve style, fabric composition, and print details.',
      'M_TEES_HS':
        'Focus on t-shirt specific attributes like collar type, sleeve style, fabric details, print placement, and construction quality.',
      // Add more category contexts as needed
    };

    return contexts[categoryName] || 'Analyze all visible fashion attributes systematically.';
  }

  // Helper to convert AttributeField to SchemaItem for compatibility
  convertFieldsToSchema(fields: AttributeField[]): SchemaItem[] {
    return fields.map(field => {
      const schemaItem: SchemaItem = {
        key: field.key,
        label: field.label,
        type: field.type as 'text' | 'select' | 'number',
        required: field.required,
      };
      
      if (field.options) {
        schemaItem.allowedValues = field.options;
      }
      
      return schemaItem;
    });
  }
}