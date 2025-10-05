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
    // Check for common configuration issues
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasDatabase = !!process.env.DATABASE_URL;
    
    return NextResponse.json({ 
      success: false, 
      error: 'Job not found', 
      jobId,
      debug: {
        message: 'Job may have been processed quickly, failed, or expired (jobs are kept for 10 minutes)',
        environment: {
          openai: hasOpenAI ? 'configured' : 'missing OPENAI_API_KEY',
          database: hasDatabase ? 'configured' : 'missing DATABASE_URL'
        }
      },
      help: !hasOpenAI || !hasDatabase 
        ? 'Please configure your environment variables in .env.local file. See .env.example for template.' 
        : 'Check server logs for processing details. Jobs expire after 10 minutes.'
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
