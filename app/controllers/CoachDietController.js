const Diet = require('../models/diet');
const User = require('../models/user');

class CoachDietController {

  // LIST
  static async list(req, res) {
    try {
      const diets = await Diet.find({ createdBy: req.session.userId })
        .populate("assignedTo", "name email")
        .lean();

      return res.render("coach/diets", { coach: req.user, diets });

    } catch (err) {
      console.error("DIET LIST ERROR:", err);
      return res.status(500).send("Server error");
    }
  }

  // CREATE
  static async create(req, res) {
    try {
      const { title, description, meals } = req.body;

      let parsedMeals =
        typeof meals === "string" ? JSON.parse(meals) : meals;

      const totalCalories = parsedMeals.reduce(
        (sum, m) => sum + Number(m.calories || 0),
        0
      );

      const diet = await Diet.create({
        title,
        description,
        meals: parsedMeals,
        calories: totalCalories,
        createdBy: req.user._id
      });

      return res.json({ success: true, diet });

    } catch (err) {
      console.error("CREATE DIET ERROR:", err);
      return res.json({ success: false, message: "Create failed" });
    }
  }

  // UPDATE
  static async update(req, res) {
    try {
      const { title, description, meals } = req.body;

      let parsedMeals =
        typeof meals === "string" ? JSON.parse(meals) : meals;

      const totalCalories = parsedMeals.reduce(
        (sum, m) => sum + Number(m.calories || 0),
        0
      );

      const diet = await Diet.findOneAndUpdate(
        { _id: req.params.id, createdBy: req.user._id },
        {
          title,
          description,
          meals: parsedMeals,
          calories: totalCalories
        },
        { new: true }
      );

      return res.json({ success: true, diet });

    } catch (err) {
      console.error("UPDATE DIET ERROR:", err);
      return res.json({ success: false, message: "Update failed" });
    }
  }

  // DELETE
  static async delete(req, res) {
    try {
      await Diet.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user._id
      });

      return res.json({ success: true });

    } catch (err) {
      console.error("DELETE DIET ERROR:", err);
      return res.json({ success: false });
    }
  }

  // ASSIGN — FIXED
  static async assign(req, res) {
    try {
      const { userId } = req.body;

      // 1. Assign to Diet
      const diet = await Diet.findOneAndUpdate(
        { _id: req.params.id, createdBy: req.user._id },
        { assignedTo: userId },
        { new: true }
      );

      // 2. Assign diet to USER also
      await User.findByIdAndUpdate(userId, {
        assignedDiet: req.params.id
      });

      return res.json({ success: true, diet });

    } catch (err) {
      console.error("ASSIGN DIET ERROR:", err);
      return res.json({ success: false });
    }
  }

  // UNASSIGN — FIXED
  static async unassign(req, res) {
    try {
      await Diet.findOneAndUpdate(
        { _id: req.params.id, createdBy: req.user._id },
        { assignedTo: null }
      );

      // also clear the user
      await User.updateMany(
        { assignedDiet: req.params.id },
        { assignedDiet: null }
      );

      return res.json({ success: true });

    } catch (err) {
      console.error("UNASSIGN DIET ERROR:", err);
      return res.json({ success: false });
    }
  }

  // USERS LIST
  static async usersData(req, res) {
    try {
      const users = await User.find({ role: "user" })
        .select("name email")
        .lean();

      return res.json({ users });

    } catch (err) {
      console.error("DIET USERS DATA ERROR:", err);
      return res.json({ users: [] });
    }
  }
}

module.exports = CoachDietController;
