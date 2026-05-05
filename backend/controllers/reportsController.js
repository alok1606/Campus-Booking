const Booking = require('../models/Booking');
const Event = require('../models/Event');

// @desc  Get report data (bookings or events)
// @route GET /api/reports
const getReport = async (req, res) => {
  try {
    const { type = 'bookings', startDate, endDate } = req.query;

    if (type === 'bookings') {
      const query = {};
      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) query.startTime.$gte = new Date(startDate);
        if (endDate) query.startTime.$lte = new Date(endDate);
      }
      const data = await Booking.find(query)
        .populate('resource', 'name type')
        .populate('requestedBy', 'name email')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .lean();

      // Normalise field name: frontend uses bk.bookedBy
      const normalized = data.map(b => ({ ...b, bookedBy: b.requestedBy }));
      return res.json({ success: true, data: normalized });
    }

    if (type === 'events') {
      const query = {};
      if (startDate || endDate) {
        query.startDate = {};
        if (startDate) query.startDate.$gte = new Date(startDate);
        if (endDate) query.startDate.$lte = new Date(endDate);
      }
      const data = await Event.find(query)
        .populate('organizer', 'name email')
        .sort({ createdAt: -1 })
        .lean();
      return res.json({ success: true, data });
    }

    res.status(400).json({ success: false, message: 'Invalid report type. Use bookings or events.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Export report as CSV
// @route GET /api/reports/export
const exportReport = async (req, res) => {
  try {
    const { type = 'bookings', startDate, endDate } = req.query;
    let rows = [];
    let headers = [];

    if (type === 'bookings') {
      const query = {};
      if (startDate || endDate) {
        query.startTime = {};
        if (startDate) query.startTime.$gte = new Date(startDate);
        if (endDate) query.startTime.$lte = new Date(endDate);
      }
      const bookings = await Booking.find(query)
        .populate('resource', 'name type')
        .populate('requestedBy', 'name email')
        .lean();

      headers = ['Title', 'Purpose', 'Resource', 'ResourceType', 'BookedBy', 'Email', 'StartTime', 'EndTime', 'Status', 'CreatedAt'];
      rows = bookings.map(b => [
        b.title || '',
        b.purpose || '',
        b.resource?.name || '',
        b.resource?.type || '',
        b.requestedBy?.name || '',
        b.requestedBy?.email || '',
        new Date(b.startTime).toISOString(),
        new Date(b.endTime).toISOString(),
        b.status || '',
        new Date(b.createdAt).toISOString()
      ]);
    } else if (type === 'events') {
      const query = {};
      if (startDate || endDate) {
        query.startDate = {};
        if (startDate) query.startDate.$gte = new Date(startDate);
        if (endDate) query.startDate.$lte = new Date(endDate);
      }
      const events = await Event.find(query)
        .populate('organizer', 'name email')
        .lean();

      headers = ['Title', 'Category', 'Description', 'Organizer', 'Email', 'StartDate', 'EndDate', 'Status', 'Venue', 'CreatedAt'];
      rows = events.map(e => [
        e.title || '',
        e.category || '',
        (e.description || '').replace(/"/g, '""'),
        e.organizer?.name || '',
        e.organizer?.email || '',
        new Date(e.startDate).toISOString(),
        new Date(e.endDate).toISOString(),
        e.status || '',
        e.venue || '',
        new Date(e.createdAt).toISOString()
      ]);
    }

    const csv = [
      headers.join(','),
      ...rows.map(r => r.map(v => `"${v}"`).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_report.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getReport, exportReport };
