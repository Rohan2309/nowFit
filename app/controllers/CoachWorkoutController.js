const Workout = require('../models/workout');
const User = require('../models/user');

class CoachWorkoutController {

  static async list(req, res) {
    try {
      const workouts = await Workout.find({ createdBy: req.session.userId })
        .populate("assignedTo", "name email")
        .lean();

      return res.render("coach/workouts", { coach: req.user, workouts });

    } catch (err) {
      console.error("WORKOUT LIST ERROR:", err);
      return res.status(500).send("Server error");
    }
  }

  static async create(req, res) {
    try {
      const { title, description, level, exercises } = req.body;

      let parsedExercises =
        typeof exercises === "string" ? JSON.parse(exercises) : exercises;

      const workout = await Workout.create({
        title,
        description,
        level,
        exercises: parsedExercises,
        createdBy: req.user._id
      });

      return res.json({ success: true, workout });

    } catch (err) {
      console.error("CREATE WORKOUT ERROR:", err);
      return res.json({ success: false, message: "Failed to create" });
    }
  }

  static async update(req, res) {
    try {
      const { title, description, level, exercises } = req.body;

      let parsedExercises =
        typeof exercises === "string" ? JSON.parse(exercises) : exercises;

      const workout = await Workout.findOneAndUpdate(
        { _id: req.params.id, createdBy: req.user._id },
        {
          title,
          description,
          level,
          exercises: parsedExercises
        },
        { new: true }
      );

      return res.json({ success: true, workout });

    } catch (err) {
      console.error("UPDATE WORKOUT ERROR:", err);
      return res.json({ success: false, message: "Update failed" });
    }
  }

  static async delete(req, res) {
    try {
      await Workout.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user._id
      });

      return res.json({ success: true });

    } catch (err) {
      console.error("DELETE WORKOUT ERROR:", err);
      return res.json({ success: false });
    }
  }

  // ASSIGN — FIXED
  static async assign(req, res) {
    try {
      const { userId } = req.body;

      // 1. assign inside workout
      const workout = await Workout.findOneAndUpdate(
        { _id: req.params.id, createdBy: req.user._id },
        { assignedTo: userId },
        { new: true }
      );

      // 2. assign inside the user as well
      await User.findByIdAndUpdate(userId, {
        assignedWorkout: req.params.id
      });

      return res.json({ success: true, workout });

    } catch (err) {
      console.error("ASSIGN WORKOUT ERROR:", err);
      return res.json({ success: false });
    }
  }

  // UNASSIGN — FIXED
  static async unassign(req, res) {
    try {

      await Workout.findOneAndUpdate(
        { _id: req.params.id, createdBy: req.user._id },
        { assignedTo: null }
      );

      await User.updateMany(
        { assignedWorkout: req.params.id },
        { assignedWorkout: null }
      );

      return res.json({ success: true });

    } catch (err) {
      console.error("UNASSIGN WORKOUT ERROR:", err);
      return res.json({ success: false });
    }
  }

  static async usersData(req, res) {
    try {
      const users = await User.find({ role: "user" })
        .select("name email")
        .lean();

      return res.json({ users });

    } catch (err) {
      console.error("WORKOUT USERS DATA ERROR:", err);
      return res.json({ users: [] });
    }
  }
}

module.exports = CoachWorkoutController;
