
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  lastLogin: {
    ip: String,
    location: String,
    device: String,
    timestamp: String,
    
  },
  resetPasswordToken: {type: String},
  resetPasswordExpires: {type: Date},
}, { timestamps: true });

export default mongoose.model('User', userSchema);
