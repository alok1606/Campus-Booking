const express = require('express');
const { body } = require('express-validator');
const {
  getResources, getResource, createResource,
  updateResource, deleteResource, getAvailability
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getResources);
router.get('/:id', getResource);
router.get('/:id/availability', getAvailability);

router.post('/', authorize('admin'), [
  body('name').notEmpty().withMessage('Name required'),
  body('type').isIn(['hall','lab','classroom','equipment','auditorium','ground']),
  body('capacity').isNumeric().withMessage('Capacity must be a number'),
  body('location').notEmpty().withMessage('Location required'),
], createResource);

router.put('/:id', authorize('admin'), updateResource);
router.delete('/:id', authorize('admin'), deleteResource);

module.exports = router;
