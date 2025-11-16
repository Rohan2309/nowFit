const express = require('express');
const router = express.Router();
const ClientController = require('../controllers/ClientController');
const upload = require('../middlewares/upload');

// Dashboard
router.get('/dashboard', ClientController.dashboard);

// Diet / Workout
router.get('/diet', ClientController.myDiet);
router.get('/workout', ClientController.myWorkout);

// Profile
router.get('/profile', ClientController.profilePage);
router.post('/profile/update', upload.single('avatar'), ClientController.updateProfile);
router.post('/profile/change-password', ClientController.changePassword);
router.post('/profile/send-otp', ClientController.sendOTP);
router.post('/profile/verify-otp', ClientController.verifyOTP);

// Progress
router.post('/update-progress', ClientController.updateProgress);

module.exports = router;
