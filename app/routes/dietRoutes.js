const express = require("express");
const router = express.Router();
const DietController = require("../controllers/DietController");
const { requireAuth, permit } = require("../middlewares/auth");
const redis = require("../config/redis");   // <-- Redis added

// ONLY ADMIN CAN ACCESS
router.use(requireAuth, permit("admin"));

/**
 * ===========================================
 * REDIS CACHED DIET LIST (ADMIN VIEW)
 * ===========================================
 */
router.get("/", async (req, res) => {
  try {
    // Try to load from cache
    const cacheKey = "diet_list_admin";

    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log("⚡ Serving Diets from Redis Cache");
      return res.render("admin/diets/list", { diets: JSON.parse(cachedData) });
    }

    // If no cache → load from DB using controller
    const diets = await DietController.getAll(); // <-- you must add getAll() helper
    await redis.set(cacheKey, JSON.stringify(diets), "EX", 60);

    return res.render("admin/diets/list", { diets });

  } catch (err) {
    console.error("Redis Diet Cache Error:", err);
    return DietController.list(req, res);
  }
});

/**
 * CREATE
 * - clear cache
 */
router.get("/create", DietController.createPage);

router.post("/create", async (req, res) => {
  await redis.del("diet_list_admin");
  DietController.create(req, res);
});

/**
 * EDIT PAGE
 */
router.get("/:id/edit", DietController.editPage);

/**
 * UPDATE
 * - clear cache
 */
router.post("/:id/edit", async (req, res) => {
  await redis.del("diet_list_admin");
  DietController.update(req, res);
});

/**
 * DELETE
 * - clear cache
 */
router.post("/:id/delete", async (req, res) => {
  await redis.del("diet_list_admin");
  DietController.delete(req, res);
});

module.exports = router;
