import mongoose, { Schema, Document } from 'mongoose';

export interface ITodo extends Document {
  userId: mongoose.Types.ObjectId;
  taskName: string;
  subject: string;
  deadline: Date;
  isCompleted: boolean;
}

const TodoSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  taskName: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  deadline: {
    type: Date,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default mongoose.model<ITodo>('Todo', TodoSchema);