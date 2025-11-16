const express = require('express');
const router = express.Router();
const CoachDietController = require('../controllers/CoachDietController');
const { requireAuth, permit } = require('../middlewares/auth');

// ================================
// MUST BE FIRST (avoid route clash with "/:id")
// ================================
router.get('/users-data',
  requireAuth,
  permit('coach'),
  CoachDietController.usersData
);

// ================================
// LIST DIETS
// ================================
router.get('/',
  requireAuth,
  permit('coach'),
  CoachDietController.list
);

// ================================
// CREATE DIET
// ================================
router.post('/',
  requireAuth,
  permit('coach'),
  CoachDietController.create
);

// ================================
// UPDATE DIET
// ================================
router.put('/:id',
  requireAuth,
  permit('coach'),
  CoachDietController.update
);

// ================================
// DELETE DIET
// ================================
router.delete('/:id',
  requireAuth,
  permit('coach'),
  CoachDietController.delete
);

// ================================
// ASSIGN DIET
// ================================
router.post('/:id/assign',
  requireAuth,
  permit('coach'),
  CoachDietController.assign
);

// ================================
// UNASSIGN DIET
// ================================
router.post('/:id/unassign',
  requireAuth,
  permit('coach'),
  CoachDietController.unassign
);

module.exports = router;
