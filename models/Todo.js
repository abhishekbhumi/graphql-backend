
import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  title: { type: String, trim: true },
  age: { type: Number, min: 18 },
  bio: { type: String, trim: true },
  company: { type: String, trim: true },
  experience: { type: Number, min: 0 },
  description: { type: String, trim: true },
  address: { type: String, required: true, trim: true, default: '' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export default mongoose.model('Todo', todoSchema);
