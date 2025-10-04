import { NextResponse } from 'next/server';
import { getJob } from '@/lib/queue/job-manager';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json({ success: false, error: 'Job ID is required' }, { status: 400 });
  }

  console.log(`[Status API] Looking for job: ${jobId}`);
  const job = getJob(jobId);
  console.log(`[Status API] Job found:`, job ? `Status: ${job.status}` : 'Not found');

  if (!job) {
    return NextResponse.json({ 
      success: false, 
      error: 'Job not found', 
      jobId,
      debug: 'Job may have been processed quickly or failed due to missing environment variables (OPENAI_API_KEY, DATABASE_URL)',
      help: 'Check server logs for processing details, or verify environment configuration'
    }, { status: 404 });
  }

  // Do not send sensitive data back to the client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, ...jobStatus } = job;

  return NextResponse.json({
    success: true,
    data: jobStatus,
  });
}
