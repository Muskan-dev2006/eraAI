const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  round: { type: Number, required: true, enum: [1, 2] },
  stream: {
    type: String,
    required: true,
    enum: ['DSA', 'AI/ML', 'Web Dev', 'CS Fundamentals', 'General']
  },
  difficulty: { type: Number, default: 1, min: 1, max: 10 },
  question: { type: String, required: true },
  options: { type: [String], required: true },
  correct: { type: Number, required: true },
  explanation: { type: String, default: '' },
  topic: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Question', questionSchema);
