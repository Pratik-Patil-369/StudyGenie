const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const User = require('../models/User');
const config = require('../config');
const { sendOTPEmail } = require('../utils/emailService');

const client = new OAuth2Client(config.googleClientId);

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().optional().or(z.literal(''))
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const register = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ detail: parsed.error.errors[0].message });
    }
    const { email, password, full_name } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ detail: 'Email already registered' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const otpCode = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    const user = await User.create({ 
        email, 
        password: hashedPassword, 
        full_name,
        isVerified: false,
        otp: { code: otpCode, expiresAt: otpExpiry }
    });

    // Send Verification Email
    await sendOTPEmail(user, otpCode);

    res.status(201).json({ 
        message: 'Registration successful. Please check your email for the verification code.', 
        verificationRequired: true,
        email: user.email
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ detail: 'Server error' });
  }
};

const verifyOTP = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) {
            return res.status(400).json({ detail: 'Email and code are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ detail: 'Account already verified' });
        }

        if (!user.otp || user.otp.code !== code) {
            return res.status(400).json({ detail: 'Invalid verification code' });
        }

        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({ detail: 'Verification code has expired' });
        }

        // Success
        user.isVerified = true;
        user.otp = undefined;
        await user.save();

        const token = jwt.sign({ id: user._id, email: user.email }, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn,
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: config.isProduction,
            sameSite: 'lax',
            maxAge: config.cookieMaxAge,
        });

        res.json({ 
            message: 'Email verified successfully', 
            user: { id: user._id, email: user.email, full_name: user.full_name, currentStreak: user.currentStreak || 0 } 
        });
    } catch (error) {
        console.error('OTP Verification error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
};

const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ detail: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ detail: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ detail: 'Account already verified' });
        }

        const otpCode = generateOTP();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        user.otp = { code: otpCode, expiresAt: otpExpiry };
        await user.save();

        await sendOTPEmail(user, otpCode);

        res.json({ message: 'A new verification code has been sent to your email.' });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({ detail: 'Server error' });
    }
};

const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ detail: parsed.error.errors[0].message });
    }
    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }

    if (!user.isVerified) {
        return res.status(403).json({ 
            detail: 'Please verify your email address before logging in.', 
            verificationRequired: true,
            email: user.email
        });
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

const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ detail: 'ID Token is required' });
        }

        const ticket = await client.verifyIdToken({
            idToken,
            audience: config.googleClientId
        });
        const payload = ticket.getPayload();
        const { sub: googleId, email, name } = payload;

        let user = await User.findOne({ 
            $or: [{ googleId }, { email }] 
        });

        if (user) {
            // Update user if they don't have googleId yet
            if (!user.googleId) {
                user.googleId = googleId;
                user.loginProvider = 'google';
                user.isVerified = true;
                await user.save();
            }
        } else {
            // Create new Google user
            user = await User.create({
                email,
                full_name: name,
                googleId,
                loginProvider: 'google',
                isVerified: true
            });
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

        res.json({ 
            message: 'Google login successful', 
            user: { id: user._id, email: user.email, full_name: user.full_name, currentStreak: user.currentStreak || 0 } 
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ detail: 'Google authentication failed' });
    }
};

module.exports = { register, login, logout, getMe, verifyOTP, resendOTP, googleLogin };
