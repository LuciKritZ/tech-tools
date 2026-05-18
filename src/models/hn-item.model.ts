import { Schema, model } from 'mongoose';

export interface IHnItem {
  hnId: number;
  type: 'story' | 'comment' | 'job' | 'poll' | 'pollopt';
  by: string;
  time: Date;
  title?: string;
  text?: string;
  url?: string;
  score?: number;
  descendants?: number;
  kids?: number[];
  deleted?: boolean;
  dead?: boolean;
  parent?: number;
  poll?: number;
  parts?: number[];
}

const hnItemSchema = new Schema<IHnItem>(
  {
    hnId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['story', 'comment', 'job', 'poll', 'pollopt'],
    },
    by: {
      type: String,
      required: true,
    },
    time: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
    },
    text: {
      type: String,
    },
    url: {
      type: String,
    },
    score: {
      type: Number,
    },
    descendants: {
      type: Number,
    },
    kids: {
      type: [Number],
      default: [],
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    dead: {
      type: Boolean,
      default: false,
    },
    parent: {
      type: Number,
    },
    poll: {
      type: Number,
    },
    parts: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const HnItem = model<IHnItem>('HnItem', hnItemSchema, 'hn_items');
export default HnItem;
