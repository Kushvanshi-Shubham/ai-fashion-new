// src/lib/ai/openai-vision-extractor.ts
import OpenAI from 'openai'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface ExtractionConfig {
  categoryId: string
  imageUrl: string
  sessionId?: string
}

interface AttributeExtractionResult {
  key: string
  value: string | null
  confidence: number
  reasoning?: string
}

export class OpenAIVisionExtractor {
  static async extractAttributes(config: ExtractionConfig) {
    const startTime = Date.now()
    
    try {
      // Get category with enabled attributes
      const category = await prisma.category.findUnique({
        where: { id: config.categoryId },
        include: {
          subDepartment: {
            include: { department: true }
          },
          attributeConfigs: {
            where: { isEnabled: true },
            include: { attribute: true },
            orderBy: [
              { attribute: { aiWeight: 'desc' } },
              { sortOrder: 'asc' }
            ]
          }
        }
      })
      
      if (!category) {
        throw new Error('Category not found')
      }
      
      // Generate AI prompt based on your attribute structure
      const prompt = this.generateExtractionPrompt(category)
      
      // Call OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: { url: config.imageUrl }
              }
            ]
          }
        ],
        max_tokens: 2000,
        temperature: 0.1
      })
      
      const aiResponse = response.choices?.message?.content
      if (!aiResponse) {
        throw new Error('No response from OpenAI')
      }
      
      // Parse AI response and map to your shortForm values
      const extractedAttributes = await this.parseAIResponse(
        aiResponse, 
        category.attributeConfigs
      )
      
      // Calculate overall confidence
      const overallConfidence = this.calculateOverallConfidence(extractedAttributes)
      
      // Save extraction to database
      const extraction = await prisma.extraction.create({
        data: {
          imageUrl: config.imageUrl,
          categoryId: config.categoryId,
          extractedData: JSON.stringify(extractedAttributes),
          rawAIResponse: JSON.stringify({
            prompt,
            response: aiResponse,
            model: "gpt-4-vision-preview"
          }),
          confidence: overallConfidence,
          aiModel: "gpt-4-vision-preview",
          promptVersion: "v1.0",
          processingTime: Date.now() - startTime,
          tokenUsage: response.usage?.total_tokens || 0,
          cost: this.calculateCost(response.usage?.total_tokens || 0),
          status: 'COMPLETED',
          sessionId: config.sessionId
        }
      })
      
      return {
        extractionId: extraction.id,
        attributes: extractedAttributes,
        confidence: overallConfidence,
        processingTime: Date.now() - startTime
      }
      
    } catch (error: any) {
      console.error('Extraction failed:', error)
      
      // Save failed extraction
      await prisma.extraction.create({
        data: {
          imageUrl: config.imageUrl,
          categoryId: config.categoryId,
          extractedData: JSON.stringify({}),
          confidence: 0,
          aiModel: "gpt-4-vision-preview",
          processingTime: Date.now() - startTime,
          status: 'FAILED',
          errorMessage: error.message,
          sessionId: config.sessionId
        }
      })
      
      throw error
    }
  }
  
  private static generateExtractionPrompt(category: any): string {
    const enabledAttributes = category.attributeConfigs
    const categoryInfo = `${category.subDepartment?.department?.name} > ${category.subDepartment?.name} > ${category.displayName}`
    
    let prompt = `You are a professional fashion expert analyzing a ${categoryInfo} garment image.

Extract the following attributes from the image and return them in JSON format:

`
    
    enabledAttributes.forEach((config: any) => {
      const attr = config.attribute
      prompt += `"${attr.key}": {
  "description": "${attr.aiPromptHint || attr.description}",
  "options": ${attr.allowedValues || '[]'},
  "instruction": "Return the shortForm value from options, or 'NOT_VISIBLE' if unclear"
},

`
    })
    
    prompt += `
IMPORTANT RULES:
1. Return ONLY valid shortForm values from the provided options
2. Use "NOT_VISIBLE" if you cannot clearly determine the attribute
3. Focus on the main/dominant characteristics
4. For colors, identify the primary garment color (not prints/accents)
5. Return response as clean JSON only, no markdown formatting

Example response format:
{
  "color_-_main": "BLU",
  "neck": "RN_NK", 
  "sleeves_main_style": "HS",
  "length": "REGULAR",
  "fit": "REG_FIT",
  "additional_accessories": "NOT_VISIBLE"
}

Analyze the image now:`
    
    return prompt
  }
  
  private static async parseAIResponse(
    aiResponse: string, 
    attributeConfigs: any[]
  ): Promise<AttributeExtractionResult[]> {
    try {
      // Clean response and extract JSON
      let jsonStr = aiResponse.trim()
      if (jsonStr.includes('```')) {
        jsonStr = jsonStr.replace(/```json\s*|\s*```/g, '').trim()
      }
      
      const parsed = JSON.parse(jsonStr)
      const results: AttributeExtractionResult[] = []
      
      for (const config of attributeConfigs) {
        const key = config.attribute.key
        const rawValue = parsed[key]
        
        let finalValue: string | null = null
        let confidence = 0
        
        if (rawValue && rawValue !== 'NOT_VISIBLE') {
          // Validate against allowed values
          const allowedValues = config.attribute.allowedValues 
            ? JSON.parse(config.attribute.allowedValues) 
            : []
          
          const validOption = allowedValues.find((option: any) => 
            option.shortForm === rawValue || option.fullForm === rawValue
          )
          
          if (validOption) {
            finalValue = validOption.shortForm
            confidence = 0.85 // High confidence for exact match
          } else {
            // Try fuzzy matching
            const fuzzyMatch = this.findFuzzyMatch(rawValue, allowedValues)
            if (fuzzyMatch) {
              finalValue = fuzzyMatch.shortForm
              confidence = 0.6 // Lower confidence for fuzzy match
            }
          }
        }
        
        results.push({
          key,
          value: finalValue,
          confidence,
          reasoning: `AI extracted: "${rawValue}"`
        })
      }
      
      return results
      
    } catch (error) {
      console.error('Failed to parse AI response:', error)
      // Return empty results with low confidence
      return attributeConfigs.map(config => ({
        key: config.attribute.key,
        value: null,
        confidence: 0,
        reasoning: 'Parse error'
      }))
    }
  }
  
  private static findFuzzyMatch(value: string, options: any[]): any | null {
    const normalizeString = (str: string) => 
      str.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    const normalizedValue = normalizeString(value)
    
    for (const option of options) {
      const normalizedShort = normalizeString(option.shortForm)
      const normalizedFull = normalizeString(option.fullForm)
      
      if (normalizedShort.includes(normalizedValue) || 
          normalizedValue.includes(normalizedShort) ||
          normalizedFull.includes(normalizedValue) || 
          normalizedValue.includes(normalizedFull)) {
        return option
      }
    }
    
    return null
  }
  
  private static calculateOverallConfidence(results: AttributeExtractionResult[]): number {
    if (results.length === 0) return 0
    
    const totalConfidence = results.reduce((sum, result) => sum + result.confidence, 0)
    return totalConfidence / results.length
  }
  
  private static estimateTokensNeeded(imageSize: number, attributeCount: number): number {
    // Base token allocation for system context
    const baseTokens = 100
    
    // Tokens for image analysis (scaled by image size)
    const imageTokens = Math.ceil(imageSize / 1024) * 10
    
    // Tokens per attribute (including context and response)
    const tokensPerAttribute = 50
    
    return baseTokens + imageTokens + (attributeCount * tokensPerAttribute)
  }

  private static calculateCost(tokens: number): number {
    // GPT-4 Vision pricing (approximate)
    const inputRate = 0.01 // $0.01 per 1K tokens
    const outputRate = 0.03 // $0.03 per 1K tokens
    
    // Estimate 70% input, 30% output split
    const inputTokens = Math.round(tokens * 0.7)
    const outputTokens = Math.round(tokens * 0.3)
    
    return (inputTokens * inputRate + outputTokens * outputRate) / 1000
  }
}
