import { Schema, model } from 'mongoose';

export interface ITechnicalPiece {
  hnId: number;
  title: string;
  url?: string;
  by: string;
  score: number;
  time: Date;
  summary?: string;
}

const technicalPieceSchema = new Schema<ITechnicalPiece>(
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

export const TechnicalPiece = model<ITechnicalPiece>('TechnicalPiece', technicalPieceSchema, 'technical_pieces');
export default TechnicalPiece;
