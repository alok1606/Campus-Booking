const express = require('express');
const { body } = require('express-validator');
const {
  getBookings, getBooking, createBooking,
  approveBooking, rejectBooking, cancelBooking, exportBookings
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/export', exportBookings);
router.get('/', getBookings);
router.get('/:id', getBooking);

router.post('/', [
  body('resource').notEmpty().withMessage('Resource is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('purpose').notEmpty().withMessage('Purpose is required'),
  body('startTime').isISO8601().withMessage('Valid start time required'),
  body('endTime').isISO8601().withMessage('Valid end time required'),
], createBooking);

router.patch('/:id/approve', authorize('faculty', 'admin'), approveBooking);
router.patch('/:id/reject', authorize('faculty', 'admin'), rejectBooking);
router.patch('/:id/cancel', cancelBooking);

module.exports = router;
