// Response Parser based on proven old system
import type { 
  SchemaItem, 
  AttributeData, 
  AttributeDetail,
  DiscoveredAttribute,
  ParsedAIAttribute,
  EnhancedAIResponse,
  ParsedDiscoveryAttribute
} from '../../../types/extraction/ExtractionTypes';

export class ResponseParser {
  
  // Parse basic response (original method from old system)
  async parseResponse(aiResponse: string, schema: SchemaItem[]): Promise<AttributeData> {
    try {
      // Check if AI refused the request
      if (aiResponse.includes("I'm sorry") || aiResponse.includes("I can't") || aiResponse.includes("I'm unable")) {
        console.warn('AI refused the request:', aiResponse);
        throw new Error('AI content policy violation: ' + aiResponse.substring(0, 100));
      }

      const cleanedResponse = this.cleanMarkdownJson(aiResponse);
      const parsed = JSON.parse(cleanedResponse);
      const result: AttributeData = {};

      for (const schemaItem of schema) {
        const aiAttribute: ParsedAIAttribute | undefined = parsed[schemaItem.key];
        if (aiAttribute) {
          result[schemaItem.key] = {
            rawValue: aiAttribute.rawValue || null,
            schemaValue: this.normalizeValue(aiAttribute.schemaValue, schemaItem),
            visualConfidence: aiAttribute.visualConfidence || 0,
            mappingConfidence: 100,
            isNewDiscovery: false,
            reasoning: aiAttribute.reasoning || '',
          };
        } else {
          result[schemaItem.key] = {
            rawValue: null,
            schemaValue: null,
            visualConfidence: 0,
            mappingConfidence: 0,
            isNewDiscovery: false,
            reasoning: '',
          };
        }
      }

      return result;
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.log('Raw response preview:', aiResponse.substring(0, 500));
      throw new Error(
        `Failed to parse AI response: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  // Parse enhanced response with discoveries (from old system)
  async parseEnhancedResponse(
    aiResponse: string,
    schema: SchemaItem[]
  ): Promise<{ attributes: AttributeData; discoveries: DiscoveredAttribute[] }> {
    try {
      // Check if AI refused the request
      if (aiResponse.includes("I'm sorry") || aiResponse.includes("I can't") || aiResponse.includes("I'm unable")) {
        console.warn('AI refused enhanced request:', aiResponse);
        throw new Error('AI content policy violation: ' + aiResponse.substring(0, 100));
      }

      const cleanedResponse = this.cleanMarkdownJson(aiResponse);
      const parsed = JSON.parse(cleanedResponse) as EnhancedAIResponse;

      console.log('Parsing enhanced AI response', {
        hasSchemaAttributes: !!parsed.schemaAttributes,
        hasDiscoveries: !!parsed.discoveries,
        discoveryCount: Object.keys(parsed.discoveries || {}).length,
      });

      const attributes = await this.parseSchemaAttributes(parsed, schema);
      const discoveries = this.parseDiscoveries(parsed.discoveries || {});

      console.log('Enhanced parsing completed', {
        schemaAttributesProcessed: Object.keys(attributes).length,
        discoveriesFound: discoveries.length,
        highConfidenceDiscoveries: discoveries.filter((d) => d.confidence >= 80).length,
      });

      return { attributes, discoveries };
    } catch (error) {
      console.warn('Enhanced parsing failed, falling back to schema-only', { error });
      const attributes = await this.parseResponse(aiResponse, schema);
      return { attributes, discoveries: [] };
    }
  }

  // Parse schema attributes from enhanced response
  private async parseSchemaAttributes(
    parsed: EnhancedAIResponse,
    schema: SchemaItem[]
  ): Promise<AttributeData> {
    const result: AttributeData = {};
    // Safely handle both enhanced format and legacy format
    const schemaData = parsed.schemaAttributes ?? (parsed as Record<string, ParsedAIAttribute>);

    for (const schemaItem of schema) {
      const aiAttribute = schemaData[schemaItem.key];
      if (aiAttribute) {
        result[schemaItem.key] = {
          rawValue: aiAttribute.rawValue || null,
          schemaValue: this.normalizeValue(aiAttribute.schemaValue ?? aiAttribute.rawValue, schemaItem),
          visualConfidence: aiAttribute.visualConfidence || 0,
          mappingConfidence: 100,
          isNewDiscovery: false,
          reasoning: aiAttribute.reasoning || '',
        };
      } else {
        result[schemaItem.key] = {
          rawValue: null,
          schemaValue: null,
          visualConfidence: 0,
          mappingConfidence: 0,
          isNewDiscovery: false,
          reasoning: '',
        };
      }
    }
    return result;
  }

  // Parse discoveries from enhanced response
  private parseDiscoveries(discoveryData: Record<string, ParsedDiscoveryAttribute>): DiscoveredAttribute[] {
    const discoveries: DiscoveredAttribute[] = [];
    
    for (const [key, discovery] of Object.entries(discoveryData)) {
      if ((discovery.confidence || 0) < 50 || !discovery.normalizedValue?.trim()) {
        continue;
      }

      if (!this.isValidDiscoveryKey(key)) {
        console.warn('Invalid discovery key format, skipping', { key });
        continue;
      }

      const discoveredAttribute: DiscoveredAttribute = {
        key,
        label: this.generateLabel(key),
        rawValue: discovery.rawValue || '',
        normalizedValue: this.cleanValue(discovery.normalizedValue),
        confidence: Math.min(Math.max(discovery.confidence || 0, 0), 100), // Clamp 0-100
        reasoning: discovery.reasoning || 'No reasoning provided',
        frequency: 1,
        suggestedType: discovery.suggestedType || this.inferType(discovery.normalizedValue),
        possibleValues:
          discovery.possibleValues?.filter((v): v is string => typeof v === 'string' && v.trim() !== '') || [],
        isPromotable: discovery.isPromotable || false,
      };
      discoveries.push(discoveredAttribute);
    }
    
    return discoveries.sort((a, b) => b.confidence - a.confidence);
  }

  // Helper methods from old system
  private isValidDiscoveryKey(key: string): boolean {
    const keyPattern = /^[a-z][a-z0-9_]{2,29}$/;
    return keyPattern.test(key) && !key.startsWith('_') && !key.endsWith('_');
  }

  private generateLabel(key: string): string {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private cleanValue(value: string): string {
    if (!value) return '';
    return value.trim().replace(/\s+/g, ' ').replace(/[^\w\s\-./()]/g, '').substring(0, 100);
  }

  private inferType(value: string): 'text' | 'select' | 'number' {
    if (!value) return 'text';
    const trimmedValue = value.trim();
    if (!isNaN(Number(trimmedValue)) && trimmedValue.length < 10 && trimmedValue.length > 0) {
      return 'number';
    }
    if (this.looksLikeCategory(trimmedValue)) {
      return 'select';
    }
    return 'text';
  }

  private looksLikeCategory(value: string): boolean {
    const trimmedValue = value.trim();
    return (
      trimmedValue.length <= 50 &&
      trimmedValue.length >= 2 &&
      !trimmedValue.includes('.') &&
      trimmedValue.split(' ').length <= 4 &&
      !/\d{2,}/.test(trimmedValue)
    );
  }

  private cleanMarkdownJson(response: string): string {
    let cleaned = response.trim();
    // Handles ```json ... ``` or ``` ... ```
    if (cleaned.startsWith('```')) {
      const firstNewLine = cleaned.indexOf('\n');
      // If there's a new line, strip off the first line (e.g., ```json)
      // Otherwise, just remove the opening backticks
      cleaned = firstNewLine !== -1 ? cleaned.substring(firstNewLine + 1) : cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  }

  private normalizeValue(value: unknown, schemaItem: SchemaItem): string | number | null {
    if (value === null || value === undefined) return null;
    const stringValue = String(value).trim();
    if (!stringValue) return null;

    switch (schemaItem.type) {
      case 'number': {
        const numValue = Number(stringValue.replace(/[^0-9.-]+/g, ''));
        return isNaN(numValue) ? null : numValue;
      }
      case 'select':
        if (schemaItem.allowedValues && schemaItem.allowedValues.length > 0) {
          return this.findBestMatch(stringValue, schemaItem.allowedValues);
        }
        return stringValue;
      case 'text':
      default:
        return stringValue;
    }
  }

  private findBestMatch(value: string, allowedValues: Array<{ shortForm: string; fullForm: string }>): string | null {
    const normalizedValue = value.toLowerCase().trim();
    
    // First try exact match
    const exactMatch = allowedValues.find(
      (v) =>
        v.shortForm.toLowerCase() === normalizedValue || 
        v.fullForm?.toLowerCase() === normalizedValue
    );
    if (exactMatch) return exactMatch.shortForm;

    // Then try partial match
    const partialMatch = allowedValues.find(
      (v) =>
        v.shortForm.toLowerCase().includes(normalizedValue) ||
        normalizedValue.includes(v.shortForm.toLowerCase()) ||
        v.fullForm?.toLowerCase().includes(normalizedValue) ||
        (v.fullForm && normalizedValue.includes(v.fullForm.toLowerCase()))
    );
    return partialMatch ? partialMatch.shortForm : null;
  }

  // Calculate overall confidence like old system
  calculateOverallConfidence(attributes: AttributeData): number {
    const confidenceValues = Object.values(attributes)
      .filter((attr): attr is AttributeDetail => attr !== null)
      .map((attr) => attr.visualConfidence)
      .filter((conf) => conf > 0);

    if (confidenceValues.length === 0) return 0;

    return Math.round(
      confidenceValues.reduce((sum, conf) => sum + conf, 0) / confidenceValues.length
    );
  }
}