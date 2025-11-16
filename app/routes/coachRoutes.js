const express = require('express');
const router = express.Router();
const CoachController = require('../controllers/CoachController');
const coachWorkoutRoutes = require('./coachWorkoutRoutes');
const coachDietRoutes = require('./coachDietRoutes');
const upload = require('../middlewares/upload');

// DASHBOARD
router.get('/dashboard', CoachController.dashboard);

// ASSIGNED USERS PAGE
router.get('/users', CoachController.assignedUsers);

// PROFILE ROUTES
router.get('/profile', CoachController.profilePage);
router.post('/profile/update', upload.single('avatar'), CoachController.updateProfile);
router.post('/profile/change-password', CoachController.changePassword);
router.post('/profile/send-otp', CoachController.sendOTP);
router.post('/profile/verify-otp', CoachController.verifyOTP);

// WORKOUTS & DIETS
router.use('/workouts', coachWorkoutRoutes);
router.use('/diets', coachDietRoutes);

module.exports = router;
