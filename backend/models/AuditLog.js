const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true }, // e.g. 'BOOKING_CREATED', 'BOOKING_APPROVED'
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetModel: { type: String, enum: ['Booking', 'Event', 'Resource', 'User'] },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  details: { type: mongoose.Schema.Types.Mixed }, // extra context
  ipAddress: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', auditLogSchema);
