const express = require('express');
const { getDashboardStats, getUsers, toggleUser, getAuditLogs } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(protect, authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.patch('/users/:id/toggle', toggleUser);
router.get('/audit-logs', getAuditLogs);

module.exports = router;
