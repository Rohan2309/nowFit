const User = require('../models/user');
const Diet = require('../models/diet');
const Workout = require('../models/workout');
const cloudinary = require('../utils/cloudinary');
const bcrypt = require('bcrypt');
const { sendMail } = require('../utils/mailer');

class UserController {

  // ------------------ DASHBOARD ------------------
  static async dashboard(req, res) {
    const userId = req.session.userId;

    const user = await User.findById(userId)
      .populate('coachAssigned')
      .lean();

    const diet = await Diet.findOne({ assignedTo: userId }).lean();
    const workout = await Workout.findOne({ assignedTo: userId }).lean();

    return res.render('client/dashboard', {
      user,
      coach: user.coachAssigned || null,
      diet,
      workout
    });
  }

  // ------------------ PROFILE PAGE ------------------
  static async profilePage(req, res) {
    const userId = req.session.userId;

    const user = await User.findById(userId)
      .populate('coachAssigned')
      .lean();

    const diet = await Diet.findOne({ assignedTo: userId }).lean();
    const workout = await Workout.findOne({ assignedTo: userId }).lean();

    return res.render('client/profile', {
      user,
      coach: user.coachAssigned || null,
      diet,
      workout
    });
  }

  // ------------------ UPDATE PROFILE ------------------
  static async updateProfile(req, res) {
    try {
      let profileImage = req.user.profileImage;

      if (req.file) {
        const save = await cloudinary.uploader.upload(req.file.path);
        profileImage = save.secure_url;
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
      console.log(err);
      return res.json({ success: false, message: "Failed to update profile" });
    }
  }

  // ------------------ CHANGE PASSWORD ------------------
  static async changePassword(req, res) {
    const user = await User.findById(req.user._id);
    const match = await bcrypt.compare(req.body.oldPassword, user.password);

    if (!match) return res.json({ success: false, message: "Incorrect old password" });

    user.password = req.body.newPassword;
    await user.save();

    return res.json({ success: true, message: "Password changed" });
  }

  // ------------------ SEND OTP ------------------
  static async sendOTP(req, res) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const user = await User.findById(req.user._id);
      user.otpCode = otp;
      user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 min
      await user.save();

      await sendMail(
        user.email,
        'Your NOWFit OTP',
        `<h2>${otp}</h2><p>Valid for 5 minutes</p>`
      );

      return res.json({ success: true, message: "OTP sent to your email" });

    } catch (err) {
      console.log(err);
      return res.json({ success: false, message: "Failed to send OTP" });
    }
  }

  // ------------------ VERIFY OTP ------------------
  static async verifyOTP(req, res) {
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

    return res.json({ success: true, message: "Password reset successful" });
  }

  // ------------------ UPDATE PROGRESS ------------------
  static async updateProgress(req, res) {
    const progress = req.body.progress;

    await User.findByIdAndUpdate(req.user._id, { progress });

    return res.json({ success: true, message: "Progress updated" });
  }

  // ------------------ DIET PAGE ------------------
  static async userDietPage(req, res) {
    const userId = req.session.userId;
    const diet = await Diet.findOne({ assignedTo: userId }).lean();

    return res.render("client/diet", { diet });
  }

  // ------------------ WORKOUT PAGE ------------------
  static async userWorkoutPage(req, res) {
    const userId = req.session.userId;
    const workout = await Workout.findOne({ assignedTo: userId }).lean();

    return res.render("client/workout", { workout });
  }
}

module.exports = UserController;
