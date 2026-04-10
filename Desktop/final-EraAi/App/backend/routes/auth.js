const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const buildUserResponse = (student, token) => ({
  _id: student._id,
  name: student.name,
  email: student.email,
  stream: student.stream,
  tier: student.tier,
  college: student.college,
  year: student.year,
  scores: student.scores,
  roundsCompleted: student.roundsCompleted,
  roundsUnlocked: student.roundsUnlocked,
  badges: student.badges,
  streak: student.streak,
  growthData: student.growthData,
  isGoogleUser: !!student.googleId,
  token
});

// ── POST /api/auth/register ──────────────────────────────────────────────────
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg, errors: errors.array() });
  }

  try {
    const { name, email, password, college, year, tier, stream, state } = req.body;

    const existing = await Student.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const student = await Student.create({
      name, email, password,
      college: college || '',
      year: year || '',
      tier: tier || '',
      stream: stream || '',
      state: state || '',
      growthData: []
    });

    res.status(201).json(buildUserResponse(student, generateToken(student._id)));
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post('/login', [
  body('email').trim().isEmail().withMessage('Please enter a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  try {
    const { email, password } = req.body;

    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (student.googleId && !student.password) {
      return res.status(400).json({ message: 'This account was created with Google. Please sign in with Google.' });
    }

    if (!(await student.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update streak
    const now = new Date();
    const lastActive = new Date(student.lastActive);
    const diffDays = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) student.streak += 1;
    else if (diffDays > 1) student.streak = 1;
    student.lastActive = now;
    await student.save();

    res.json(buildUserResponse(student, generateToken(student._id)));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── POST /api/auth/google ────────────────────────────────────────────────────
router.post('/google', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ message: 'Google credential is required' });
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId || clientId === 'your_google_client_id_here') {
    return res.status(503).json({ message: 'Google Sign-In is not configured on this server' });
  }

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();

    let student = await Student.findOne({ email: payload.email });

    if (student) {
      // Link Google account if not linked yet
      if (!student.googleId) {
        student.googleId = payload.sub;
        await student.save();
      }
    } else {
      // Create new account via Google
      student = await Student.create({
        name: payload.name,
        email: payload.email,
        googleId: payload.sub,
        growthData: []
      });
    }

    // Update streak
    const now = new Date();
    const lastActive = new Date(student.lastActive);
    const diffDays = Math.floor((now - lastActive) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) student.streak += 1;
    else if (diffDays > 1) student.streak = 1;
    student.lastActive = now;
    await student.save();

    res.json(buildUserResponse(student, generateToken(student._id)));
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.user._id).select('-password');
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
