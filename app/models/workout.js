const mongoose = require("mongoose");

const workoutSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },

  level: {
    type: String,
    enum: ["Beginner", "Intermediate", "Advanced"],
    required: true,
  },

  exercises: [
    {
      name: String,
      sets: Number,
      reps: Number,
      rest: String,
    }
  ],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Workout", workoutSchema);
