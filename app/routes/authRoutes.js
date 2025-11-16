const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/AuthController');

// ================================
// LOGIN
// ================================
router.get('/login', AuthController.loginPage);
router.post('/login', AuthController.login);

// ================================
// REGISTER
// ================================
router.get('/register', AuthController.registerPage);
router.post('/register', AuthController.register);

// ================================
// FORGOT PASSWORD (OTP FLOW)
// ================================

// Send OTP → /auth/send-otp
router.post('/send-otp', AuthController.sendOTP);

// Reset password → /auth/reset-password
router.post('/reset-password', AuthController.resetPassword);

// ================================
// LOGOUT
// ================================
router.get('/logout', AuthController.logout);

module.exports = router;
