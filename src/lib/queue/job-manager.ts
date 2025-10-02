import { v4 as uuidv4 } from 'uuid';
import { ExtractionJob, JobStatus } from '@/types/job';
import { triggerWorker } from './worker';

const jobStore = new Map<string, ExtractionJob>();
const jobQueue: string[] = [];

export const addJob = (data: ExtractionJob['data']): ExtractionJob => {
  const job: ExtractionJob = {
    id: uuidv4(),
    status: 'pending',
    data,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  jobStore.set(job.id, job);
  jobQueue.push(job.id);
  console.log(`[JobManager] Job added: ${job.id}. Queue size: ${jobQueue.length}`);
  triggerWorker();
  return job;
};

export const getJob = (id: string): ExtractionJob | undefined => {
  return jobStore.get(id);
};

export const getNextJob = (): ExtractionJob | undefined => {
  const jobId = jobQueue.shift();
  if (!jobId) {
    return undefined;
  }
  const job = jobStore.get(jobId);
  if (job) {
    updateJobStatus(job.id, 'processing');
  }
  return job;
};

export const updateJobStatus = (id: string, status: JobStatus): ExtractionJob | undefined => {
  const job = jobStore.get(id);
  if (job) {
    job.status = status;
    job.updatedAt = new Date();
    jobStore.set(id, job);
    console.log(`[JobManager] Job updated: ${id}. Status: ${status}`);
  }
  return job;
};

export const completeJob = (id: string, result: ExtractionJob['result']): ExtractionJob | undefined => {
  const job = jobStore.get(id);
  if (job) {
    job.status = 'completed';
    if (result) {
      job.result = result;
    }
    job.updatedAt = new Date();
    jobStore.set(id, job);
    console.log(`[JobManager] Job completed: ${id}`);
  }
  return job;
};

export const failJob = (id: string, error: string): ExtractionJob | undefined => {
  const job = jobStore.get(id);
  if (job) {
    job.status = 'failed';
    job.error = error;
    job.updatedAt = new Date();
    jobStore.set(id, job);
     console.log(`[JobManager] Job failed: ${id}. Error: ${error}`);
  }
  return job;
};

export const getQueueStatus = () => {
  return {
    pendingJobs: jobQueue.length,
    processingJobs: Array.from(jobStore.values()).filter(j => j.status === 'processing').length,
    totalJobs: jobStore.size,
  };
};
