import OpenAI from "openai";
import { CategoryFormData, AttributeField, ExtractionResult, AttributeDetail, CompletedExtractionResult, FailedExtractionResult } from '@/types/fashion'
import { DiscoveredAttribute } from '@/types/discovery'
import { discoveryManager } from '@/lib/services/discoveryManager'
import { 
  getCategoryIntelligence, 
  getExtractionStrategy, 
  getConfidenceBoost,
  getConflictResolution
} from './category-intelligence'
import { SmartCache, CacheHelpers } from './smart-cache'
import crypto from 'crypto'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const smartCache = new SmartCache();

type OpenAIResp = {
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  choices?: Array<{ message?: { content?: string } }>
}



export class FashionAIService {
  // ------------------ MAIN EXTRACTION ------------------
  static async extractAttributes(
    imageUrl: string,
    categoryData: CategoryFormData
  ): Promise<ExtractionResult> {
    return this.extractWithDiscovery(imageUrl, categoryData, false)
  }

  // ------------------ UTILITY METHODS ------------------
  private static generateImageHash(imageUrl: string, category?: string): string {
    return crypto.createHash('sha256')
      .update(`${imageUrl}-${category || 'default'}`)
      .digest('hex');
  }

  // ------------------ DISCOVERY EXTRACTION ------------------
  static async extractWithDiscovery(
    imageUrl: string,
    categoryData: CategoryFormData,
    discoveryEnabled = true
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      console.log(
        `🧠 Starting AI extraction for category: ${categoryData.categoryName}`
      );

      // Generate cache keys
      const imageHash = FashionAIService.generateImageHash(imageUrl, categoryData.categoryName);
      const resultCacheKey = CacheHelpers.getResultKey(imageHash, categoryData.categoryId);
      const promptCacheKey = CacheHelpers.getPromptKey(categoryData.categoryId, categoryData.fields.length);

      // Try to get cached result first
      const cachedResult = await smartCache.getResult(resultCacheKey);
      if (cachedResult) {
        console.log(`✅ Cache hit for ${categoryData.categoryName}`);
        return cachedResult;
      }

      // Build smart prompt with discovery mode (with caching)
      let prompt = smartCache.getPrompt(promptCacheKey);
      if (!prompt) {
        prompt = discoveryEnabled 
          ? this.buildDiscoveryPrompt(categoryData)
          : this.buildSmartPrompt(categoryData);
        smartCache.cachePrompt(promptCacheKey, prompt);
        console.log(`📝 Generated and cached ${discoveryEnabled ? 'discovery' : 'standard'} prompt`);
      } else {
        console.log(`📝 Using cached prompt for ${categoryData.categoryName}`);
      }
      console.log(
        `📝 Generated ${discoveryEnabled ? 'discovery' : 'standard'} prompt for ${categoryData.enabledAttributes} attributes`
      );

      // Call OpenAI GPT-4 Vision
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "system",
            content:
              "You are a fashion expert AI that analyzes clothing images with high precision. Always respond with valid JSON only, no markdown formatting.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: imageUrl,
                  detail: "high",
                },
              },
            ],
          },
        ],
        max_tokens: 1500,
        temperature: 0.1,
      });

  const processingTime = Date.now() - startTime;
  // Cast response to our minimal shape and guard usage tokens
  const resp = response as unknown as OpenAIResp
  const usage = resp.usage ?? { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
  const promptTokens = typeof usage.prompt_tokens === 'number' ? usage.prompt_tokens : 0
  const completionTokens = typeof usage.completion_tokens === 'number' ? usage.completion_tokens : 0
  const totalTokens = typeof usage.total_tokens === 'number' ? usage.total_tokens : 0
  const cost = this.calculateCost(promptTokens, completionTokens)

      console.log(`⚡ AI processing completed in ${processingTime}ms`);
      console.log(
        `💰 Cost: $${cost.toFixed(4)} | Tokens: ${totalTokens}`
      );

      // Parse and validate AI response (guard shape)
      const aiResponse = Array.isArray(resp.choices) ? resp.choices[0]?.message?.content : undefined
      if (!aiResponse || typeof aiResponse !== 'string') {
        throw new Error('No content in AI response')
      }
      
      let parsedResult
      let discoveries: DiscoveredAttribute[] = []
      
      if (discoveryEnabled) {
        const enhancedResult = await this.parseDiscoveryResponse(aiResponse, categoryData.fields as AttributeField[])
        parsedResult = enhancedResult
        discoveries = enhancedResult.discoveries || []
        
        // Add discoveries to global manager
        if (discoveries.length > 0) {
          discoveryManager.addDiscoveries(discoveries, categoryData.categoryId)
          console.log(`🔍 Found ${discoveries.length} discoveries`)
        }
      } else {
        parsedResult = await this.parseAndValidateResponse(aiResponse, categoryData.fields as AttributeField[])
      }

      console.log(
        `✅ Extracted ${Object.keys(parsedResult.attributes).length} attributes`
      );
      // Normalize confidence to percentage (0-100)
      const confidencePercent = Math.round(Math.max(0, Math.min(100, (parsedResult.confidence ?? 0) * 100)))
      console.log(`🎯 Overall confidence: ${confidencePercent}%`);

      // Transform attributes to AttributeDetail format
      const transformedAttributes: Record<string, AttributeDetail> = {};
      for (const [key, value] of Object.entries(parsedResult.attributes)) {
        transformedAttributes[key] = {
          value: value,
          confidence: confidencePercent,
          reasoning: `Extracted via AI vision analysis`,
          fieldLabel: key,
          isValid: value !== null && value !== ''
        };
      }

      const result: CompletedExtractionResult = {
        id: `extraction-${Date.now()}`,
        fileName: `image-${Date.now()}.jpg`, // Will be replaced by actual filename
        createdAt: new Date().toISOString(),
        status: 'completed',
        attributes: transformedAttributes,
        confidence: confidencePercent,
        tokensUsed: typeof totalTokens === 'number' ? Math.max(0, Math.floor(totalTokens)) : 0,
        processingTime: Math.max(0, Math.floor(processingTime)),
        fromCache: false
      };

      // Cache the successful result
      await smartCache.cacheResult(resultCacheKey, result);
      
      return result;
    } catch (error) {
      console.error("❌ AI extraction failed:", error);

      const errorResult: FailedExtractionResult = {
        id: `extraction-${Date.now()}`,
        fileName: `image-${Date.now()}.jpg`, // Will be replaced by actual filename
        createdAt: new Date().toISOString(),
        status: 'failed',
        error: error instanceof Error ? error.message : "Unknown error",
        fromCache: false
      };
      
      return errorResult;
    }
  }

  // ------------------ FIELD PRIORITIZATION ------------------
  private static prioritizeFields(fields: AttributeField[], intelligence: { primaryFocus?: string[] } | null): AttributeField[] {
    if (!intelligence?.primaryFocus) {
      return fields.sort((a, b) => a.label.localeCompare(b.label));
    }

    // Separate high priority and normal priority fields
    const primaryFocus = intelligence.primaryFocus || [];
    const highPriority = fields.filter(field => primaryFocus.includes(field.key));
    const normalPriority = fields.filter(field => !primaryFocus.includes(field.key));

    // Sort each group alphabetically and combine
    return [
      ...highPriority.sort((a, b) => a.label.localeCompare(b.label)),
      ...normalPriority.sort((a, b) => a.label.localeCompare(b.label))
    ];
  }

  // ------------------ PROMPT BUILDER ------------------
  private static buildSmartPrompt(categoryData: CategoryFormData): string {
    const { categoryName, categoryCode, department, subDepartment, fields } = categoryData;

    // Get category-specific intelligence
    const intelligence = getCategoryIntelligence(categoryCode || categoryName);
    const strategy = getExtractionStrategy(categoryCode || categoryName);

    // Build enhanced attribute instructions with category intelligence
    const prioritizedFields = this.prioritizeFields(fields, intelligence);
    const attributeInstructions = prioritizedFields
      .map((field: AttributeField) => {
        const conflictResolution = getConflictResolution(categoryCode || categoryName, field.key);
        const confidenceBoost = getConfidenceBoost(categoryCode || categoryName, field.key);
        
        let instruction = `"${field.key}": {
  "label": "${field.label}",
  "type": "${field.type}",
  "priority": ${intelligence?.primaryFocus.includes(field.key) ? '"HIGH"' : '"NORMAL"'},
  "confidence_boost": ${confidenceBoost}`;

        if (field.options && field.options.length > 0) {
          const optionsList = field.options
            .map((opt: { shortForm: string; fullForm: string }) => `"${opt.shortForm}" (${opt.fullForm})`)
            .join(", ");
          instruction += `,
  "options": [${optionsList}],
  "instruction": "Return exact shortForm value from options, or null if confidence < ${strategy.confidenceThresholds.auto_retry}%"`;
        } else {
          instruction += `,
  "instruction": "Describe what you see, or null if not clearly visible"`;
        }

        if (conflictResolution.length > 0) {
          instruction += `,
  "resolution_hints": [${conflictResolution.map(hint => `"${hint}"`).join(', ')}]`;
        }

        instruction += `
}`;
        return instruction;
      })
      .join(",\n\n");

    // Build enhanced prompt with category intelligence
    const visualHints = intelligence?.visualHints || 'Focus on main garment characteristics and ignore background elements.';
    const analysisOrder = strategy.analysisOrder.map(step => `• ${step.replace(/_/g, ' ')}`).join('\n');
    const focusAreas = strategy.focusAreas.map(area => `• ${area.replace(/_/g, ' ')}`).join('\n');
    
    return `You are a professional fashion expert analyzing a ${department} ${subDepartment} garment: "${categoryName}".

CATEGORY-SPECIFIC GUIDANCE:
${visualHints}

VISUAL ANALYSIS STRATEGY:
${analysisOrder}

FOCUS AREAS:
${focusAreas}

ATTRIBUTES TO EXTRACT:
{
${attributeInstructions}
}

CRITICAL EXTRACTION RULES:
1. Return ONLY exact shortForm values from provided options
2. Use null for attributes with confidence < ${strategy.confidenceThresholds.auto_retry}%
3. Focus on DOMINANT characteristics (main color, primary pattern)
4. HIGH priority attributes require extra attention and accuracy
5. Apply confidence boost multipliers for category-specific attributes
6. Follow resolution hints for conflicting visual information

CONFIDENCE THRESHOLDS:
• Auto-accept: ≥${strategy.confidenceThresholds.auto_accept}%
• Flag for review: ${strategy.confidenceThresholds.flag_review}-${strategy.confidenceThresholds.auto_accept-1}%
• Auto-retry: <${strategy.confidenceThresholds.auto_retry}%

RESPONSE FORMAT (JSON only, no markdown):
{
  "attributes": {
    "attribute_key": {
      "value": "shortForm_value_or_null",
      "confidence": 85,
      "reasoning": "brief_visual_evidence"
    }
  },
  "overall_confidence": 78,
  "category_match": true,
  "visual_quality": "good|fair|poor"
}

Analyze the image systematically and respond with clean JSON:`;
  }

  // ------------------ RESPONSE PARSER ------------------
  private static async parseAndValidateResponse(
    aiResponse: string,
    fields: AttributeField[]
  ): Promise<{
    attributes: Record<string, string | null>;
    confidence: number;
    errors: string[];
  }> {
    const validationErrors: string[] = [];
    const attributes: Record<string, string | null> = {};
    let totalScore = 0;
    let validFields = 0;

    try {
      // Clean the AI response
      let cleanJson = aiResponse.trim();
      if (cleanJson.includes("```")) {
        cleanJson = cleanJson.replace(/```json\s*|\s*```/g, "");
      }

      const parsed = JSON.parse(cleanJson);

      // Validate each field
      for (const field of fields) {
        const aiValue = parsed[field.key];
        let finalValue: string | null = null;
        let fieldScore = 0;

        if (aiValue && aiValue !== "null" && aiValue !== null) {
          if (field.options && field.options.length > 0) {
            const matchedOption = field.options.find(
              (opt: { shortForm: string; fullForm: string }) =>
                opt.shortForm === aiValue ||
                opt.fullForm === aiValue ||
                opt.shortForm.toLowerCase() === String(aiValue).toLowerCase()
            );

            if (matchedOption) {
              finalValue = matchedOption.shortForm;
              fieldScore = 0.95;
            } else {
              const fuzzyMatch = this.findClosestMatch(
                String(aiValue),
                field.options
              );
              if (fuzzyMatch.score > 0.7) {
                finalValue = fuzzyMatch.option.shortForm;
                fieldScore = fuzzyMatch.score * 0.8;
                console.log(
                  `🔍 Fuzzy match: "${aiValue}" → "${finalValue}" (${(
                    fuzzyMatch.score * 100
                  ).toFixed(0)}%)`
                );
              } else {
                validationErrors.push(
                  `Invalid "${field.label}": "${aiValue}" not in options`
                );
                fieldScore = 0;
              }
            }
          } else {
            finalValue = String(aiValue).substring(0, 100);
            fieldScore = 0.85;
          }
        } else {
          fieldScore = 0.6; // AI returned null
        }

        attributes[field.key] = finalValue;
        totalScore += fieldScore;
        validFields++;
      }

      const overallConfidence =
        validFields > 0 ? totalScore / validFields : 0;

      return {
        attributes,
        confidence: Math.min(overallConfidence, 1.0),
        errors: validationErrors,
      };
    } catch (parseError: unknown) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", aiResponse);

      const emptyAttrs: Record<string, string | null> = {};
      fields.forEach((field: AttributeField) => (emptyAttrs[field.key] = null));

      return {
        attributes: emptyAttrs,
        confidence: 0,
        errors: [`Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`],
      };
    }
  }

  // ------------------ FUZZY MATCH ------------------
  private static findClosestMatch(
    value: string,
    options: { shortForm: string; fullForm: string }[]
  ): { option: { shortForm: string; fullForm: string }; score: number } {
    let bestMatch = { option: options[0] ?? { shortForm: '', fullForm: '' }, score: 0 };
    const normalizedValue = this.normalize(value);

    for (const option of options) {
      const shortScore = this.stringSimilarity(
        normalizedValue,
        this.normalize(option.shortForm)
      );
      const fullScore = this.stringSimilarity(
        normalizedValue,
        this.normalize(option.fullForm)
      );

      const maxScore = Math.max(shortScore, fullScore);
      if (maxScore > bestMatch.score) {
        bestMatch = { option, score: maxScore };
      }
    }
    return bestMatch;
  }

  private static normalize(str: string): string {
    return str.toLowerCase().replace(/[^a-z0-9]/g, "");
  }

  private static stringSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0;
    if (str1.includes(str2) || str2.includes(str1)) return 0.8;

    const chars1 = new Set(str1.split(""));
    const chars2 = new Set(str2.split(""));
    const intersection = new Set([...chars1].filter((x) => chars2.has(x)));
    const union = new Set([...chars1, ...chars2]);

    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  // ------------------ COST CALCULATOR ------------------
  private static calculateCost(
    promptTokens: number,
    completionTokens: number
  ): number {
    const promptRate = 0.01 / 1000;
    const completionRate = 0.03 / 1000;
    return promptTokens * promptRate + completionTokens * completionRate;
  }

  // ------------------ DISCOVERY PROMPT BUILDER ------------------
  private static buildDiscoveryPrompt(categoryData: CategoryFormData): string {
    const { categoryName, department, subDepartment, fields } = categoryData;

    const attributeInstructions = fields
      .map((field: AttributeField) => {
        let instruction = `"${field.key}": "${field.label}"`;
        if (field.options && field.options.length > 0) {
          const optionsList = field.options
            .map((opt: { shortForm: string; fullForm: string }) => `"${opt.shortForm}"`)
            .join(", ");
          instruction += ` (options: ${optionsList})`;
        }
        return instruction;
      })
      .join(",\n  ");

    return `You are analyzing a ${department} ${subDepartment} garment: "${categoryName}".

DUAL TASK:
1. EXTRACT standard attributes (return exact shortForm values from options, or descriptive text)
2. DISCOVER new attributes (identify additional characteristics not in the standard list)

STANDARD ATTRIBUTES:
{
  ${attributeInstructions}
}

DISCOVERY INSTRUCTIONS:
- Look for additional visible characteristics not covered by standard attributes
- Focus on: materials, patterns, decorative elements, construction details, style features
- For each discovery, provide: key, label, value, confidence (0-100), reasoning

RESPONSE FORMAT (JSON only, no markdown):
{
  "standardAttributes": {
    "color_main": "value_or_null",
    "neck": "value_or_null"
    // ... etc for all standard attributes
  },
  "discoveries": [
    {
      "key": "unique_snake_key",
      "label": "Human Readable Label", 
      "rawValue": "what_you_see",
      "normalizedValue": "clean_value",
      "confidence": 85,
      "reasoning": "why you identified this",
      "suggestedType": "text|select|number"
    }
  ]
}

Analyze the image now:`;
  }

  // ------------------ DISCOVERY RESPONSE PARSER ------------------
  private static async parseDiscoveryResponse(
    aiResponse: string,
    fields: AttributeField[]
  ): Promise<{
    attributes: Record<string, string | null>;
    confidence: number;
    errors: string[];
    discoveries?: DiscoveredAttribute[] | undefined;
  }> {
    let discoveries: DiscoveredAttribute[] = [];

    try {
      // Clean the AI response
      let cleanJson = aiResponse.trim();
      if (cleanJson.includes("```")) {
        cleanJson = cleanJson.replace(/```json\s*|\s*```/g, "");
      }

      const parsed = JSON.parse(cleanJson);
      
      // Parse standard attributes
      const standardResult = await this.parseAndValidateResponse(
        JSON.stringify(parsed.standardAttributes || parsed),
        fields
      );

      // Parse discoveries
      if (parsed.discoveries && Array.isArray(parsed.discoveries)) {
        discoveries = parsed.discoveries
          .filter((d: unknown) => d && typeof d === 'object')
          .map((d: Record<string, unknown>) => ({
            key: String(d.key || '').toLowerCase().replace(/[^a-z0-9_]/g, '_'),
            label: String(d.label || d.key || ''),
            rawValue: String(d.rawValue || d.value || ''),
            normalizedValue: String(d.normalizedValue || d.rawValue || d.value || ''),
            confidence: Math.min(100, Math.max(0, Number(d.confidence) || 0)),
            reasoning: String(d.reasoning || ''),
            frequency: 1,
            suggestedType: (['text', 'select', 'number'].includes(String(d.suggestedType)) 
              ? String(d.suggestedType) 
              : 'text') as 'text' | 'select' | 'number'
          }))
          .filter((d: DiscoveredAttribute) => d.key && d.label && d.normalizedValue);

        console.log(`🔍 Parsed ${discoveries.length} discoveries from AI response`);
      }

      return {
        ...standardResult,
        discoveries: discoveries.length > 0 ? discoveries : undefined
      };

    } catch (parseError: unknown) {
      console.error("Failed to parse discovery response:", parseError);
      
      // Fallback to standard parsing
      const fallbackResult = await this.parseAndValidateResponse(aiResponse, fields);
      return {
        ...fallbackResult,
        discoveries: undefined,
        errors: [...fallbackResult.errors, `Discovery parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`]
      };
    }
  }
}
