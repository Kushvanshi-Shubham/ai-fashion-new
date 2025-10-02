import { Extraction, ExtractionStatus } from './fashion';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job<T, R> {
  id: string;
  status: JobStatus;
  data: T;
  result?: R;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ExtractionJobData = {
  imageBuffer: Buffer;
  imageType: string;
  category: import('./fashion').CategoryFormData;
  model: string;
};

export type ExtractionJobResult = {
  status: ExtractionStatus;
  extraction: Extraction | null;
  costUsd: number;
  tokensUsed: number;
};

export type ExtractionJob = Job<ExtractionJobData, ExtractionJobResult>;
