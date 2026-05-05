const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Booking = require('../models/Booking');
const Event = require('../models/Event');
const Resource = require('../models/Resource');

// @desc  Get dashboard stats
// @route GET /api/admin/stats
const getDashboardStats = async (req, res) => {
  try {
    const [users, bookings, events, resources, pendingBookings, pendingEvents] = await Promise.all([
      User.countDocuments(),
      Booking.countDocuments(),
      Event.countDocuments(),
      Resource.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Event.countDocuments({ status: { $in: ['submitted', 'under_review'] } })
    ]);
    res.json({ success: true, stats: { users, bookings, events, resources, pendingBookings, pendingEvents } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get all users
// @route GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Toggle user active status
// @route PATCH /api/admin/users/:id/toggle
const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get audit logs
// @route GET /api/admin/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, action } = req.query;
    const query = action ? { action } : {};
    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate('performedBy', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, total, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDashboardStats, getUsers, toggleUser, getAuditLogs };
