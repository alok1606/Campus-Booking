const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  resource: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  purpose: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  attendees: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  notes: { type: String },
}, { timestamps: true });

// Compound index for conflict detection
bookingSchema.index({ resource: 1, startTime: 1, endTime: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
