const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config');

const register = async (req, res) => {
  try {
    const { email, password, full_name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const user = await User.create({ email, password: hashedPassword, full_name });

    // Auto-login after registration
    const token = jwt.sign({ id: user._id, email: user.email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: config.cookieMaxAge,
    });

    res.status(201).json({ message: 'User registered successfully', user: { id: user._id, email: user.email, full_name: user.full_name, currentStreak: user.currentStreak || 0 } });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ detail: 'Server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: config.isProduction,
      sameSite: 'lax',
      maxAge: config.cookieMaxAge,
    });

    res.json({ message: 'Login successful', user: { id: user._id, email: user.email, full_name: user.full_name, currentStreak: user.currentStreak || 0 } });
  } catch (error) {
    res.status(500).json({ detail: 'Server error' });
  }
};

const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
  });
  res.json({ message: 'Logged out' });
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(404).json({ detail: 'User not found' });
  }
  res.json({ id: user._id, email: user.email, full_name: user.full_name, currentStreak: user.currentStreak || 0 });
};

module.exports = { register, login, logout, getMe };
