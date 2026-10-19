import { Schema, model } from 'mongoose';

// Skema untuk menentukan kolom apa saja yang akan disimpan di MongoDB Atlas
const userSchema = new Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true // Username tidak boleh kembar
  },
  email: { 
    type: String, 
    required: true, 
    unique: true // Email tidak boleh kembar
  },
  password: { 
    type: String, 
    required: true 
  },
  telegramChatId: {
    type: String,
    default: ''
  },
  telegramNotificationsEnabled: {
    type: Boolean,
    default: true
  },
  telegramMorningDigestTime: {
    type: String,
    default: '07:00'
  }
}, { 
  timestamps: true // Otomatis membuat kolom createdAt dan updatedAt
});

export default model('User', userSchema);