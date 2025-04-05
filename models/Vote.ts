import mongoose, { Schema } from 'mongoose';

const VoteSchema = new Schema({
  complaintId: {
    type: Schema.Types.ObjectId,
    ref: 'Complaint',
    required: true
  },
  userId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

// Ensure a user can only vote once per complaint
VoteSchema.index({ complaintId: 1, userId: 1 }, { unique: true });

export default mongoose.models.Vote || mongoose.model('Vote', VoteSchema); 