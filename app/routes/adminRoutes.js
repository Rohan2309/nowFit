const express = require("express");
const router = express.Router();

const AdminController = require("../controllers/AdminController");
const { requireAuth, permit } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

// ---------------- PROTECTED ADMIN ROUTES ----------------
router.use(requireAuth, permit("admin"));

// ---------------- DASHBOARD ----------------
router.get("/dashboard", AdminController.dashboard);

// ---------------- PROFILE ROUTES ----------------
router.get("/profile", AdminController.profilePage);

// Update profile (AJAX)
router.post(
  "/profile/update",
  upload.single("avatar"),
  AdminController.updateProfile
);

// Change password (AJAX)
router.post(
  "/profile/change-password",
  AdminController.changePassword
);

// Send OTP (AJAX)
router.post(
  "/profile/send-otp",
  AdminController.forgotPasswordSendOTP
);

// Verify OTP & reset password (AJAX)
router.post(
  "/profile/verify-otp",
  AdminController.forgotPasswordVerifyOTP
);

// ---------------- USER CRUD ----------------
router.post("/users", AdminController.createUser);
router.put("/users/:id", AdminController.editUser);
router.delete("/users/:id", AdminController.deleteUser);

// ---------------- COACH ASSIGNMENT ----------------
router.post("/users/:id/assign-coach", AdminController.assignCoach);
router.post("/users/:id/remove-coach", AdminController.removeCoach);

// ---------------- COACH MANAGEMENT ----------------
router.get("/coaches", AdminController.coachesList);
router.put("/coaches/:id", AdminController.editCoach);
router.delete("/coaches/:id", AdminController.deleteCoach);

// ---------------- AJAX: COACHES DATA FOR DROPDOWN ----------------
router.get("/coaches-data", AdminController.coachesData);

module.exports = router;
