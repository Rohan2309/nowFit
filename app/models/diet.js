const mongoose = require("mongoose");

const dietSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },

  // NEW FIELD — Foods list (comma separated in form, array in DB)
  foods: {
    type: [String],
    default: []
  },

  meals: [
    {
      meal: String,
      calories: Number,
      protein: Number,
      carbs: Number,
      fats: Number
    }
  ],

  // Manual calorie input (can be auto-calculated later)
  calories: { type: Number, required: true },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  }

}, { timestamps: true });

module.exports = mongoose.model("Diet", dietSchema);
