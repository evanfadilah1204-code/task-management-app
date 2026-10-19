import mongoose, { Schema, Document } from 'mongoose';

export interface IHabit extends Document {
  userId: string;
  name: string;
  frequency: 'daily' | 'weekly';
  streak: number;
  checkedInToday: boolean;
  createdAt: Date;
}

const HabitSchema: Schema = new Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  frequency: { type: String, enum: ['daily', 'weekly'], default: 'daily' },
  streak: { type: Number, default: 0 },
  checkedInToday: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IHabit>('Habit', HabitSchema, 'habits');
