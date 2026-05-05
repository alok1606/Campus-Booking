const AuditLog = require('../models/AuditLog');

const createAuditLog = async ({ action, performedBy, targetModel, targetId, details, ipAddress }) => {
  try {
    await AuditLog.create({ action, performedBy, targetModel, targetId, details, ipAddress });
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
