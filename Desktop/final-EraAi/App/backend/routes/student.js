const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect } = require('../middleware/auth');

// GET /api/student/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { stream, tier, limit = 100 } = req.query;
    const filter = {};
    if (stream) filter.stream = stream;
    if (tier) filter.tier = tier;

    const students = await Student.find(filter)
      .select('name college stream tier scores badges roundsCompleted growthData state')
      .sort({ 'scores.overall': -1 })
      .limit(parseInt(limit));

    const leaderboard = students.map((s, idx) => ({
      rank: idx + 1,
      _id: s._id,
      name: s.name,
      college: s.college,
      stream: s.stream,
      tier: s.tier,
      state: s.state,
      overallScore: s.scores.overall,
      badges: s.badges,
      roundsCompleted: s.roundsCompleted.length,
      trend: s.growthData && s.growthData.length > 1
        ? (s.growthData[s.growthData.length - 1].score > s.growthData[s.growthData.length - 2].score ? 'up' : 'down')
        : 'neutral'
    }));

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/student/stats
router.get('/stats', async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments();
    const certified = await Student.countDocuments({ 'roundsCompleted': { $all: [1, 2, 3, 4] } });
    const streamCounts = await Student.aggregate([
      { $group: { _id: '$stream', count: { $sum: 1 } } }
    ]);
    res.json({ totalStudents, certified, streamCounts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/student/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('-password');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/student/:id/update
router.put('/:id/update', protect, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const { name, college, year, tier, stream, state } = req.body;
    const update = {};
    if (name) update.name = name;
    if (college) update.college = college;
    if (year) update.year = year;
    if (tier) update.tier = tier;
    if (stream) update.stream = stream;
    if (state) update.state = state;

    const student = await Student.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password');
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/student/:id/scores
router.get('/:id/scores', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).select('scores growthData badges roundsCompleted');
    if (!student) return res.status(404).json({ message: 'Student not found' });
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
