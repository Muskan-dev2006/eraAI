const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const growthDataSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  score: Number,
  round: Number,
  label: String
});

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, minlength: 6, default: null },
  googleId: { type: String, default: null },
  college: { type: String, default: '' },
  year: { type: String, default: '' },
  tier: { type: String, enum: ['Tier 1', 'Tier 2', 'Tier 3', ''], default: '' },
  stream: {
    type: String,
    enum: ['DSA', 'AI/ML', 'Web Dev', 'CS Fundamentals', ''],
    default: ''
  },
  scores: {
    round1: { type: Number, default: 0 },
    round2: { type: Number, default: 0 },
    round3: { type: Number, default: 0 },
    round4: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  roundsCompleted: { type: [Number], default: [] },
  roundsUnlocked: { type: [Number], default: [1] },
  badges: { type: [String], default: [] },
  growthData: [growthDataSchema],
  streak: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  tabSwitches: { type: Number, default: 0 },
  state: { type: String, default: '' },
  role: { type: String, default: 'student' },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

studentSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

studentSchema.methods.matchPassword = async function (enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('Student', studentSchema);
