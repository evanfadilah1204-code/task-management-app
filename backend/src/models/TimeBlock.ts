import mongoose, { Schema, Document } from 'mongoose';

export interface ITimeBlock extends Document {
  userId: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  isCompleted: boolean;
  createdAt: Date;
}

const TimeBlockSchema: Schema = new Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  category: { type: String, default: 'Umum' },
  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ITimeBlock>('TimeBlock', TimeBlockSchema, 'timeblocks');
