const express = require('express');
const router = express.Router();
const CoachWorkoutController = require('../controllers/CoachWorkoutController');
const { requireAuth, permit } = require('../middlewares/auth');

// ================================
// MUST BE FIRST (avoid clash)
// ================================
router.get('/users-data',
  requireAuth,
  permit('coach'),
  CoachWorkoutController.usersData
);

// ================================
// LIST WORKOUTS
// ================================
router.get('/',
  requireAuth,
  permit('coach'),
  CoachWorkoutController.list
);

// ================================
// CREATE WORKOUT
// ================================
router.post('/',
  requireAuth,
  permit('coach'),
  CoachWorkoutController.create
);

// ================================
// UPDATE WORKOUT
// ================================
router.put('/:id',
  requireAuth,
  permit('coach'),
  CoachWorkoutController.update
);

// ================================
// DELETE WORKOUT
// ================================
router.delete('/:id',
  requireAuth,
  permit('coach'),
  CoachWorkoutController.delete
);

// ================================
// ASSIGN WORKOUT
// ================================
router.post('/:id/assign',
  requireAuth,
  permit('coach'),
  CoachWorkoutController.assign
);

// ================================
// UNASSIGN WORKOUT
// ================================
router.post('/:id/unassign',
  requireAuth,
  permit('coach'),
  CoachWorkoutController.unassign
);

module.exports = router;
