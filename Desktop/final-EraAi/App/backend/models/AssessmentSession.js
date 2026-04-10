const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: String,
  questionText: String,
  answer: mongoose.Schema.Types.Mixed,
  correct: Boolean,
  score: Number,
  feedback: String,
  timeTaken: Number
});

const assessmentSessionSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  round: { type: Number, required: true, enum: [1, 2, 3, 4] },
  stream: { type: String, required: true },
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  answers: [answerSchema],
  tabSwitches: { type: Number, default: 0 },
  terminated: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 100 },
  passed: { type: Boolean, default: false },
  aiFeedback: { type: String, default: '' },
  currentDifficulty: { type: Number, default: 5 },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('AssessmentSession', assessmentSessionSchema);
