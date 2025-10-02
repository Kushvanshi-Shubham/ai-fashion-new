import { NextResponse } from 'next/server'
import { prisma } from '@/lib/database'

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      success: false,
      error: 'Analytics unavailable (no DATABASE_URL)',
      code: 'ANALYTICS_DISABLED'
    }, { status: 503 })
  }

  try {
    const now = new Date()
  // const dayStart = startOfDay(now) // reserved for future daily stat upserts
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const [totals, byCategory, costAgg] = await Promise.all([
      prisma.extractionEvent.aggregate({
        _count: { _all: true },
        _avg: { processingTime: true, tokensUsed: true },
      }),
      prisma.extractionEvent.groupBy({
        by: ['categoryCode'],
        _count: { categoryCode: true },
        _avg: { processingTime: true, tokensUsed: true },
        orderBy: { categoryCode: 'asc' },
        take: 50
      }),
      prisma.extractionEvent.aggregate({ _sum: { costUsd: true } })
    ])

    const successCount = await prisma.extractionEvent.count({ where: { status: 'COMPLETED' } })
    const failedCount = await prisma.extractionEvent.count({ where: { status: 'FAILED' } })
    const cachedCount = await prisma.extractionEvent.count({ where: { status: 'CACHED' } })

    // Build 24h timeline (hour buckets)
    const hours: { hour: string; total: number; completed: number; failed: number }[] = []
    for (let i = 23; i >= 0; i--) {
      const bucketStart = new Date(now.getTime() - i * 3600 * 1000)
      const hourLabel = bucketStart.toISOString().slice(11, 13)
      hours.push({ hour: hourLabel, total: 0, completed: 0, failed: 0 })
    }
    // (Removed incorrect attempt to bucket with processingTime)
    // Re-query with createdAt for timeline
    const last24hTimeline = await prisma.extractionEvent.findMany({
      where: { createdAt: { gte: dayAgo } },
      select: { createdAt: true, status: true }
    })
    last24hTimeline.forEach(evt => {
      const diffMs = now.getTime() - evt.createdAt.getTime()
      const bucketIndex = 23 - Math.floor(diffMs / 3600000)
      if (bucketIndex < 0 || bucketIndex >= hours.length) return
      const b = hours[bucketIndex]!
      b.total += 1
      if (evt.status === 'COMPLETED') b.completed += 1
      else if (evt.status === 'FAILED') b.failed += 1
    })

    const avgProcessing = totals._avg.processingTime || 0
    const avgTokens = totals._avg.tokensUsed || 0
    const totalEvents = totals._count._all
    const successRate = totalEvents ? successCount / totalEvents : 0
    interface CostAgg { _sum?: { costUsd?: number } }
    function extractCost(v: unknown): number {
      if (!v || typeof v !== 'object') return 0
      const ca = v as CostAgg
      if (ca._sum && typeof ca._sum.costUsd === 'number') return ca._sum.costUsd
      return 0
    }
    const totalCostUsd = extractCost(costAgg)
  const avgCostUsd = totalEvents ? totalCostUsd / totalEvents : 0

    return NextResponse.json({
      success: true,
      data: {
        totals: {
          totalEvents,
          successCount,
            failedCount,
            cachedCount,
          successRate,
          avgProcessingTimeMs: Math.round(avgProcessing),
          avgTokens: Math.round(avgTokens),
          totalCostUsd: Number(totalCostUsd.toFixed(4)),
          avgCostUsd: Number(avgCostUsd.toFixed(6))
        },
        categoryTop: byCategory.map(c => {
          type CatGroup = typeof byCategory[number]
          const count = (c as CatGroup & { _count: { categoryCode?: number } })._count.categoryCode || 0
          const avgProc = (c as CatGroup & { _avg: { processingTime?: number } })._avg.processingTime || 0
          const avgTok = (c as CatGroup & { _avg: { tokensUsed?: number } })._avg.tokensUsed || 0
          return {
            categoryCode: c.categoryCode,
            count,
            avgProcessingMs: Math.round(avgProc),
            avgTokens: Math.round(avgTok)
          }
        }),
        hours
      }
    })
  } catch (error) {
    console.error('[analytics] summary error', error)
    return NextResponse.json({ success: false, error: 'ANALYTICS_ERROR' }, { status: 500 })
  }
}
