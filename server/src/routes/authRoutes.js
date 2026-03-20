const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, verifyOTP, resendOTP, googleLogin } = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/resend-otp', resendOTP);
router.post('/login', login);
router.post('/google', googleLogin);
router.post('/logout', logout);
router.get('/me', authMiddleware, getMe);

module.exports = router;
