const Diet = require("../models/diet");
const User = require("../models/user");

class DietController {

  /**
   * =======================================================
   *  HELPER FUNCTION (USED BY REDIS ROUTES)
   * =======================================================
   */
  static async getAll() {
    try {
      return await Diet.find()
        .populate("createdBy", "name role")
        .populate("assignedTo", "name email")
        .lean();
    } catch (err) {
      console.error("DietController.getAll Error:", err);
      return [];
    }
  }

  /**
   * =======================================================
   *  LIST PAGE (Admin)
   * =======================================================
   */
  static async list(req, res) {
    try {
      const diets = await Diet.find()
        .populate("createdBy", "name role")
        .populate("assignedTo", "name email")
        .lean();

      res.render("admin/diets/list", {
        admin: req.user,
        diets
      });

    } catch (err) {
      console.error("DietController.list Error:", err);
      res.status(500).send("Server Error");
    }
  }

  /**
   * =======================================================
   *  CREATE PAGE
   * =======================================================
   */
  static async createPage(req, res) {
    res.render("admin/diets/create", { admin: req.user });
  }

  /**
   * =======================================================
   *  CREATE DIET
   * =======================================================
   */
  static async create(req, res) {
    try {
      const { title, description, foods, calories } = req.body;

      await Diet.create({
        title,
        description,
        foods: foods ? foods.split(",").map(f => f.trim()) : [],
        calories,
        createdBy: req.user._id
      });

      res.redirect("/admin/diets");

    } catch (err) {
      console.error("DietController.create Error:", err);
      res.status(500).send("Server Error");
    }
  }

  /**
   * =======================================================
   *  EDIT PAGE
   * =======================================================
   */
  static async editPage(req, res) {
    try {
      const diet = await Diet.findById(req.params.id).lean();

      // Prevent undefined foods array
      diet.foods = Array.isArray(diet.foods) ? diet.foods : [];

      res.render("admin/diets/edit", {
        admin: req.user,
        diet
      });

    } catch (err) {
      console.error("DietController.editPage Error:", err);
      res.status(500).send("Server Error");
    }
  }

  /**
   * =======================================================
   *  UPDATE
   * =======================================================
   */
  static async update(req, res) {
    try {
      const { title, description, foods, calories } = req.body;

      await Diet.findByIdAndUpdate(req.params.id, {
        title,
        description,
        foods: foods ? foods.split(",").map(f => f.trim()) : [],
        calories
      });

      res.redirect("/admin/diets");

    } catch (err) {
      console.error("DietController.update Error:", err);
      res.status(500).send("Server Error");
    }
  }

  /**
   * =======================================================
   *  DELETE DIET
   * =======================================================
   */
  static async delete(req, res) {
    try {
      await Diet.findByIdAndDelete(req.params.id);
      res.redirect("/admin/diets");
    } catch (err) {
      console.error("DietController.delete Error:", err);
      res.status(500).send("Server Error");
    }
  }
}

module.exports = DietController;
