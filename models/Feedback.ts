import mongoose, { Schema } from 'mongoose';

const FeedbackSchema = new Schema({
  complaintId: {
    type: Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String
  }
}, {
  timestamps: true
});

// Ensure a user can only provide feedback once per complaint
FeedbackSchema.index({ complaintId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Feedback || mongoose.model('Feedback', FeedbackSchema); 