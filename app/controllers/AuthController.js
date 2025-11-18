const User = require('../models/user');
const bcrypt = require('bcrypt');
const { sendMail } = require('../utils/mailer');
const logger = require('../utils/logger');     // <-- WINSTON LOGGER

class AuthController {

  // -----------------------------
  // LOGIN PAGE
  // -----------------------------
  static loginPage(req, res) {
    logger.info("Login page rendered");
    return res.render('auth/login');
  }

  // -----------------------------
  // LOGIN
  // -----------------------------
  static async login(req, res) {
    try {
      const { email, password } = req.body;

      logger.info("Login attempt", { email });

      if (!email || !password) {
        logger.warn("Login failed: Missing fields", { email });
        return res.render('auth/login', { error: "All fields are required" });
      }

      const user = await User.findOne({ email });
      if (!user) {
        logger.warn("Login failed: User not found", { email });
        return res.render('auth/login', { error: "Invalid email or password" });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        logger.warn("Login failed: Wrong password", { email });
        return res.render('auth/login', { error: 'Invalid email or password' });
      }

      // Success — Save session
      req.session.userId = user._id.toString();
      req.session.role = user.role;

      logger.info("Login successful", { userId: user._id, role: user.role });

      req.session.save(() => {
        if (user.role === 'admin') return res.redirect('/admin/dashboard');
        if (user.role === 'coach') return res.redirect('/coach/dashboard');
        if (user.role === 'user') return res.redirect('/client/dashboard');
      });

    } catch (err) {
      logger.error("Login Error", { error: err.message, stack: err.stack });
      return res.render('auth/login', { error: "Server error" });
    }
  }

  // -----------------------------
  // REGISTER PAGE
  // -----------------------------
  static registerPage(req, res) {
    logger.info("Register page rendered");
    return res.render("auth/register");
  }

  // -----------------------------
  // REGISTER
  // -----------------------------
  static async register(req, res) {
  try {
    const { name, email, password, role } = req.body;

    logger.info("Registration attempt", { email });

    if (!name || !email || !password) {
      logger.warn("Registration failed: Missing fields");
      return res.render("auth/register", { error: "All fields required" });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      logger.warn("Registration failed: Email already exists", { email });
      return res.render("auth/register", { error: "Email already registered" });
    }

    await User.create({
      name,
      email,
      password,
      role: role || "user",   // <-- NOW ROLE IS TAKEN FROM THE FORM
      isVerified: true
    });

    logger.info("User registered successfully", { email });

    return res.render("auth/login", { success: "Account created!" });

  } catch (err) {
    logger.error("Registration Error", { error: err.message });
    return res.render("auth/register", { error: "Server error" });
  }
}



  // -----------------------------
  // SEND OTP
  // -----------------------------
  static async sendOTP(req, res) {
    try {
      const { email } = req.body;

      logger.info("OTP generation request", { email });

      if (!email)
        return res.json({ success: false, message: "Email required" });

      const user = await User.findOne({ email });
      if (!user)
        return res.json({ success: false, message: "Email not found" });

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otpCode = otp;
      user.otpExpiry = Date.now() + 5 * 60 * 1000;
      await user.save();

      await sendMail(
        email,
        "NOWFit OTP Code",
        `<h2>${otp}</h2><p>Valid for 5 minutes.</p>`
      );

      logger.info("OTP sent successfully", { email });

      return res.json({ success: true, message: "OTP sent" });

    } catch (err) {
      logger.error("OTP Send Error", { error: err.message });
      return res.json({ success: false, message: "Server error" });
    }
  }

  // -----------------------------
  // RESET PASSWORD
  // -----------------------------
  static async resetPassword(req, res) {
    try {
      const { email, otp, newPassword } = req.body;

      logger.info("Password reset request", { email });

      const user = await User.findOne({ email });
      if (!user)
        return res.json({ success: false, message: "User not found" });

      if (user.otpCode !== otp) {
        logger.warn("Password reset failed: Wrong OTP", { email });
        return res.json({ success: false, message: "Invalid OTP" });
      }

      if (user.otpExpiry < Date.now()) {
        logger.warn("Password reset failed: OTP expired", { email });
        return res.json({ success: false, message: "OTP expired" });
      }

      user.password = newPassword;
      user.otpCode = null;
      user.otpExpiry = null;
      await user.save();

      logger.info("Password reset successful", { email });

      return res.json({ success: true, message: "Password reset successful" });

    } catch (err) {
      logger.error("Password Reset Error", { error: err.message });
      return res.json({ success: false, message: "Server error" });
    }
  }

  // -----------------------------
  // LOGOUT
  // -----------------------------
  static logout(req, res) {
    logger.info("User logged out", { userId: req.session.userId });

    req.session.destroy(() => res.redirect("/auth/login"));
  }
}

module.exports = AuthController;
