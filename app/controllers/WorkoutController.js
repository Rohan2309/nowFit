const Workout = require("../models/workout");
const User = require("../models/user");

class WorkoutController {

  // -------------------------------------
  // LIST WORKOUTS
  // -------------------------------------
  static async list(req, res) {
    try {
      const workouts = await Workout.find()
        .populate("createdBy", "name email role")
        .populate("assignedTo", "name email")
        .lean();

      return res.render("admin/workouts/list", { workouts, admin: req.user });
    } catch (err) {
      console.log("WORKOUT LIST ERROR:", err);
      res.status(500).send("Server Error");
    }
  }

  // -------------------------------------
  // CREATE WORKOUT (FIXED: NO JSON.PARSE)
  // -------------------------------------
  static async create(req, res) {
    try {
      const exercises = req.body.exercises || []; // already array

      const workout = await Workout.create({
        title: req.body.title,
        description: req.body.description,
        level: req.body.level,
        exercises,
        createdBy: req.user._id,
      });

      return res.json({ success: true, workout });

    } catch (err) {
      console.log("CREATE WORKOUT ERROR:", err);
      return res.json({ success: false, message: "Failed to create workout" });
    }
  }

  // -------------------------------------
  // UPDATE WORKOUT (FIXED)
  // -------------------------------------
  static async update(req, res) {
    try {
      const exercises = req.body.exercises || []; // array directly

      const workout = await Workout.findByIdAndUpdate(
        req.params.id,
        {
          title: req.body.title,
          description: req.body.description,
          level: req.body.level,
          exercises,
        },
        { new: true }
      );

      return res.json({ success: true, workout });

    } catch (err) {
      console.log("UPDATE WORKOUT ERROR:", err);
      return res.json({ success: false, message: "Update failed" });
    }
  }

  // -------------------------------------
  // DELETE WORKOUT
  // -------------------------------------
  static async delete(req, res) {
    try {
      await Workout.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    } catch (err) {
      console.log("DELETE WORKOUT ERROR:", err);
      return res.json({ success: false });
    }
  }

  // -------------------------------------
  // ASSIGN WORKOUT TO USER
  // -------------------------------------
  static async assign(req, res) {
    try {
      const workout = await Workout.findByIdAndUpdate(
        req.params.id,
        { assignedTo: req.body.userId },
        { new: true }
      );

      return res.json({ success: true, workout });
    } catch (err) {
      console.log("ASSIGN WORKOUT ERROR:", err);
      return res.json({ success: false, message: "Assignment failed" });
    }
  }

  // -------------------------------------
  // REMOVE ASSIGNMENT
  // -------------------------------------
  static async unassign(req, res) {
    try {
      await Workout.findByIdAndUpdate(req.params.id, { assignedTo: null });
      return res.json({ success: true });
    } catch (err) {
      console.log("UNASSIGN WORKOUT ERROR:", err);
      return res.json({ success: false });
    }
  }
}

module.exports = WorkoutController;
