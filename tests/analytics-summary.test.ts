import { describe, it, expect, vi, beforeAll } from 'vitest'

// We will import the handler dynamically to ensure prisma mock is in place first

// Minimal prisma mock
vi.mock('@/lib/database', () => {
  return {
    prisma: {
      extractionEvent: {
        aggregate: vi.fn().mockResolvedValue({ _count: { _all: 10 }, _avg: { processingTime: 500, tokensUsed: 450 } }),
        groupBy: vi.fn().mockResolvedValue([
          { categoryCode: 'CAT_A', _count: { categoryCode: 6 }, _avg: { processingTime: 400, tokensUsed: 420 } },
          { categoryCode: 'CAT_B', _count: { categoryCode: 4 }, _avg: { processingTime: 600, tokensUsed: 480 } }
        ]),
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockImplementation(({ where }) => {
          if (where?.status === 'COMPLETED') return Promise.resolve(8)
          if (where?.status === 'FAILED') return Promise.resolve(2)
          if (where?.status === 'CACHED') return Promise.resolve(1)
          return Promise.resolve(0)
        })
      }
    }
  }
})

// Mock env
beforeAll(() => {
  process.env.DATABASE_URL = 'postgres://example'
})

describe('analytics summary route', () => {
  it('returns aggregated structure', async () => {
    const route = await import('@/app/api/analytics/summary/route')
    const res = await route.GET()
    const json = await (res as Response).json()
    expect(json.success).toBe(true)
    expect(json.data.totals.totalEvents).toBe(10)
    expect(json.data.totals.successCount).toBe(8)
    expect(json.data.categoryTop.length).toBe(2)
  })
})
