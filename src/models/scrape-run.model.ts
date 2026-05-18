import { Schema, model } from 'mongoose';

export interface IScrapeRun {
  runId: string;
  startTime: Date;
  endTime: Date;
  status: 'success' | 'failed';
  itemsFetched: number;
  itemsProcessed: number;
  error?: string;
  createdAt: Date;
}

const scrapeRunSchema = new Schema<IScrapeRun>({
  runId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['success', 'failed'],
  },
  itemsFetched: {
    type: Number,
    required: true,
  },
  itemsProcessed: {
    type: Number,
    required: true,
  },
  error: {
    type: String,
  },
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
    expires: 7776000, // TTL index: automatically deletes after 90 days (90 * 24 * 60 * 60 seconds)
  },
});

export const ScrapeRun = model<IScrapeRun>('ScrapeRun', scrapeRunSchema, 'scrape_runs');
export default ScrapeRun;
