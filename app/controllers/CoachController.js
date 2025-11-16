const User = require('../models/user');
const Diet = require('../models/diet');
const Workout = require('../models/workout');
const { sendMail } = require('../utils/mailer');
const bcrypt = require('bcrypt');
const cloudinary = require('../utils/cloudinary');

class CoachController {

  // ======================
  // DASHBOARD
  // ======================
  static async dashboard(req, res) {
    try {
      const coachId = req.session.userId;

      const totalUsers = await User.countDocuments({ coachAssigned: coachId });

      return res.render("coach/dashboard", {
        coach: req.user,
        totalUsers
      });

    } catch (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }
  }

  // ======================
  // ASSIGNED USERS + DIET + WORKOUT
  // ======================
  static async assignedUsers(req, res) {
    try {
      const coachId = req.session.userId;

      const users = await User.find({ coachAssigned: coachId })
        .select("name email progress")
        .lean();

      for (let u of users) {
        u.assignedDiet = await Diet.findOne({ assignedTo: u._id })
          .select("title")
          .lean();

        u.assignedWorkout = await Workout.findOne({ assignedTo: u._id })
          .select("title")
          .lean();
      }

      return res.render("coach/users", {
        coach: req.user,
        users
      });

    } catch (err) {
      console.error(err);
      return res.status(500).send("Server error");
    }
  }

  // ======================
  // PROFILE
  // ======================
  static async profilePage(req, res) {
    return res.render("coach/profile", {
      coach: req.user
    });
  }

  // ======================
  // UPDATE PROFILE
  // ======================
  static async updateProfile(req, res) {
    try {
      let profileImage = req.user.profileImage;

      if (req.file) {
        const uploaded = await cloudinary.uploader.upload(req.file.path);
        profileImage = uploaded.secure_url;
      }

      const updated = await User.findByIdAndUpdate(
        req.user._id,
        {
          name: req.body.name,
          email: req.body.email,
          profileImage
        },
        { new: true }
      );

      return res.json({ success: true, message: "Profile updated", user: updated });

    } catch (err) {
      console.error(err);
      return res.json({ success: false, message: "Update failed" });
    }
  }

  // ======================
  // CHANGE PASSWORD
  // ======================
  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;

      const coach = await User.findById(req.user._id);

      const match = await bcrypt.compare(oldPassword, coach.password);
      if (!match)
        return res.json({ success: false, message: "Incorrect old password" });

      coach.password = newPassword;
      await coach.save();

      return res.json({ success: true, message: "Password changed" });

    } catch (err) {
      console.error(err);
      return res.json({ success: false, message: "Server error" });
    }
  }

  // ======================
  // SEND OTP
  // ======================
  static async sendOTP(req, res) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const coach = await User.findById(req.user._id);
      coach.otpCode = otp;
      coach.otpExpiry = Date.now() + 5 * 60 * 1000;
      await coach.save();

      await sendMail(
        coach.email,
        "NOWFit OTP",
        `<h2>${otp}</h2><p>OTP valid for 5 minutes</p>`
      );

      return res.json({ success: true, message: "OTP sent to your email" });

    } catch (err) {
      console.error(err);
      return res.json({ success: false, message: "Failed to send OTP" });
    }
  }

  // ======================
  // VERIFY OTP + RESET PASSWORD
  // ======================
  static async verifyOTP(req, res) {
    try {
      const { otp, newPassword } = req.body;

      const coach = await User.findById(req.user._id);

      if (!coach) return res.json({ success: false, message: "Not found" });

      if (coach.otpCode !== otp)
        return res.json({ success: false, message: "Invalid OTP" });

      if (coach.otpExpiry < Date.now())
        return res.json({ success: false, message: "OTP expired" });

      coach.password = newPassword;
      coach.otpCode = null;
      coach.otpExpiry = null;

      await coach.save();

      return res.json({ success: true, message: "Password reset successfully" });

    } catch (err) {
      console.error(err);
      return res.json({ success: false, message: "Server error" });
    }
  }
}

module.exports = CoachController;
