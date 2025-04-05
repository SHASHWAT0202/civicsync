import mongoose, { Schema } from 'mongoose';

const BadgeSchema = new Schema({
  type: {
    type: String,
    enum: ['first-complaint', 'five-resolved', 'resolution-hero'],
    required: true
  },
  awardedAt: {
    type: Date,
    default: Date.now
  }
});

const UserSchema = new Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  badges: {
    type: [BadgeSchema],
    default: []
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', UserSchema); 