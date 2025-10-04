import { NextResponse } from 'next/server';
import { getQueueStatus } from '@/lib/queue/job-manager';

export async function GET() {
  try {
    const queueStatus = getQueueStatus();
    
    return NextResponse.json({
      success: true,
      data: queueStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Queue Status API] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get queue status',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}