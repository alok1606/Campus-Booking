const { validationResult } = require('express-validator');
const Booking = require('../models/Booking');
const Resource = require('../models/Resource');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLog');
const { createNotification } = require('../utils/notification');

// ─── Conflict Detection ────────────────────────────────────────────────────────
const checkConflict = async (resourceId, startTime, endTime, excludeId = null) => {
  const query = {
    resource: resourceId,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
    ]
  };
  if (excludeId) query._id = { $ne: excludeId };
  return await Booking.findOne(query);
};

// ─── Suggest Next Available Slot ───────────────────────────────────────────────
const suggestNextSlot = async (resourceId, startTime, endTime) => {
  const duration = new Date(endTime) - new Date(startTime);
  // Look for the next 7 days, in 30-min increments
  let candidate = new Date(endTime);
  candidate.setMinutes(Math.ceil(candidate.getMinutes() / 30) * 30, 0, 0);

  for (let i = 0; i < 336; i++) { // up to 7 days * 48 slots
    const candidateEnd = new Date(candidate.getTime() + duration);
    const conflict = await checkConflict(resourceId, candidate, candidateEnd);
    if (!conflict) {
      return { suggestedStart: candidate, suggestedEnd: candidateEnd };
    }
    candidate = new Date(candidate.getTime() + 30 * 60 * 1000);
  }
  return null;
};

// @desc  Get all bookings (role-filtered)
// @route GET /api/bookings
const getBookings = async (req, res) => {
  try {
    const { status, resource, page = 1, limit = 10, startDate, endDate } = req.query;
    const query = {};

    // Students see only their own bookings
    if (req.user.role === 'student') query.requestedBy = req.user._id;
    if (status) query.status = status;
    if (resource) query.resource = resource;
    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('resource', 'name type location')
      .populate('requestedBy', 'name email role')
      .populate('approvedBy', 'name')
      .populate('event', 'title')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single booking
// @route GET /api/bookings/:id
const getBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('resource', 'name type location capacity')
      .populate('requestedBy', 'name email department')
      .populate('approvedBy', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const isOwner = booking.requestedBy._id.toString() === req.user._id.toString();
    if (!isOwner && req.user.role === 'student') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create booking with conflict detection
// @route POST /api/bookings
const createBooking = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { resource: resourceId, startTime, endTime, title, purpose, attendees, notes, event } = req.body;
  try {
    const resource = await Resource.findById(resourceId);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    if (!resource.isAvailable) return res.status(400).json({ success: false, message: 'Resource is not available for booking' });

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) return res.status(400).json({ success: false, message: 'End time must be after start time' });
    if (start < new Date()) return res.status(400).json({ success: false, message: 'Cannot book in the past' });

    // ── Conflict detection ──
    const conflict = await checkConflict(resourceId, start, end);
    if (conflict) {
      const suggestion = await suggestNextSlot(resourceId, start, end);
      return res.status(409).json({
        success: false,
        message: 'Time slot conflict: this resource is already booked for the selected time.',
        conflict: {
          existingBooking: { start: conflict.startTime, end: conflict.endTime, title: conflict.title }
        },
        suggestion
      });
    }

    const booking = await Booking.create({
      resource: resourceId, requestedBy: req.user._id,
      title, purpose, startTime: start, endTime: end,
      attendees, notes, event
    });

    // Notify faculty/admins for approval
    const approvers = await User.find({ role: { $in: ['faculty', 'admin'] } }).select('_id');
    await Promise.all(approvers.map(a =>
      createNotification({
        recipient: a._id, sender: req.user._id,
        type: 'booking_pending',
        title: 'New Booking Request',
        message: `${req.user.name} requested "${resource.name}" from ${start.toLocaleString()} to ${end.toLocaleString()}`,
        relatedBooking: booking._id
      })
    ));

    await createAuditLog({ action: 'BOOKING_CREATED', performedBy: req.user._id, targetModel: 'Booking', targetId: booking._id, ipAddress: req.ip });
    const populated = await booking.populate(['resource', 'requestedBy']);
    res.status(201).json({ success: true, booking: populated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Approve booking
// @route PATCH /api/bookings/:id/approve
const approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('requestedBy', 'name _id').populate('resource', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending bookings can be approved' });

    // Re-check conflict at approval time
    const conflict = await checkConflict(booking.resource._id, booking.startTime, booking.endTime, booking._id);
    if (conflict) {
      return res.status(409).json({ success: false, message: 'A conflicting booking was approved earlier. Cannot approve.' });
    }

    booking.status = 'approved';
    booking.approvedBy = req.user._id;
    booking.approvedAt = new Date();
    await booking.save();

    await createNotification({
      recipient: booking.requestedBy._id, sender: req.user._id,
      type: 'booking_approved', title: 'Booking Approved',
      message: `Your booking for "${booking.resource.name}" has been approved.`,
      relatedBooking: booking._id
    });
    await createAuditLog({ action: 'BOOKING_APPROVED', performedBy: req.user._id, targetModel: 'Booking', targetId: booking._id });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Reject booking
// @route PATCH /api/bookings/:id/reject
const rejectBooking = async (req, res) => {
  const { rejectionReason } = req.body;
  if (!rejectionReason) return res.status(400).json({ success: false, message: 'Rejection reason is required' });

  try {
    const booking = await Booking.findById(req.params.id).populate('requestedBy', 'name _id').populate('resource', 'name');
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.status !== 'pending') return res.status(400).json({ success: false, message: 'Only pending bookings can be rejected' });

    booking.status = 'rejected';
    booking.rejectionReason = rejectionReason;
    booking.approvedBy = req.user._id;
    booking.approvedAt = new Date();
    await booking.save();

    await createNotification({
      recipient: booking.requestedBy._id, sender: req.user._id,
      type: 'booking_rejected', title: 'Booking Rejected',
      message: `Your booking for "${booking.resource.name}" was rejected. Reason: ${rejectionReason}`,
      relatedBooking: booking._id
    });
    await createAuditLog({ action: 'BOOKING_REJECTED', performedBy: req.user._id, targetModel: 'Booking', targetId: booking._id, details: { rejectionReason } });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Cancel booking (owner only)
// @route PATCH /api/bookings/:id/cancel
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.requestedBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!['pending', 'approved'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel booking in current status' });
    }

    booking.status = 'cancelled';
    await booking.save();
    await createAuditLog({ action: 'BOOKING_CANCELLED', performedBy: req.user._id, targetModel: 'Booking', targetId: booking._id });
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Export bookings as CSV
// @route GET /api/bookings/export
const exportBookings = async (req, res) => {
  try {
    const bookings = await Booking.find(req.user.role === 'student' ? { requestedBy: req.user._id } : {})
      .populate('resource', 'name type')
      .populate('requestedBy', 'name email')
      .lean();

    const rows = bookings.map(b => ({
      Title: b.title,
      Resource: b.resource?.name,
      ResourceType: b.resource?.type,
      RequestedBy: b.requestedBy?.name,
      Email: b.requestedBy?.email,
      StartTime: new Date(b.startTime).toISOString(),
      EndTime: new Date(b.endTime).toISOString(),
      Status: b.status,
      Purpose: b.purpose,
      CreatedAt: new Date(b.createdAt).toISOString()
    }));

    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(','), ...rows.map(r => headers.map(h => `"${r[h] || ''}"`).join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=bookings.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getBookings, getBooking, createBooking, approveBooking, rejectBooking, cancelBooking, exportBookings };
