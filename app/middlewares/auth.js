const User = require('../models/user');

exports.requireAuth = async (req, res, next) => {
  try {
    if (!req.session || !req.session.userId) {
      return res.redirect('/auth/login');
    }

    // If userId accidentally becomes "client", "coach", "admin", "dashboard"
    const invalid = ["client", "coach", "admin", "dashboard"];
    if (invalid.includes(req.session.userId)) {
      req.session.destroy(() => {});
      return res.redirect('/auth/login');
    }

    const user = await User.findById(req.session.userId).lean();

    if (!user) {
      req.session.destroy(() => {});
      return res.redirect('/auth/login');
    }

    req.user = user;
    next();

  } catch (err) {
    console.error("AUTH ERROR:", err);
    return res.redirect('/auth/login');
  }
};


exports.permit = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.redirect('/auth/login');

    if (!roles.includes(req.user.role)) {
      return res.status(403).send("Forbidden");
    }
    next();
  };
};
