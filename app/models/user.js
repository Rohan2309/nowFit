const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({

  // BASIC INFO
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },

  // AUTH
  password: { type: String, required: true },

  // ROLE
  role: {
    type: String,
    enum: ['admin', 'coach', 'user'],
    default: 'user'
  },

  // PROFILE IMAGES
  avatar: { type: String, default: '' },            // old field
  profileImage: { type: String, default: null },    // Cloudinary image

  // EMAIL VERIFICATION
  isVerified: { type: Boolean, default: false },

  // COACH ASSIGNMENT
  coachAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // DIET ASSIGNMENT
  assignedDiet: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Diet',
    default: null
  },

  // WORKOUT ASSIGNMENT
  assignedWorkout: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workout',
    default: null
  },

  // CLIENT PROGRESS
  progress: { type: Number, default: 0 },

  // OTP HANDLING
  otpCode: { type: String, default: null },
  otpExpiry: { type: Date, default: null },

  // CREATED AT
  createdAt: { type: Date, default: Date.now }
});


// ===============================
// PASSWORD HASH MIDDLEWARE
// ===============================
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);

  next();
});


// ===============================
// METHOD: COMPARE PASSWORD
// ===============================
userSchema.methods.comparePassword = function (plainPassword) {
  return bcrypt.compare(plainPassword, this.password);
};


module.exports = mongoose.model('User', userSchema);
