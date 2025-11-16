const User = require('../models/user');
const Workout = require('../models/workout');
const Diet = require('../models/diet');
const { sendMail } = require('../utils/mailer');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const cloudinary = require('../utils/cloudinary');

class AdminController {

  // ---------------- Dashboard ----------------
  static async dashboard(req, res) {
    try {
      const stats = {
        totalUsers: await User.countDocuments({ role: "user" }),
        totalCoaches: await User.countDocuments({ role: "coach" }),
        totalWorkouts: await Workout.countDocuments(),
        totalDiets: await Diet.countDocuments()
      };

      const users = await User.find({ role: "user" })
        .populate("coachAssigned", "name email")
        .sort({ createdAt: -1 })
        .lean();

      return res.render("admin/dashboard", {
        users,
        stats,
        admin: req.user
      });

    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }

  // ---------------- Profile Page ----------------
  static async profilePage(req, res) {
    return res.render("admin/profile", { admin: req.user });
  }

  // ---------------- Update Profile (AJAX) ----------------
  static async updateProfile(req, res) {
    try {
      let profileImage = req.user.profileImage;

      if (req.file) {
        const uploaded = await cloudinary.uploader.upload(req.file.path);
        profileImage = uploaded.secure_url;
      }

      await User.findByIdAndUpdate(req.user._id, {
        name: req.body.name,
        email: req.body.email,
        profileImage
      });

      return res.json({
        success: true,
        message: "Profile updated successfully"
      });

    } catch (err) {
      console.error(err);
      return res.json({
        success: false,
        message: "Server error"
      });
    }
  }

  // ---------------- Change Password (AJAX) ----------------
  static async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const admin = await User.findById(req.user._id);

      const isMatch = await bcrypt.compare(oldPassword, admin.password);
      if (!isMatch) {
        return res.json({
          success: false,
          message: "Old password is incorrect"
        });
      }

      admin.password = newPassword;
      await admin.save();

      return res.json({
        success: true,
        message: "Password changed successfully"
      });

    } catch (err) {
      console.error(err);
      return res.json({
        success: false,
        message: "Server error"
      });
    }
  }

  // ---------------- Send OTP (AJAX) ----------------
  static async forgotPasswordSendOTP(req, res) {
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      await User.findByIdAndUpdate(req.user._id, {
        otpCode: otp,
        otpExpiry: Date.now() + 5 * 60 * 1000
      });

      await sendMail(req.user.email, "Your NOWFit OTP", `
        <h2>${otp}</h2>
        <p>OTP valid for 5 minutes.</p>
      `);

      return res.json({
        success: true,
        message: "OTP sent to your email"
      });

    } catch (err) {
      console.error(err);
      return res.json({
        success: false,
        message: "Failed to send OTP"
      });
    }
  }

  // ---------------- Verify OTP (AJAX) ----------------
  static async forgotPasswordVerifyOTP(req, res) {
    try {
      const { otp, newPassword } = req.body;
      const admin = await User.findById(req.user._id);

      if (!admin.otpCode) {
        return res.json({
          success: false,
          message: "No OTP requested"
        });
      }

      if (admin.otpCode !== otp) {
        return res.json({
          success: false,
          message: "Invalid OTP"
        });
      }

      if (admin.otpExpiry < Date.now()) {
        return res.json({
          success: false,
          message: "OTP has expired"
        });
      }

      admin.password = newPassword;
      admin.otpCode = null;
      admin.otpExpiry = null;
      await admin.save();

      return res.json({
        success: true,
        message: "Password reset successfully"
      });

    } catch (err) {
      console.error(err);
      return res.json({
        success: false,
        message: "Server error"
      });
    }
  }

  // ---------------- Create User ----------------
  static async createUser(req, res) {
  try {
    const { name, email, role } = req.body;

    // Check email
    const exists = await User.findOne({ email });
    if (exists) {
      return res.json({
        success: false,
        message: "Email already exists"
      });
    }

    // Generate random password
    const plainPassword = crypto.randomBytes(4).toString("hex");

    // Create user with plaintext password
    // Hashing will happen in pre('save')
    const newUser = new User({
      name,
      email,
      role,
      password: plainPassword,
      isVerified: true
    });

    await newUser.save(); // <-- ensures hashing happens

    // Send email (non-blocking)
    const loginUrl = `${process.env.BASE_URL}/auth/login`;

    sendMail(
      email,
      "NOWFit Credentials",
      `
        <p>Welcome to NOWFit!</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Password:</strong> ${plainPassword}</p>
        <p>Please login and update your password.</p>
        <a href="${loginUrl}">Login Here</a>
      `
    ).catch(err => console.log("MAIL ERROR:", err));

    return res.json({
      success: true,
      message: "User/Coach created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (err) {
    console.error("CREATE USER ERROR:", err);
    return res.json({
      success: false,
      message: "Server error while creating user"
    });
  }
}


  // ---------------- Edit User ----------------
  static async editUser(req, res) {
    try {
      const { name, email } = req.body;

      const exists = await User.findOne({
        email,
        _id: { $ne: req.params.id }
      });
      if (exists)
        return res.json({
          success: false,
          message: "Email already in use"
        });

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { name, email },
        { new: true }
      );

      return res.json({ success: true, user });

    } catch (err) {
      console.error(err);
      return res.json({ success: false });
    }
  }

  // ---------------- Delete User ----------------
  static async deleteUser(req, res) {
    try {
      await User.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.json({ success: false });
    }
  }

  // ---------------- Assign Coach ----------------
  static async assignCoach(req, res) {
    try {
      const coach = await User.findOne({
        _id: req.body.coachId,
        role: "coach"
      });

      if (!coach)
        return res.json({
          success: false,
          message: "Coach not found"
        });

      await User.findByIdAndUpdate(req.params.id, {
        coachAssigned: coach._id
      });

      return res.json({ success: true, coach });

    } catch (err) {
      console.error(err);
      return res.json({ success: false });
    }
  }

  // ---------------- Remove Coach ----------------
  static async removeCoach(req, res) {
    try {
      await User.findByIdAndUpdate(req.params.id, { coachAssigned: null });
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.json({ success: false });
    }
  }

  // ---------------- Coaches page ----------------
  static async coachesList(req, res) {
    try {
      const coaches = await User.find({ role: "coach" }).lean();
      return res.render("admin/coaches", { coaches, admin: req.user });
    } catch (err) {
      console.error(err);
      res.status(500).send("Server Error");
    }
  }

  // ---------------- Coaches data (AJAX) ----------------
  static async coachesData(req, res) {
    try {
      const coaches = await User.find({ role: "coach" })
        .select("name email")
        .lean();

      return res.json({ coaches });
    } catch (err) {
      console.error(err);
      return res.json({ coaches: [] });
    }
  }

  // ---------------- Edit Coach ----------------
  static async editCoach(req, res) {
    try {
      const { name, email } = req.body;

      const exists = await User.findOne({
        email,
        _id: { $ne: req.params.id }
      });

      if (exists)
        return res.json({
          success: false,
          message: "Email already in use"
        });

      const coach = await User.findByIdAndUpdate(
        req.params.id,
        { name, email },
        { new: true }
      );

      return res.json({ success: true, coach });

    } catch (err) {
      console.error(err);
      return res.json({ success: false });
    }
  }

  // ---------------- Delete Coach ----------------
  static async deleteCoach(req, res) {
    try {
      await User.findByIdAndDelete(req.params.id);
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.json({ success: false });
    }
  }
}

module.exports = AdminController;
