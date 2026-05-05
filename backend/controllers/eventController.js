const { validationResult } = require('express-validator');
const Event = require('../models/Event');
const { createAuditLog } = require('../utils/auditLog');
const { createNotification } = require('../utils/notification');

// @desc  Get all events (with filters)
// @route GET /api/events
const getEvents = async (req, res) => {
  try {
    const { search, category, status, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query = {};

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.startDate = {};
      if (startDate) query.startDate.$gte = new Date(startDate);
      if (endDate) query.startDate.$lte = new Date(endDate);
    }
    // Students/faculty see only approved or their own events
    if (req.user.role === 'student') {
      query.$or = [{ status: 'approved' }, { organizer: req.user._id }];
    }

    const total = await Event.countDocuments(query);
    const events = await Event.find(query)
      .populate('organizer', 'name email role')
      .populate('reviewedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single event
// @route GET /api/events/:id
const getEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email department')
      .populate('reviewedBy', 'name');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create event
// @route POST /api/events
const createEvent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const event = await Event.create({ ...req.body, organizer: req.user._id });
    await createAuditLog({ action: 'EVENT_CREATED', performedBy: req.user._id, targetModel: 'Event', targetId: event._id });
    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update event
// @route PUT /api/events/:id
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const isOwner = event.organizer.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized' });
    if (!isAdmin && !['draft', 'rejected'].includes(event.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit event in current status' });
    }

    const updated = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await createAuditLog({ action: 'EVENT_UPDATED', performedBy: req.user._id, targetModel: 'Event', targetId: event._id });
    res.json({ success: true, event: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Submit event for review
// @route PATCH /api/events/:id/submit
const submitEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.organizer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (event.status !== 'draft' && event.status !== 'rejected') {
      return res.status(400).json({ success: false, message: 'Only draft/rejected events can be submitted' });
    }

    event.status = 'submitted';
    await event.save();
    await createAuditLog({ action: 'EVENT_SUBMITTED', performedBy: req.user._id, targetModel: 'Event', targetId: event._id });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Approve/Reject event (faculty/admin)
// @route PATCH /api/events/:id/review
const reviewEvent = async (req, res) => {
  const { status, rejectionReason } = req.body;
  if (!['approved', 'rejected', 'under_review'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid review status' });
  }
  try {
    const event = await Event.findById(req.params.id).populate('organizer', 'name');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    event.status = status;
    event.reviewedBy = req.user._id;
    event.reviewedAt = new Date();
    if (status === 'rejected' && rejectionReason) event.rejectionReason = rejectionReason;
    await event.save();

    const notifType = status === 'approved' ? 'event_approved' : status === 'rejected' ? 'event_rejected' : 'general';
    await createNotification({
      recipient: event.organizer._id,
      sender: req.user._id,
      type: notifType,
      title: `Event ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: status === 'rejected'
        ? `Your event "${event.title}" was rejected. Reason: ${rejectionReason}`
        : `Your event "${event.title}" has been ${status}.`,
      relatedEvent: event._id
    });
    await createAuditLog({ action: `EVENT_${status.toUpperCase()}`, performedBy: req.user._id, targetModel: 'Event', targetId: event._id, details: { rejectionReason } });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Delete event
// @route DELETE /api/events/:id
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    const isOwner = event.organizer.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not authorized' });

    await event.deleteOne();
    await createAuditLog({ action: 'EVENT_DELETED', performedBy: req.user._id, targetModel: 'Event', targetId: event._id });
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getEvents, getEvent, createEvent, updateEvent, submitEvent, reviewEvent, deleteEvent };
