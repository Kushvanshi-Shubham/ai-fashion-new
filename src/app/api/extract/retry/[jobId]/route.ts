import { NextResponse } from 'next/server';
import { getJob } from '@/lib/queue/job-manager';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ 
      success: false, 
      error: 'Job ID is required' 
    }, { status: 400 });
  }

  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ 
      success: false, 
      error: 'Job not found' 
    }, { status: 404 });
  }

  // For now, just reset the job to pending status
  // In a real implementation, you would trigger re-extraction
  job.status = 'pending';
  job.updatedAt = new Date();
  delete job.error;
  delete job.result;

  return NextResponse.json({
    success: true,
    message: 'Job retry initiated',
    data: {
      jobId: job.id,
      status: job.status,
      timestamp: new Date().toISOString()
    }
  });
}