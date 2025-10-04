/**
 * Category-specific intelligence for enhanced extraction accuracy
 */

export interface CategoryIntelligence {
  primaryFocus: string[];
  commonPatterns: string[];
  visualHints: string;
  confidenceBoosts: Record<string, number>;
  conflictResolution: Record<string, string[]>;
}

export interface ExtractionStrategy {
  analysisOrder: string[];
  focusAreas: string[];
  exclusionRules: string[];
  confidenceThresholds: {
    auto_accept: number;
    flag_review: number;
    auto_retry: number;
  };
}

// Category-specific intelligence database
export const CATEGORY_INTELLIGENCE: Record<string, CategoryIntelligence> = {
  // Men's T-Shirts & Henley Shirts
  'Mens_Tees_Hs': {
    primaryFocus: ['color_main', 'neck_style', 'sleeve_length', 'fit'],
    commonPatterns: ['solid', 'stripes', 'graphic', 'logo'],
    visualHints: 'Focus on neckline shape (crew, V-neck, henley). Sleeve length is key identifier. Ignore background patterns.',
    confidenceBoosts: {
      'neck_style': 1.2,
      'sleeve_length': 1.15,
      'color_main': 1.1
    },
    conflictResolution: {
      'color_main': ['Identify DOMINANT color, not accent colors'],
      'pattern': ['Look for MAIN pattern, ignore small logos or text']
    }
  },

  // Ladies Dresses
  'Ladies_Dress': {
    primaryFocus: ['silhouette', 'length', 'neckline', 'sleeve_style', 'color_main'],
    commonPatterns: ['floral', 'geometric', 'solid', 'polka_dots', 'stripes'],
    visualHints: 'Dress length (mini, midi, maxi) and silhouette (A-line, bodycon, fit-and-flare) are primary identifiers. Focus on overall shape.',
    confidenceBoosts: {
      'silhouette': 1.25,
      'length': 1.2,
      'neckline': 1.15
    },
    conflictResolution: {
      'length': ['Measure from shoulder to hem', 'Mini: above knee', 'Midi: below knee to mid-calf', 'Maxi: ankle length'],
      'silhouette': ['Look at waist definition and skirt flow']
    }
  },

  // Kids Clothing
  'Kids_Tees': {
    primaryFocus: ['color_main', 'graphic_type', 'sleeve_length', 'neck_style'],
    commonPatterns: ['cartoon', 'animal', 'sports', 'solid', 'stripes'],
    visualHints: 'Kids clothing often features bright colors and graphic prints. Focus on main design elements and character themes.',
    confidenceBoosts: {
      'graphic_type': 1.3,
      'color_main': 1.1,
      'pattern': 1.2
    },
    conflictResolution: {
      'graphic_type': ['Character/cartoon themes take priority', 'Sports themes are secondary'],
      'color_main': ['Identify background color of garment, not graphic color']
    }
  },

  // Men's Formal Shirts
  'Mens_Formal_Shirts': {
    primaryFocus: ['collar_style', 'cuff_style', 'color_main', 'pattern', 'fit'],
    commonPatterns: ['solid', 'stripes', 'checks', 'paisley'],
    visualHints: 'Collar shape and cuff details are crucial. Pattern regularity indicates formality level.',
    confidenceBoosts: {
      'collar_style': 1.25,
      'cuff_style': 1.2,
      'pattern': 1.15
    },
    conflictResolution: {
      'collar_style': ['Spread vs. point collar based on angle', 'Button-down has visible buttons on collar'],
      'fit': ['Slim: fitted at waist', 'Regular: straight cut', 'Relaxed: loose fit']
    }
  },

  // Women's Shoes
  'Ladies_Shoes': {
    primaryFocus: ['heel_height', 'toe_shape', 'closure_type', 'material', 'style'],
    commonPatterns: ['solid', 'metallic', 'textured', 'printed'],
    visualHints: 'Heel height and toe shape define shoe category. Material texture is key for luxury vs. casual classification.',
    confidenceBoosts: {
      'heel_height': 1.3,
      'toe_shape': 1.25,
      'style': 1.2
    },
    conflictResolution: {
      'heel_height': ['Flat: <1inch', 'Low: 1-2inch', 'Mid: 2-3inch', 'High: 3+inch'],
      'toe_shape': ['Pointed: narrow triangle', 'Round: circular', 'Square: straight across']
    }
  }
};

