import mongoose, { Schema } from 'mongoose';

const LocationSchema = new Schema({
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  address: {
    type: String
  }
});

const ComplaintSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['potholes', 'road-breaks', 'sewer-issues', 'water-supply', 'electricity', 'garbage', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'rejected'],
    default: 'pending'
  },
  location: {
    type: LocationSchema,
    required: true
  },
  images: {
    type: [String],
    default: []
  },
  votes: {
    type: Number,
    default: 0
  },
  isFake: {
    type: Boolean,
    default: false
  },
  isVisible: {
    type: Boolean,
    default: true
  },
  userId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema); 