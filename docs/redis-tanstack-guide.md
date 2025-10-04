# Redis & Tanstack Query Integration Guide

## Current Setup Status ✅

Your project already has both Redis and Tanstack Query properly set up! Here's what's working:

### 1. Tanstack Query (React Query) ✅
- **Installed**: `@tanstack/react-query` v5.90.2
- **Dev Tools**: `@tanstack/react-query-devtools` v5.90.2
- **Provider**: Already configured in `src/app/providers.tsx`
- **Usage**: Already being used in `src/app/analytics/page.tsx`

### 2. Redis ✅
- **Installed**: `ioredis` v5.8.0
- **Rate Limiting**: Already implemented in `src/lib/rate-limit.ts`
- **Queue System**: Basic job manager implemented
- **Fallback**: Smart fallback to in-memory when Redis is unavailable

## How to Enable Redis

### 1. Environment Variables

Add to your `.env.local` file:

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379
# Or for Redis Cloud/Heroku/other hosted Redis:
# REDIS_URL=redis://username:password@hostname:port

# Optional: Disable Redis in development
# REDIS_DISABLED=true
```

### 2. Local Redis Setup

**Option A: Docker (Recommended)**
```bash
# Start Redis with Docker
docker run --name ai-fashion-redis -p 6379:6379 -d redis:7-alpine

# With persistence
docker run --name ai-fashion-redis -p 6379:6379 -v redis-data:/data -d redis:7-alpine redis-server --appendonly yes
```

**Option B: Install Locally**
```bash
# Windows (with Chocolatey)
choco install redis-64

# Windows (with Scoop)
scoop install redis

# macOS (with Homebrew)
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
```

### 3. Cloud Redis Options

**Redis Cloud (Free Tier Available)**
1. Sign up at [redis.com](https://redis.com)
2. Create a free database
3. Copy the connection string to `REDIS_URL`

**Other Options:**
- **Upstash Redis** (Serverless, free tier)
- **AWS ElastiCache** 
- **Heroku Redis** add-on
- **Railway** Redis service

## Enhanced Workflow Implementation

I've already fixed your workflow! Here's what's now working:

### 1. ✅ Navigation Flow
- **Category Selection** → **Attribute Review** (with Next button) → **Image Upload** → **Extraction** → **Results**

### 2. ✅ Image Upload & Display
- Images now properly display after upload
- Progress tracking for each image
- Remove individual images functionality

### 3. ✅ Extraction Controls
- "Start AI Extraction" button appears after upload
- Progress bar shows overall completion
- "View Results" button after extraction completes

## Advanced Features You Can Add

### 1. Real-time Updates with React Query

```typescript
// hooks/useExtractionStatus.ts
import { useQuery } from '@tanstack/react-query'

export const useExtractionStatus = (jobId: string) => {
  return useQuery({
    queryKey: ['extraction', jobId],
    queryFn: () => fetch(`/api/jobs/${jobId}`).then(res => res.json()),
    refetchInterval: 1000, // Poll every second
    enabled: !!jobId
  })
}
```

### 2. Enhanced Job Queue with Redis

```typescript
// lib/queue/redis-queue.ts
import { Redis } from 'ioredis'

export class RedisQueue {
  private redis: Redis

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!)
  }

  async addJob(jobData: any) {
    const jobId = uuidv4()
    await this.redis.lpush('job:queue', JSON.stringify({ id: jobId, ...jobData }))
    await this.redis.hset(`job:${jobId}`, {
      status: 'pending',
      createdAt: Date.now(),
      data: JSON.stringify(jobData)
    })
    return jobId
  }

  async getJob(jobId: string) {
    const job = await this.redis.hmget(`job:${jobId}`, 'status', 'result', 'error', 'progress')
    return {
      id: jobId,
      status: job[0],
      result: job[1] ? JSON.parse(job[1]) : null,
      error: job[2],
      progress: parseInt(job[3] || '0')
    }
  }
}
```

### 3. Caching Strategy

```typescript
// hooks/useCachedCategories.ts
import { useQuery } from '@tanstack/react-query'

export const useCachedCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json()),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
  })
}
```

## Performance Benefits

### With Redis:
- ✅ **Persistent job queue** (survives server restarts)
- ✅ **Distributed processing** (multiple server instances)
- ✅ **Rate limiting** (already implemented)
- ✅ **Session storage** for multi-step workflows
- ✅ **Caching** for expensive operations

### With Tanstack Query:
- ✅ **Automatic caching** (already working)
- ✅ **Background refetching** (keeps data fresh)
- ✅ **Optimistic updates** (instant UI feedback)
- ✅ **Error handling & retries** (robust error recovery)
- ✅ **Dev tools** (debugging & monitoring)

## Current Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Next.js API   │    │     Redis       │
│                 │    │                 │    │                 │
│ React Query ────┼────┼─ Rate Limiting  │    │  Job Queue      │
│ Category Flow   │    │  Job Management │    │  Cache          │
│ Image Upload    │    │  AI Extraction  │    │  Sessions       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐             │
         └──────────────┼   Database      │─────────────┘
                        │   (Prisma)      │
                        │                 │
                        └─────────────────┘
```

## Testing Your Setup

### 1. Test Redis Connection
```typescript
// Check if Redis is working
const testRedis = async () => {
  try {
    const response = await fetch('/api/health')
    const data = await response.json()
    console.log('Redis status:', data.redis)
  } catch (error) {
    console.log('Redis test failed:', error)
  }
}
```

### 2. Test React Query
- Open Chrome DevTools
- Check for "Tanstack Query" tab
- Should see active queries and cache status

## Next Steps

1. **Start Redis** (Docker or local installation)
2. **Add REDIS_URL** to your environment
3. **Test the workflow** - it should all work now!
4. **Monitor with dev tools** - React Query devtools show cache status

The architecture is already production-ready with proper fallbacks. Redis will enhance performance but isn't required for basic functionality.

## Troubleshooting

### Redis Issues
- Check `REDIS_URL` environment variable
- Verify Redis is running: `redis-cli ping` (should return "PONG")
- Check logs for Redis connection errors
- Fallback to memory works automatically if Redis fails

### React Query Issues  
- Enable React Query DevTools in development
- Check network tab for API calls
- Verify `providers.tsx` is wrapping your app
- Check query keys for uniqueness

Your setup is already excellent! 🚀