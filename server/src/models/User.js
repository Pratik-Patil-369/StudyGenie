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
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    code: String,
    expiresAt: Date
  },
  loginProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  }
}, {
  timestamps: true,
});

userSchema.index({ xp: -1 }); // For leaderboard sorting
userSchema.index({ currentStreak: -1 }); // For streak sorting

module.exports = mongoose.model('User', userSchema);
