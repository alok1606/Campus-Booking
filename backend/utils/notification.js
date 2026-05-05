const Notification = require('../models/Notification');

const createNotification = async ({ recipient, sender, type, title, message, relatedBooking, relatedEvent }) => {
  try {
    await Notification.create({ recipient, sender, type, title, message, relatedBooking, relatedEvent });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

module.exports = { createNotification };
