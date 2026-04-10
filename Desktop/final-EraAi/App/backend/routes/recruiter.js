const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Recruiter = require('../models/Recruiter');
const Student = require('../models/Student');
const { protectRecruiter } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// POST /api/recruiter/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, company, designation } = req.body;
    const existing = await Recruiter.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });

    const recruiter = await Recruiter.create({ name, email, password, company, designation });
    res.status(201).json({
      _id: recruiter._id,
      name: recruiter.name,
      email: recruiter.email,
      company: recruiter.company,
      token: generateToken(recruiter._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// POST /api/recruiter/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter || !(await recruiter.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    res.json({
      _id: recruiter._id,
      name: recruiter.name,
      email: recruiter.email,
      company: recruiter.company,
      role: 'recruiter',
      token: generateToken(recruiter._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recruiter/students
router.get('/students', protectRecruiter, async (req, res) => {
  try {
    const { stream, tier, minScore, roundsCompleted, state, badge, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (stream) filter.stream = stream;
    if (tier) filter.tier = tier;
    if (state) filter.state = state;
    if (minScore) filter['scores.overall'] = { $gte: parseInt(minScore) };
    if (roundsCompleted) filter.roundsCompleted = { $size: parseInt(roundsCompleted) };
    if (badge) filter.badges = { $elemMatch: { $regex: badge, $options: 'i' } };

    const students = await Student.find(filter)
      .select('name email college year tier stream state scores badges roundsCompleted growthData createdAt')
      .sort({ 'scores.overall': -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Student.countDocuments(filter);
    const certified = await Student.countDocuments({ ...filter, badges: { $elemMatch: { $regex: 'Certified', $options: 'i' } } });
    const tier2_3 = await Student.countDocuments({ ...filter, tier: { $in: ['Tier 2', 'Tier 3'] } });

    res.json({ students, total, certified, tier2_3, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/recruiter/student/:id
router.get('/student/:id', protectRecruiter, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
