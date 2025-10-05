// Main Extraction Service - orchestrates the AI extraction process
import { ApiService } from '../api/ApiService';
import { PromptService } from './PromptService';
import { ResponseParser } from './ResponseParser';
import type { 
  SchemaItem, 
  AttributeField, 
  ExtractionResult, 
  EnhancedExtractionResult,
  DiscoveredAttribute,
  AttributeData 
} from '../../../types/extraction/ExtractionTypes';

export class ExtractionService {
  private apiService = new ApiService();
  private promptService = new PromptService();
  private responseParser = new ResponseParser();

  // Basic extraction method from old system
  async extractAttributes(
    imageBase64: string,
    schema: SchemaItem[],
    categoryContext?: string
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      console.log('Starting attribute extraction', {
        schemaCount: schema.length,
        hasCategory: !!categoryContext,
        imageSize: imageBase64.length,
      });

      // Generate appropriate prompt based on category context
      const prompt = categoryContext
        ? this.promptService.generateCategorySpecificPrompt(schema, categoryContext)
        : this.promptService.generateGenericPrompt(schema);

      console.log('Generated prompt for extraction', {
        promptLength: prompt.length,
        type: categoryContext ? 'category-specific' : 'generic',
      });

      // Call AI API
      const apiResponse = await this.apiService.callVisionAPI(prompt, imageBase64);
      
      console.log('Received AI response', {
        responseLength: apiResponse.content.length,
        tokensUsed: apiResponse.tokensUsed,
        processingTime: Date.now() - startTime,
      });

      // Parse response
      const attributes = await this.responseParser.parseResponse(apiResponse.content, schema);
      const overallConfidence = this.responseParser.calculateOverallConfidence(attributes);

      console.log('Extraction completed', {
        attributesExtracted: Object.keys(attributes).length,
        overallConfidence,
        totalTime: Date.now() - startTime,
      });

      return {
        attributes,
        overallConfidence,
        processingTime: Date.now() - startTime,
        metadata: {
          schemaItemsCount: schema.length,
          categoryContext: categoryContext || 'generic',
          model: 'gpt-4o',
          timestamp: new Date().toISOString(),
          tokensUsed: apiResponse.tokensUsed,
        },
      };
    } catch (error) {
      console.error('Extraction failed', { error, processingTime: Date.now() - startTime });
      throw new Error(`Extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Enhanced extraction with discovery mode (from old system)
  async extractWithDiscovery(
    imageBase64: string,
    schema: SchemaItem[],
    categoryContext?: string,
    attributeFields?: AttributeField[]
  ): Promise<EnhancedExtractionResult> {
    const startTime = Date.now();

    try {
      console.log('Starting enhanced extraction with discovery', {
        schemaCount: schema.length,
        attributeFieldsCount: attributeFields?.length || 0,
        hasCategory: !!categoryContext,
      });

      // Generate discovery prompt
      const prompt = this.promptService.generateDiscoveryPrompt(
        schema,
        attributeFields || [],
        categoryContext
      );

      console.log('Generated discovery prompt', {
        promptLength: prompt.length,
        includesAttributeFields: !!attributeFields?.length,
      });

      // Call AI API
      const apiResponse = await this.apiService.callVisionAPI(prompt, imageBase64);

      console.log('Received AI response for discovery', {
        responseLength: apiResponse.content.length,
        tokensUsed: apiResponse.tokensUsed,
        processingTime: Date.now() - startTime,
      });

      // Parse enhanced response
      const { attributes, discoveries } = await this.responseParser.parseEnhancedResponse(
        apiResponse.content,
        schema
      );

      const overallConfidence = this.responseParser.calculateOverallConfidence(attributes);

      // Filter and enhance discoveries
      const enhancedDiscoveries = this.enhanceDiscoveries(discoveries, categoryContext);

      console.log('Enhanced extraction completed', {
        attributesExtracted: Object.keys(attributes).length,
        discoveredAttributes: discoveries.length,
        highConfidenceDiscoveries: enhancedDiscoveries.filter(d => d.confidence >= 80).length,
        overallConfidence,
        totalTime: Date.now() - startTime,
      });

      return {
        attributes,
        discoveries: enhancedDiscoveries,
        overallConfidence,
        processingTime: Date.now() - startTime,
        metadata: {
          schemaItemsCount: schema.length,
          categoryContext: categoryContext || 'generic',
          model: 'gpt-4o',
          timestamp: new Date().toISOString(),
          tokensUsed: apiResponse.tokensUsed,
          discoveryMode: true,
          attributeFieldsProvided: !!attributeFields?.length,
        },
      };
    } catch (error) {
      console.error('Enhanced extraction failed', { error, processingTime: Date.now() - startTime });
      
      // Fallback to basic extraction if discovery fails
      console.log('Falling back to basic extraction');
      const basicResult = await this.extractAttributes(imageBase64, schema, categoryContext);
      
      return {
        attributes: basicResult.attributes,
        discoveries: [],
        overallConfidence: basicResult.overallConfidence,
        processingTime: basicResult.processingTime,
        metadata: {
          ...basicResult.metadata,
          discoveryMode: false,
          fallbackUsed: true,
        },
      };
    }
  }

  // Enhance discoveries with additional processing
  private enhanceDiscoveries(
    discoveries: DiscoveredAttribute[],
    categoryContext?: string
  ): DiscoveredAttribute[] {
    return discoveries
      .filter(discovery => this.isValidDiscovery(discovery))
      .map(discovery => ({
        ...discovery,
        // Boost confidence for category-relevant discoveries
        confidence: this.adjustConfidenceForCategory(discovery, categoryContext),
        // Enhance suggestedType based on value patterns
        suggestedType: this.refineSuggestedType(discovery),
        // Clean and validate possible values
        possibleValues: this.cleanPossibleValues(discovery.possibleValues),
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 20); // Limit to top 20 discoveries
  }

  // Validate discovery quality
  private isValidDiscovery(discovery: DiscoveredAttribute): boolean {
    if (discovery.confidence < 50) return false;
    if (!discovery.normalizedValue?.trim()) return false;
    if (discovery.normalizedValue.length < 2 || discovery.normalizedValue.length > 100) return false;
    
    // Filter out generic or meaningless values
    const genericValues = ['yes', 'no', 'true', 'false', 'n/a', 'none', 'unknown', 'other'];
    if (genericValues.includes(discovery.normalizedValue.toLowerCase())) return false;
    
    return true;
  }

  // Adjust confidence based on category context
  private adjustConfidenceForCategory(
    discovery: DiscoveredAttribute,
    categoryContext?: string
  ): number {
    let confidence = discovery.confidence;
    
    if (categoryContext) {
      // Boost confidence for category-relevant attributes
      const categoryKeywords = categoryContext.toLowerCase().split(/\s+/);
      const discoveryText = `${discovery.key} ${discovery.normalizedValue}`.toLowerCase();
      
      const relevance = categoryKeywords.some(keyword => 
        discoveryText.includes(keyword)
      );
      
      if (relevance) {
        confidence = Math.min(confidence + 10, 100);
      }
    }
    
    return confidence;
  }

  // Refine suggested type based on value patterns
  private refineSuggestedType(discovery: DiscoveredAttribute): 'text' | 'select' | 'number' {
    const value = discovery.normalizedValue.toLowerCase();
    
    // Number detection
    if (/^\d+(\.\d+)?$/.test(value)) {
      return 'number';
    }
    
    // Select detection (categorical values)
    if (value.length <= 30 && 
        !value.includes('.') && 
        value.split(' ').length <= 3) {
      return 'select';
    }
    
    return 'text';
  }

  // Clean and validate possible values
  private cleanPossibleValues(possibleValues?: string[]): string[] {
    if (!possibleValues) return [];
    
    return possibleValues
      .filter(value => value && value.trim().length >= 2)
      .map(value => value.trim())
      .filter((value, index, array) => array.indexOf(value) === index) // Remove duplicates
      .slice(0, 10); // Limit to 10 possible values
  }

  // Calculate overall confidence (exposed method from old system)
  calculateOverallConfidence(attributes: AttributeData): number {
    return this.responseParser.calculateOverallConfidence(attributes);
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; services: Record<string, boolean> }> {
    try {
      // Test each service component
      const apiHealth = await this.testApiService();
      const promptHealth = this.testPromptService();
      const parserHealth = this.testResponseParser();

      return {
        status: apiHealth && promptHealth && parserHealth ? 'healthy' : 'degraded',
        services: {
          apiService: apiHealth,
          promptService: promptHealth,
          responseParser: parserHealth,
        },
      };
    } catch (error) {
      console.error('Health check failed', { error });
      return {
        status: 'unhealthy',
        services: {
          apiService: false,
          promptService: false,
          responseParser: false,
        },
      };
    }
  }

  private async testApiService(): Promise<boolean> {
    try {
      // Simple test to see if API service is configured
      return typeof this.apiService.callVisionAPI === 'function';
    } catch {
      return false;
    }
  }

  private testPromptService(): boolean {
    try {
      // Test prompt generation with minimal schema
      const testSchema: SchemaItem[] = [{ key: 'test', label: 'Test', type: 'text' }];
      const prompt = this.promptService.generateGenericPrompt(testSchema);
      return prompt.length > 0;
    } catch {
      return false;
    }
  }

  private testResponseParser(): boolean {
    try {
      // Test basic parsing functionality
      return typeof this.responseParser.parseResponse === 'function';
    } catch {
      return false;
    }
  }
}