// Default strategy for categories without specific intelligence
export const DEFAULT_STRATEGY: ExtractionStrategy = {
  analysisOrder: [
    'overall_scan',
    'primary_characteristics',
    'secondary_details',
    'quality_validation'
  ],
  focusAreas: [
    'main_color_identification',
    'pattern_recognition', 
    'structural_elements',
    'material_assessment'
  ],
  exclusionRules: [
    'ignore_background_objects',
    'ignore_accessories_unless_specified',
    'ignore_lighting_artifacts',
    'ignore_watermarks_or_tags'
  ],
  confidenceThresholds: {
    auto_accept: 85,
    flag_review: 75,
    auto_retry: 60
  }
};

// Category-specific strategies
export const EXTRACTION_STRATEGIES: Record<string, ExtractionStrategy> = {
  'Mens_Tees_Hs': {
    ...DEFAULT_STRATEGY,
    analysisOrder: [
      'neckline_identification',
      'sleeve_assessment', 
      'color_analysis',
      'pattern_check',
      'fit_evaluation'
    ],
    focusAreas: [
      'neck_area_focus',
      'sleeve_length_measurement',
      'torso_fit_analysis'
    ]
  },

  'Ladies_Dress': {
    ...DEFAULT_STRATEGY,
    analysisOrder: [
      'silhouette_assessment',
      'length_measurement',
      'neckline_style',
      'sleeve_analysis',
      'pattern_identification'
    ],
    focusAreas: [
      'overall_shape_analysis',
      'hemline_position',
      'waist_definition'
    ]
  }
};

/**
 * Get category-specific intelligence
 */
export function getCategoryIntelligence(categoryCode: string): CategoryIntelligence | null {
  // Try exact match first
  if (CATEGORY_INTELLIGENCE[categoryCode]) {
    return CATEGORY_INTELLIGENCE[categoryCode];
  }

  // Try pattern matching for similar categories
  const normalizedCode = categoryCode.toLowerCase();
  
  if (normalizedCode.includes('tee') || normalizedCode.includes('shirt')) {
    if (normalizedCode.includes('men') || normalizedCode.includes('male')) {
      return CATEGORY_INTELLIGENCE['Mens_Tees_Hs'] || null;
    }
  }
  
  if (normalizedCode.includes('dress') && (normalizedCode.includes('ladies') || normalizedCode.includes('women'))) {
    return CATEGORY_INTELLIGENCE['Ladies_Dress'] || null;
  }

  if (normalizedCode.includes('kids') || normalizedCode.includes('children')) {
    return CATEGORY_INTELLIGENCE['Kids_Tees'] || null;
  }

  return null;
}

/**
 * Get extraction strategy for category
 */
export function getExtractionStrategy(categoryCode: string): ExtractionStrategy {
  return EXTRACTION_STRATEGIES[categoryCode] || DEFAULT_STRATEGY;
}

/**
 * Calculate confidence boost for attribute
 */
export function getConfidenceBoost(categoryCode: string, attributeKey: string): number {
  const intelligence = getCategoryIntelligence(categoryCode);
  return intelligence?.confidenceBoosts[attributeKey] || 1.0;
}

/**
 * Get conflict resolution guidance
 */
export function getConflictResolution(categoryCode: string, attributeKey: string): string[] {
  const intelligence = getCategoryIntelligence(categoryCode);
  return intelligence?.conflictResolution[attributeKey] || [];
}