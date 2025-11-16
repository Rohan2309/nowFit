const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

// Dashboard
router.get('/dashboard', UserController.dashboard);

// Profile pages
router.get('/profile', UserController.profilePage);
router.post('/profile/update', UserController.updateProfile);
router.post('/profile/change-password', UserController.changePassword);
router.post('/profile/send-otp', UserController.sendOTP);
router.post('/profile/verify-otp', UserController.verifyOTP);

// Progress update
router.post('/profile/update-progress', UserController.updateProgress);

// User diet/workout detail pages
router.get('/diet', UserController.userDietPage);
router.get('/workout', UserController.userWorkoutPage);

module.exports = router;
