const User = require('../models/user');
const Diet = require('../models/diet');
const Workout = require('../models/workout');
const { sendMail } = require('../utils/mailer');
const cloudinary = require('../utils/cloudinary');
const bcrypt = require('bcrypt');

class ClientController {

  // ================================
  // DASHBOARD
  // ================================
  static async dashboard(req, res) {
    try {
      const user = await User.findById(req.user._id)
        .populate("coachAssigned", "name email profileImage")
        .lean();

      const diet = user.assignedDiet
        ? await Diet.findById(user.assignedDiet).lean()
        : null;

      const workout = user.assignedWorkout
        ? await Workout.findById(user.assignedWorkout).lean()
        : null;

      return res.render("client/dashboard", {
        user,
        coach: user.coachAssigned || null,
        diet,
        workout
      });

    } catch (err) {
      console.error("CLIENT DASHBOARD ERROR:", err);
      return res.status(500).send("Server error");
    }
  }

  // ================================
  // MY DIET
  // ================================
  static async myDiet(req, res) {
    try {
      const user = await User.findById(req.user._id).lean();

      const diet = user.assignedDiet
        ? await Diet.findById(user.assignedDiet)
            .populate("createdBy", "name profileImage")
            .lean()
        : null;

      return res.render("client/diet", { user, diet });

    } catch (err) {
      console.error("MY DIET ERROR:", err);
      return res.status(500).send("Server error");
    }
  }

  // ================================
  // MY WORKOUT
  // ================================
  static async myWorkout(req, res) {
    try {
      const user = await User.findById(req.user._id).lean();

      const workout = user.assignedWorkout
        ? await Workout.findById(user.assignedWorkout)
            .populate("createdBy", "name profileImage")
            .lean()
        : null;

      return res.render("client/workout", { user, workout });

    } catch (err) {
      console.error("MY WORKOUT ERROR:", err);
      return res.status(500).send("Server error");
    }
  }

  // ================================
  // PROFILE PAGE
  // ================================
  static async profilePage(req, res) {
    try {
      const user = await User.findById(req.user._id)
        .populate("coachAssigned", "name email profileImage")
        .lean();

      const diet = user.assignedDiet
        ? await Diet.findById(user.assignedDiet).lean()
        : null;

      const workout = user.assignedWorkout
        ? await Workout.findById(user.assignedWorkout).lean()
        : null;

      return res.render("client/profile", {
        user,
        coach: user.coachAssigned || null,
        diet,
        workout
      });

    } catch (err) {
      console.error("PROFILE PAGE ERROR:", err);
      return res.status(500).send("Server error");
    }
  }

  // ================================
  // UPDATE PROFILE
  // ================================
  static async updateProfile(req, res) {
    try {
      let profileImage = req.user.profileImage;

      if (req.file) {
        const upload = await cloudinary.uploader.upload(req.file.path, {
          folder: "nowfit/users"
        });
        profileImage = upload.secure_url;
      }

      const updated = await User.findByIdAndUpdate(
        req.user._id,
        {
          name: req.body.name,
          email: req.body.email,
          profileImage
        },
        { new: true }
      ).lean();

      return res.json({
        success: true,
        message: "Profile updated",
        user: updated
      });

    } catch (err) {
      console.error("UPDATE PROFILE ERROR:", err);
      return res.json({ success: false, message: "Update failed" });
    }
  }

  // ================================
  // CHANGE PASSWORD
  // ================================
  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;

      const user = await User.findById(req.user._id);

      const valid = await bcrypt.compare(oldPassword, user.password);
      if (!valid)
        return res.json({ success: false, message: "Incorrect old password" });

      user.password = newPassword;
      await user.save();

      return res.json({ success: true, message: "Password changed" });

    } catch (err) {
      console.error("CHANGE PASSWORD ERROR:", err);
      return res.json({ success: false, message: "Server error" });
    }
  }

  // ================================
  // SEND OTP
  // ================================
  static async sendOTP(req, res) {
    try {
      const user = await User.findById(req.user._id);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otp;
      user.otpExpiry = Date.now() + 5 * 60 * 1000;
      await user.save();

      await sendMail(user.email, "NOWFit OTP", `<h2>${otp}</h2><p>Valid 5 min</p>`);

      return res.json({ success: true, message: "OTP sent!" });

    } catch (err) {
      console.error("SEND OTP ERROR:", err);
      return res.json({ success: false, message: "Failed" });
    }
  }

  // ================================
  // VERIFY OTP
  // ================================
  static async verifyOTP(req, res) {
    try {
      const { otp, newPassword } = req.body;

      const user = await User.findById(req.user._id);

      if (user.otpCode !== otp)
        return res.json({ success: false, message: "Invalid OTP" });

      if (user.otpExpiry < Date.now())
        return res.json({ success: false, message: "OTP expired" });

      user.password = newPassword;
      user.otpCode = null;
      user.otpExpiry = null;
      await user.save();

      return res.json({
        success: true,
        message: "Password reset successfully"
      });

    } catch (err) {
      console.error("VERIFY OTP ERROR:", err);
      return res.json({ success: false, message: "Failed" });
    }
  }

  // ================================
  // UPDATE PROGRESS
  // ================================
  static async updateProgress(req, res) {
    try {
      const { progress } = req.body;

      const updated = await User.findByIdAndUpdate(
        req.user._id,
        { progress: Math.min(100, Math.max(0, Number(progress))) },
        { new: true }
      );

      return res.json({ success: true, progress: updated.progress });

    } catch (err) {
      console.error("UPDATE PROGRESS ERROR:", err);
      return res.json({ success: false });
    }
  }
}

module.exports = ClientController;
