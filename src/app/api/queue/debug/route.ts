import { NextResponse } from 'next/server';
import { getQueueStatus } from '@/lib/queue/job-manager';

export async function GET() {
  const queueStatus = getQueueStatus();
  
  return NextResponse.json({
    success: true,
    data: {
      ...queueStatus,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    },
    timestamp: new Date().toISOString()
  });
}