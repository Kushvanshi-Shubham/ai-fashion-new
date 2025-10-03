import { OpenAI } from 'openai'
import { Redis } from 'ioredis'
import crypto from 'crypto'
import { CategoryFormData, ExtractionResult, AttributeDetail, AttributeField } from '@/types/fashion'

// Minimal OpenAI response shape used by this module
type OpenAIUsage = { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number }
type OpenAIChoice = { message?: { content?: string } }
type OpenAIResponse = { choices?: OpenAIChoice[]; usage?: OpenAIUsage }

type AIParsed = { attributes?: Record<string, unknown>; overall_confidence?: number }

type AIAttributeEntry = {
  value?: unknown
  confidence?: number
  reasoning?: string
}

// Initialize clients with error handling
let openai: OpenAI | null = null
let redis: Redis | null = null

try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 30000, // 30 second timeout
    maxRetries: 3,
  })
  
  // Optional Redis for caching
  if (process.env.REDIS_DISABLED === 'true') {
    console.debug('Redis disabled via REDIS_DISABLED env (ai-service)')
  } else if (process.env.REDIS_URL) {
    // ioredis v5 constructor supports a single URL string
    try {
      redis = new Redis(process.env.REDIS_URL)
      // configure retries carefully
      redis.options = { ...(redis.options || {}), maxRetriesPerRequest: 3 }

      // Attach error handler to prevent unhandled exception events
      redis.on('error', (err) => {
        // Log warning and disable redis usage by setting to null
        console.warn('Redis error:', err)
        try {
          // Attempt graceful disconnect
          void redis?.quit()
        } catch {
          // ignore
        }
        // Nullify so rest of code falls back to in-memory caches
        // Note: we intentionally don't throw here to avoid process crash
        // during transient Redis outages in development.
        redis = null
      })

      redis.on('connect', () => {
        console.debug('Redis connecting...')
      })

      redis.on('ready', () => {
        console.debug('Redis ready')
      })
    } catch (err) {
      console.warn('Failed to initialize Redis client, continuing without cache:', err)
      redis = null
    }
  }
} catch (error) {
  console.error('Failed to initialize AI service:', error)
}

interface AIServiceConfig {
  model: string
  maxTokens: number
  temperature: number
  cacheEnabled: boolean
  cacheTTL: number
}

const DEFAULT_CONFIG: AIServiceConfig = {
  model: 'gpt-4o-mini', // Cost optimized
  maxTokens: 1000,
  temperature: 0.1,
  cacheEnabled: true,
  cacheTTL: 3600 * 24, // 24 hours
}

export class AIService {
  private static promptCache = new Map<string, string>()
  private static resultCache = new Map<string, { result: ExtractionResult; expiry: number }>()
  private static requestCount = 0
  private static tokenUsage = { total: 0, prompt: 0, completion: 0 }
  
  // Memory management
  private static readonly MAX_CACHE_SIZE = 1000
  private static readonly CLEANUP_THRESHOLD = 800

