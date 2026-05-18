import { Schema, model } from 'mongoose';

export interface IJob {
  hnId: number;
  company: string;
  role: string;
  location: string;
  remote: boolean;
  salary?: string;
  techStack: string[];
  status: 'active' | 'inactive';
  rawText: string;
}

const jobSchema = new Schema<IJob>(
  {
    hnId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    company: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    remote: {
      type: Boolean,
      default: false,
    },
    salary: {
      type: String,
    },
    techStack: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      required: true,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    rawText: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Job = model<IJob>('Job', jobSchema, 'jobs');
export default Job;
