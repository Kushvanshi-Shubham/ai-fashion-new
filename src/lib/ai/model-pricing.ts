// Centralized model pricing & selection
// Costs are illustrative; adjust to real OpenAI pricing if needed.

export interface ModelPricing {
  model: string
  inputPer1K: number // USD per 1K input tokens
  outputPer1K: number // USD per 1K output tokens
  visionMultiplier?: number // factor for image features (simplified)
}

const PRICING: Record<string, ModelPricing> = {
  'gpt-4-vision-preview': { model: 'gpt-4-vision-preview', inputPer1K: 0.01, outputPer1K: 0.03, visionMultiplier: 1.2 },
  'gpt-4o-mini': { model: 'gpt-4o-mini', inputPer1K: 0.005, outputPer1K: 0.015 },
  'gpt-4o': { model: 'gpt-4o', inputPer1K: 0.01, outputPer1K: 0.03 },
}

export function resolveModel(): string {
  const envModel = process.env.AI_MODEL?.trim()
  if (envModel && PRICING[envModel]) return envModel
  return 'gpt-4-vision-preview'
}

export function estimateCost(params: {
  model: string
  inputTokens?: number
  outputTokens?: number
  totalTokens?: number // fallback if input/output split unavailable
  hasVision?: boolean
}): number {
  const { model, inputTokens = 0, outputTokens = 0, totalTokens, hasVision } = params
  const pricing = PRICING[model]
  if (!pricing) return 0
  if (totalTokens && (!inputTokens && !outputTokens)) {
    // assume 60/40 input/output split heuristic
    const assumedIn = totalTokens * 0.6
    const assumedOut = totalTokens * 0.4
    return ((assumedIn / 1000) * pricing.inputPer1K + (assumedOut / 1000) * pricing.outputPer1K)
  }
  let cost = (inputTokens / 1000) * pricing.inputPer1K + (outputTokens / 1000) * pricing.outputPer1K
  if (hasVision && pricing.visionMultiplier) cost *= pricing.visionMultiplier
  return Number(cost.toFixed(6))
}

export function modelPricingTable(): ModelPricing[] {
  return Object.values(PRICING)
}
