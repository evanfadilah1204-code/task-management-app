import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  userId: string;
  amount: number;
  category: string;
  notes: string;
  date: string;
  createdAt: Date;
}

const ExpenseSchema: Schema = new Schema({
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, default: 'Makanan' },
  notes: { type: String, default: '' },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IExpense>('Expense', ExpenseSchema, 'expenses');