  /**
   * Extract attributes from image with comprehensive error handling
   */
  static async extractAttributes(
    imageBuffer: Buffer,
    categoryData: CategoryFormData,
    config: Partial<AIServiceConfig> = {}
  ): Promise<ExtractionResult> {
    const startTime = Date.now()
    const finalConfig = { ...DEFAULT_CONFIG, ...config }
    
    if (!openai) {
      throw new Error('OpenAI client not initialized. Check your API key.')
    }

    try {
      // Generate cache key
      const imageHash = this.generateImageHash(imageBuffer)
      const cacheKey = `extraction:${categoryData.categoryId}:${imageHash}`
      
      // Try cache first
      if (finalConfig.cacheEnabled) {
        const cached = await this.getCachedResult(cacheKey)
        if (cached) {
          console.log(`✅ Cache hit for ${categoryData.categoryName}`)
          // Return cached result (do not mutate with fields not present on all variants)
          return { ...cached, fromCache: true } as ExtractionResult
        }
      }

      // Prepare image
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`
      
      // Generate optimized prompt
      const prompt = this.generateExtractionPrompt(categoryData)
      
      // Call OpenAI with retries
      const response = await this.callOpenAIWithRetry({
        model: finalConfig.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional fashion expert AI. Analyze clothing with precision and return only valid JSON.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image,
                  detail: 'low' // Cost optimization
                }
              }
            ]
          }
        ],
        max_tokens: finalConfig.maxTokens,
        temperature: finalConfig.temperature,
        response_format: { type: 'json_object' }
      })

      // Process response
      const result = await this.processAIResponse(response, categoryData, startTime)
      
      // Cache result
      if (finalConfig.cacheEnabled) {
        await this.cacheResult(cacheKey, result, finalConfig.cacheTTL)
      }
      
        // Update usage stats (guard numeric fields)
        this.updateUsageStats({
          total_tokens: typeof response.usage?.total_tokens === 'number' ? response.usage!.total_tokens : 0,
          prompt_tokens: typeof response.usage?.prompt_tokens === 'number' ? response.usage!.prompt_tokens : 0,
          completion_tokens: typeof response.usage?.completion_tokens === 'number' ? response.usage!.completion_tokens : 0,
        })
      
      // Memory cleanup
      this.performMemoryCleanup()
      
      return result

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('AI extraction failed:', err)

      // Return structured failed extraction result (minimal fields)
      return {
        id: `failed_${Date.now()}`,
        fileName: 'extraction_failed',
        status: 'failed',
        createdAt: new Date().toISOString(),
        fromCache: false,
        // Provide a minimal error field expected by callers
        // (types/fashion's FailedExtractionResult contains 'error')
        error: errorMsg
      } as unknown as ExtractionResult
    }
  }

  /**
   * Generate optimized extraction prompt
   */
  private static generateExtractionPrompt(categoryData: CategoryFormData): string {
    const cacheKey = `prompt:${categoryData.categoryId}:${categoryData.fields.length}`
    
    if (this.promptCache.has(cacheKey)) {
      return this.promptCache.get(cacheKey)!
    }

    const attributeSpecs = categoryData.fields
      .filter(field => field.aiExtractable)
      .slice(0, 15) // Limit for token optimization
      .map(field => {
        const options = field.options 
          ? field.options.slice(0, 8).map((opt) => `"${opt.shortForm}"`).join('|')
          : 'text'
        
        return `"${field.key}": {
  "label": "${field.label}",
  "type": "${field.type}",
  "options": [${options}],
  "required": ${field.required}
}`
      })
      .join(',\n')

    const prompt = `Analyze this ${categoryData.department} ${categoryData.subDepartment} garment: "${categoryData.categoryName}"

ATTRIBUTES TO EXTRACT:
{
${attributeSpecs}
}

STRICT RULES:
1. Return ONLY exact shortForm values from options
2. Use null for uncertain/invisible attributes
3. Focus on PRIMARY characteristics (main color, dominant pattern)
4. Confidence 0-100 based on visual clarity
5. Brief reasoning (max 10 words)

REQUIRED JSON FORMAT:
{
  "attributes": {
    "attribute_key": {
      "value": "shortForm_or_null",
      "confidence": 85,
      "reasoning": "clear_visual_evidence"
    }
  },
  "overall_confidence": 78
}

Respond with clean JSON only:`

    // Cache the prompt
    this.promptCache.set(cacheKey, prompt)
    
    // Memory management for prompt cache
    if (this.promptCache.size > this.MAX_CACHE_SIZE) {
      this.cleanupPromptCache()
    }
    
    return prompt
  }

  /**
   * Call OpenAI with retry logic
   */
  private static async callOpenAIWithRetry(params: unknown, maxRetries = 3): Promise<OpenAIResponse> {
    let lastError: Error | null = null

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🤖 OpenAI attempt ${attempt}/${maxRetries}`)
  // The OpenAI SDK client has a dynamic shape here; treat as unknown and cast to our minimal response
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (openai as any)!.chat.completions.create(params)

  this.requestCount++
  return response as OpenAIResponse
        
      } catch (error) {
  lastError = error as Error
        
        // Don't retry on certain errors
        if (error instanceof Error) {
          if (error.message.includes('invalid_api_key') || 
              error.message.includes('insufficient_quota')) {
            throw error
          }
        }
        
        // Exponential backoff
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000
          console.log(`⏳ Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    throw lastError ?? new Error('Unknown OpenAI error')
  }

  /**
   * Process AI response with validation
   */
  private static async processAIResponse(
    response: OpenAIResponse, 
    categoryData: CategoryFormData, 
    startTime: number
  ): Promise<ExtractionResult> {
    const content = response.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from OpenAI')
    }
    let parsed: AIParsed | null = null
    try {
      const p = JSON.parse(content)
      parsed = typeof p === 'object' && p !== null ? (p as AIParsed) : null
    } catch (error) {
      console.error('JSON parse failed for AI response:', error)
      throw new Error(`Invalid JSON response: ${String(content).substring(0, 100)}...`)
    }
    // Validate and normalize response
  const attributes: Record<string, AttributeDetail> = {}
    // Use safe access for parsed
  const rawAttributes: Record<string, unknown> = parsed && parsed.attributes && typeof parsed.attributes === 'object' ? (parsed.attributes as Record<string, unknown>) : {}

    for (const field of categoryData.fields as AttributeField[]) {
      const aiDataRaw = rawAttributes ? rawAttributes[field.key] : undefined
      const aiData = (aiDataRaw && typeof aiDataRaw === 'object') ? (aiDataRaw as AIAttributeEntry) : undefined

      if (aiData && typeof aiData === 'object' && 'value' in aiData && aiData.value !== undefined && aiData.value !== 'null') {
        const rawVal = (aiData as AIAttributeEntry).value
        const validatedValue = this.validateAttributeValue(String(rawVal), field)

        attributes[field.key] = {
          value: validatedValue,
          confidence: this.normalizeConfidence(typeof aiData.confidence === 'number' ? aiData.confidence : 0),
          reasoning: aiData.reasoning ?? 'No reasoning provided',
          fieldLabel: field.label,
          isValid: validatedValue !== null
        }
      } else {
        attributes[field.key] = {
          value: null,
          confidence: 0,
          reasoning: 'Not visible or uncertain',
          fieldLabel: field.label,
          isValid: true
        }
      }
    }

  const overallConfidenceRaw = parsed && typeof parsed === 'object' && typeof parsed.overall_confidence === 'number' ? parsed.overall_confidence : 0
  const overallConfidence = this.normalizeConfidence(overallConfidenceRaw)

    // Guard tokensUsed read
    const tokensUsed = typeof response.usage?.total_tokens === 'number' ? response.usage!.total_tokens : 0

    // Ensure integer processingTime
    const processingTime = Math.max(0, Date.now() - startTime)

    return {
      id: `ext_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      fileName: categoryData.categoryName,
      status: 'completed',
      attributes,
      confidence: overallConfidence,
      tokensUsed: typeof tokensUsed === 'number' ? tokensUsed : 0,
      processingTime,
      createdAt: new Date().toISOString(),
      fromCache: false
    }
  }

