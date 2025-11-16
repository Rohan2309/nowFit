const express = require("express");
const router = express.Router();
const WorkoutController = require("../controllers/WorkoutController");
const { requireAuth, permit } = require("../middlewares/auth");

// All workout routes require admin access
router.use(requireAuth, permit("admin"));

router.get("/", WorkoutController.list);
router.post("/", WorkoutController.create);
router.put("/:id", WorkoutController.update);
router.delete("/:id", WorkoutController.delete);

router.post("/:id/assign", WorkoutController.assign);
router.post("/:id/unassign", WorkoutController.unassign);

module.exports = router;
