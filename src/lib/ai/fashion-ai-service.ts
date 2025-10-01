import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ExtractionResult {
  success: boolean;
  attributes: Record<string, string | null>;
  confidence: number;
  processingTime: number;
  tokenUsage: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost: number;
  aiModel: string;
  rawResponse?: string;
  errors?: string[];
}

export class FashionAIService {
  // ------------------ MAIN EXTRACTION ------------------
  static async extractAttributes(
    imageUrl: string,
    categoryData: any
  ): Promise<ExtractionResult> {
    const startTime = Date.now();

    try {
      console.log(
        `🧠 Starting AI extraction for category: ${categoryData.categoryName}`
      );

      // Build smart prompt
      const prompt = this.buildSmartPrompt(categoryData);
      console.log(
        `📝 Generated prompt for ${categoryData.enabledAttributes} attributes`
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
      const usage = response.usage!;
      const cost = this.calculateCost(
        usage.prompt_tokens,
        usage.completion_tokens
      );

      console.log(`⚡ AI processing completed in ${processingTime}ms`);
      console.log(
        `💰 Cost: $${cost.toFixed(4)} | Tokens: ${usage.total_tokens}`
      );

      // Parse and validate AI response
      const aiResponse = response.choices[0].message.content!;
      const parsedResult = await this.parseAndValidateResponse(
        aiResponse,
        categoryData.fields
      );

      console.log(
        `✅ Extracted ${Object.keys(parsedResult.attributes).length} attributes`
      );
      console.log(
        `🎯 Overall confidence: ${(parsedResult.confidence * 100).toFixed(1)}%`
      );

      return {
        success: true,
        attributes: parsedResult.attributes,
        confidence: parsedResult.confidence,
        processingTime,
        tokenUsage: {
          prompt: usage.prompt_tokens,
          completion: usage.completion_tokens,
          total: usage.total_tokens,
        },
        cost,
        aiModel: "gpt-4-vision-preview",
        rawResponse: aiResponse,
        errors: parsedResult.errors,
      };
    } catch (error) {
      console.error("❌ AI extraction failed:", error);

      return {
        success: false,
        attributes: {},
        confidence: 0,
        processingTime: Date.now() - startTime,
        tokenUsage: { prompt: 0, completion: 0, total: 0 },
        cost: 0,
        aiModel: "gpt-4-vision-preview",
        errors: [error instanceof Error ? error.message : "Unknown error"],
      };
    }
  }

  // ------------------ PROMPT BUILDER ------------------
  private static buildSmartPrompt(categoryData: any): string {
    const { categoryName, department, subDepartment, fields } = categoryData;

    const attributeInstructions = fields
      .map((field: any) => {
        let instruction = `"${field.key}": {
  "label": "${field.label}",
  "type": "${field.type}"`;

        if (field.options && field.options.length > 0) {
          const optionsList = field.options
            .map((opt: any) => `"${opt.shortForm}" (${opt.fullForm})`)
            .join(", ");
          instruction += `,
  "options": [${optionsList}],
  "instruction": "Return exact shortForm value from options, or null if not visible"`;
        } else {
          instruction += `,
  "instruction": "Describe what you see, or null if not visible"`;
        }

        instruction += `
}`;
        return instruction;
      })
      .join(",\n\n");

    return `You are analyzing a ${department} ${subDepartment} garment: "${categoryName}".

EXTRACT THESE ATTRIBUTES:
{
${attributeInstructions}
}

CRITICAL RULES:
1. Return ONLY the exact shortForm values from the provided options
2. Use null for attributes you cannot clearly determine
3. Focus on the main/dominant characteristics of the garment
4. For colors, identify the PRIMARY garment color (not accents/prints)
5. Be conservative - accuracy over completeness

RESPONSE FORMAT (JSON only, no markdown):
{
  "color_main": "shortForm_value_or_null",
  "neck": "shortForm_value_or_null",
  "sleeves_main_style": "shortForm_value_or_null"
  // ... etc for all attributes
}

Analyze the image now and respond with clean JSON:`;
  }

  // ------------------ RESPONSE PARSER ------------------
  private static async parseAndValidateResponse(
    aiResponse: string,
    fields: any[]
  ): Promise<{
    attributes: Record<string, string | null>;
    confidence: number;
    errors: string[];
  }> {
    const errors: string[] = [];
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
              (opt: any) =>
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
                errors.push(
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
        errors,
      };
    } catch (parseError: any) {
      console.error("Failed to parse AI response:", parseError);
      console.log("Raw response:", aiResponse);

      const emptyAttrs: Record<string, string | null> = {};
      fields.forEach((field: any) => (emptyAttrs[field.key] = null));

      return {
        attributes: emptyAttrs,
        confidence: 0,
        errors: [`Parse error: ${parseError.message}`],
      };
    }
  }

  // ------------------ FUZZY MATCH ------------------
  private static findClosestMatch(
    value: string,
    options: any[]
  ): { option: any; score: number } {
    let bestMatch = { option: options[0], score: 0 };
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
}
