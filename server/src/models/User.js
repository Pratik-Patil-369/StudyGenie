const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  xp: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: null
  },
  full_name: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);
