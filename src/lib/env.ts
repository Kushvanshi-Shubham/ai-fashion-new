import { z } from 'zod'

// Environment variables validation schema
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  DIRECT_URL: z.string().url('Invalid DIRECT_URL').optional(),
  
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  
  // Next.js
  NEXT_PUBLIC_APP_URL: z.string().url('Invalid NEXT_PUBLIC_APP_URL').optional(),
  
  // Redis (optional)
  REDIS_URL: z.string().optional(),
  
  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export type Env = z.infer<typeof envSchema>

// Validate environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('\n')
      throw new Error(`Environment validation failed:\n${issues}`)
    }
    throw error
  }
}

// Export validated environment
export const env = validateEnv()

// Runtime environment checks
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'
