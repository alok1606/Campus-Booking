const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const { createAuditLog } = require('../utils/auditLog');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// @desc  Register user
// @route POST /api/auth/register
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { name, email, password, role, department, phone } = req.body;
  try {
    const user = await User.create({ name, email, password, role, department, phone });
    await createAuditLog({ action: 'USER_REGISTERED', performedBy: user._id, targetModel: 'User', targetId: user._id });
    res.status(201).json({ success: true, token: generateToken(user._id), user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    if (!user.isActive) return res.status(401).json({ success: false, message: 'Account is deactivated' });

    await createAuditLog({ action: 'USER_LOGIN', performedBy: user._id, targetModel: 'User', targetId: user._id, ipAddress: req.ip });
    const userObj = user.toJSON();
    res.json({ success: true, token: generateToken(user._id), user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc  Get current user
// @route GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

// @desc  Update profile
// @route PUT /api/auth/profile
const updateProfile = async (req, res) => {
  const { name, department, phone } = req.body;
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id, { name, department, phone }, { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

module.exports = { register, login, getMe, updateProfile };
