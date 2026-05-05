const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: {
    type: String,
    enum: ['booking_approved', 'booking_rejected', 'booking_pending', 'event_approved',
           'event_rejected', 'event_submitted', 'general'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  relatedBooking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  relatedEvent: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
