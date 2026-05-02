const mongoose = require("mongoose");

const budgetSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room"
  },
  month: String, // "2026-04"
  totalMembers: Number,
  contributionPerPerson: Number,
  baseBudget: Number,
  carryForward: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Budget", budgetSchema);