import { Schema, model } from 'mongoose';

export interface IStartupNews {
  hnId: number;
  title: string;
  url?: string;
  by: string;
  score: number;
  time: Date;
  summary?: string;
}

const startupNewsSchema = new Schema<IStartupNews>(
  {
    hnId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
    },
    by: {
      type: String,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    time: {
      type: Date,
      required: true,
    },
    summary: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const StartupNews = model<IStartupNews>('StartupNews', startupNewsSchema, 'startup_news');
export default StartupNews;
