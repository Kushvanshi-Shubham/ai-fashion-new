// Core extraction types based on proven old system
export interface AttributeDetail {
  schemaValue: string | number | null;
  rawValue: string | null;
  isNewDiscovery: boolean;
  visualConfidence: number;
  mappingConfidence: number;
  reasoning?: string;
}

export interface AttributeData {
  [key: string]: AttributeDetail | null;
}

export interface ExtractionResult {
  attributes: AttributeData;
  overallConfidence: number;
  processingTime: number;
  metadata: {
    schemaItemsCount: number;
    categoryContext: string;
    model: string;
    timestamp: string;
    tokensUsed?: number;
  };
}

export interface EnhancedExtractionResult extends ExtractionResult {
  discoveries: DiscoveredAttribute[];
  metadata: ExtractionResult['metadata'] & {
    discoveryMode: boolean;
    attributeFieldsProvided?: boolean;
    fallbackUsed?: boolean;
  };
}

export interface DiscoveredAttribute {
  key: string;
  label: string;
  rawValue: string;
  normalizedValue: string;
  confidence: number;
  reasoning: string;
  frequency: number;
  suggestedType: 'text' | 'select' | 'number';
  possibleValues?: string[];
  isPromotable?: boolean;
}

export interface ParsedAIAttribute {
  rawValue: string | null;
  schemaValue: string | number | null;
  visualConfidence: number;
  reasoning?: string;
}

export interface EnhancedAIResponse {
  schemaAttributes?: Record<string, ParsedAIAttribute>;
  discoveries?: Record<string, ParsedDiscoveryAttribute>;
}

export interface ParsedDiscoveryAttribute {
  rawValue?: string;
  normalizedValue?: string;
  confidence?: number;
  reasoning?: string;
  suggestedType?: 'text' | 'select' | 'number';
  possibleValues?: (string | undefined)[];
  isPromotable?: boolean;
}

// From your current system - keeping compatibility
export interface AttributeField {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: Array<{ shortForm: string; fullForm: string }>;
}

export interface SchemaItem {
  key: string;
  label: string;
  type: 'text' | 'select' | 'number';
  required?: boolean;
  allowedValues?: Array<{ shortForm: string; fullForm: string }>;
  fullForm?: string;
}

export type ModelType = 'gpt-4o' | 'gpt-4-vision-preview' | 'gpt-4-turbo' | 'gpt-3.5-turbo';