  /**
   * Normalize confidence value into integer 0-100.
   * Accepts either a 0-1 float or 0-100 number and returns a rounded integer.
   */
  private static normalizeConfidence(raw?: number): number {
    if (typeof raw !== 'number' || Number.isNaN(raw)) return 0
    let v = raw
    // If AI returned a 0-1 value, scale up to 0-100
    if (v > 0 && v <= 1) v = v * 100
    // Clamp and round
    return Math.round(Math.max(0, Math.min(100, v)))
  }

  /**
   * Validate attribute value against field options
   */
  private static validateAttributeValue(value: string, field: AttributeField): string | null {
    if (!field.options || field.options.length === 0) {
      return value // Text field
    }

    // Exact match
    const exactMatch = field.options.find((opt) => opt.shortForm === value || opt.fullForm === value)
    if (exactMatch) return exactMatch.shortForm

    // Fuzzy match
    const fuzzyMatch = this.findBestMatch(value, field.options)
    if (fuzzyMatch.score > 0.8) return fuzzyMatch.option.shortForm

    return null // Invalid value
  }

  /**
   * Find best matching option using string similarity
   */
  private static findBestMatch(value: string, options: { shortForm: string; fullForm: string }[]): { option: { shortForm: string; fullForm: string }, score: number } {
  let bestMatch = { option: options[0] ?? { shortForm: '', fullForm: '' }, score: 0 }
    const normalizedValue = value.toLowerCase().replace(/[^a-z0-9]/g, '')

    for (const option of options) {
  const shortScore = this.calculateSimilarity(normalizedValue, option.shortForm.toLowerCase().replace(/[^a-z0-9]/g, ''))
  const fullScore = this.calculateSimilarity(normalizedValue, option.fullForm.toLowerCase().replace(/[^a-z0-9]/g, ''))

      const maxScore = Math.max(shortScore, fullScore)
      if (maxScore > bestMatch.score) {
        bestMatch = { option, score: maxScore }
      }
    }

    return bestMatch
  }

  /**
   * Calculate string similarity using Jaccard index
   */
  private static calculateSimilarity(str1: string, str2: string): number {
    if (str1 === str2) return 1.0
    if (str1.includes(str2) || str2.includes(str1)) return 0.9

    const set1 = new Set(str1.split(''))
    const set2 = new Set(str2.split(''))
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return union.size > 0 ? intersection.size / union.size : 0
  }

  /**
   * Generate image hash for caching
   */
  private static generateImageHash(buffer: Buffer): string {
    return crypto.createHash('md5').update(buffer).digest('hex').substring(0, 16)
  }

