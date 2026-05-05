const { validationResult } = require('express-validator');
const Resource = require('../models/Resource');
const Booking = require('../models/Booking');
const { createAuditLog } = require('../utils/auditLog');

// @desc  Get all resources
// @route GET /api/resources
const getResources = async (req, res) => {
  try {
    const { search, type, isAvailable, page = 1, limit = 10 } = req.query;
    const query = {};
    if (search) query.$text = { $search: search };
    if (type) query.type = type;
    if (isAvailable !== undefined) query.isAvailable = isAvailable === 'true';

    const total = await Resource.countDocuments(query);
    const resources = await Resource.find(query)
      .populate('createdBy', 'name')
      .sort({ name: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, total, resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get single resource
// @route GET /api/resources/:id
const getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate('createdBy', 'name');
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Create resource (admin)
// @route POST /api/resources
const createResource = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const resource = await Resource.create({ ...req.body, createdBy: req.user._id });
    await createAuditLog({ action: 'RESOURCE_CREATED', performedBy: req.user._id, targetModel: 'Resource', targetId: resource._id });
    res.status(201).json({ success: true, resource });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Update resource (admin)
// @route PUT /api/resources/:id
const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    await createAuditLog({ action: 'RESOURCE_UPDATED', performedBy: req.user._id, targetModel: 'Resource', targetId: resource._id });
    res.json({ success: true, resource });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Delete resource (admin)
// @route DELETE /api/resources/:id
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    await resource.deleteOne();
    await createAuditLog({ action: 'RESOURCE_DELETED', performedBy: req.user._id, targetModel: 'Resource', targetId: resource._id });
    res.json({ success: true, message: 'Resource deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get resource availability for a date range
// @route GET /api/resources/:id/availability
const getAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ success: false, message: 'Date is required' });

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const bookings = await Booking.find({
      resource: req.params.id,
      status: { $in: ['pending', 'approved'] },
      startTime: { $lte: dayEnd },
      endTime: { $gte: dayStart }
    }).select('startTime endTime title status');

    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getResources, getResource, createResource, updateResource, deleteResource, getAvailability };
