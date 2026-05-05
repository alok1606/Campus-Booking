const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['hall', 'lab', 'classroom', 'equipment', 'auditorium', 'ground'],
    required: true
  },
  description: { type: String },
  capacity: { type: Number, required: true },
  location: { type: String, required: true },
  amenities: [{ type: String }],
  isAvailable: { type: Boolean, default: true },
  maintenanceNote: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

resourceSchema.index({ name: 'text', location: 'text' });

module.exports = mongoose.model('Resource', resourceSchema);
