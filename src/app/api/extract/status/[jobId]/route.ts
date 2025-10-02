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

  const job = getJob(jobId);

  if (!job) {
    return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
  }

  // Do not send sensitive data back to the client
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, ...jobStatus } = job;

  return NextResponse.json({
    success: true,
    data: jobStatus,
  });
}
