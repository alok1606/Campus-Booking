const express = require('express');
const { body } = require('express-validator');
const {
  getEvents, getEvent, createEvent, updateEvent,
  submitEvent, reviewEvent, deleteEvent
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getEvents);
router.get('/:id', getEvent);

router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('category').isIn(['academic','cultural','sports','technical','workshop','seminar','other']),
  body('startDate').isISO8601().withMessage('Valid start date required'),
  body('endDate').isISO8601().withMessage('Valid end date required'),
], createEvent);

router.put('/:id', updateEvent);
router.patch('/:id/submit', submitEvent);
router.patch('/:id/review', authorize('faculty', 'admin'), reviewEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
