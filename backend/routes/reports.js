const express = require('express');
const { getReport, exportReport } = require('../controllers/reportsController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect, authorize('admin', 'faculty'));

router.get('/export', exportReport);
router.get('/', getReport);

module.exports = router;