  /**
   * Cache result with Redis or memory
   */
  private static async cacheResult(key: string, result: ExtractionResult, ttl: number): Promise<void> {
    try {
      if (redis && redis.status === 'ready') {
        await redis.setex(key, ttl, JSON.stringify(result))
      } else {
        // Fallback to memory cache
        this.resultCache.set(key, { result, expiry: Date.now() + (ttl * 1000) })

        // Memory cleanup
        if (this.resultCache.size > this.MAX_CACHE_SIZE) {
          this.cleanupResultCache()
        }
      }
    } catch (error) {
      console.warn('Cache write failed:', error)
    }
  }

  /**
   * Get cached result
   */
  private static async getCachedResult(key: string): Promise<ExtractionResult | null> {
    try {
      if (redis && redis.status === 'ready') {
        const cached = await redis.get(key)
        return cached ? JSON.parse(cached) : null
      } else {
        // Check memory cache
        const cached = this.resultCache.get(key)
        if (cached && cached.expiry > Date.now()) {
          return cached.result
        } else if (cached) {
          this.resultCache.delete(key) // Expired
        }
      }
    } catch (error) {
      console.warn('Cache read failed:', error)
    }
    return null
  }

  /**
   * Memory management - cleanup old prompt cache entries
   */
  private static cleanupPromptCache(): void {
    if (this.promptCache.size <= this.CLEANUP_THRESHOLD) return

    const entries = Array.from(this.promptCache.entries())
    const toDelete = entries.slice(0, this.promptCache.size - this.CLEANUP_THRESHOLD)
    
    toDelete.forEach(([key]) => this.promptCache.delete(key))
    console.log(`🧹 Cleaned up ${toDelete.length} prompt cache entries`)
  }

  /**
   * Memory management - cleanup old result cache entries
   */
  private static cleanupResultCache(): void {
    const now = Date.now()
    
    for (const [key, cached] of this.resultCache.entries()) {
      if (cached.expiry <= now) {
        this.resultCache.delete(key)
      }
    }

    // If still too large, remove oldest entries
    if (this.resultCache.size > this.CLEANUP_THRESHOLD) {
      const entries = Array.from(this.resultCache.entries())
      const toDelete = entries.slice(0, this.resultCache.size - this.CLEANUP_THRESHOLD)
      toDelete.forEach(([key]) => this.resultCache.delete(key))
    }

    console.log(`🧹 Result cache size after cleanup: ${this.resultCache.size}`)
  }

  /**
   * Perform comprehensive memory cleanup
   */
  private static performMemoryCleanup(): void {
    if (this.requestCount > 0 && this.requestCount % 50 === 0) { // Every 50 requests
      this.cleanupPromptCache()
      this.cleanupResultCache()

      // Do not force GC in Node.js; log potential GC availability
      const maybeGc = (globalThis as unknown as { gc?: () => void }).gc
      if (typeof maybeGc === 'function') {
        console.debug('GC is available in environment, not invoked to avoid side-effects')
      }
    }
  }

  /**
   * Update usage statistics
   */
  private static updateUsageStats(usage: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number } | undefined): void {
    if (!usage) return
    this.tokenUsage.total += usage.total_tokens ?? 0
    this.tokenUsage.prompt += usage.prompt_tokens ?? 0
    this.tokenUsage.completion += usage.completion_tokens ?? 0
  }

  /**
   * Get service statistics
   */
  static getStats() {
    return {
      requestCount: this.requestCount,
      tokenUsage: this.tokenUsage,
      cacheStats: {
        prompts: this.promptCache.size,
        results: this.resultCache.size
      },
      memoryUsage: process.memoryUsage()
    }
  }

  /**
   * Clear all caches
   */
  static async clearAllCaches(): Promise<void> {
    this.promptCache.clear()
    this.resultCache.clear()
    
    if (redis) {
      try {
        await redis.flushdb()
      } catch (error) {
        console.warn('Redis cache clear failed:', error)
      }
    }
    
    console.log('🧹 All caches cleared')
  }

  /**
   * Health check
   */
  static async healthCheck(): Promise<{ status: string; details: Record<string, unknown> }> {
    const checks = {
      openai: false,
      redis: false,
      memory: false
    }

    try {
      // Check OpenAI
      if (openai) {
        checks.openai = true
      }

      // Check Redis
      if (redis && redis.status === 'ready') {
          checks.redis = true
        }

      // Check memory
      const memUsage = process.memoryUsage()
      checks.memory = memUsage.heapUsed < memUsage.heapTotal * 0.9

      const allHealthy = Object.values(checks).every(Boolean)
      
      return {
        status: allHealthy ? 'healthy' : 'degraded',
        details: {
          checks,
          stats: this.getStats(),
          timestamp: new Date().toISOString()
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }
}

// Export singleton instance
export const aiService = AIService
