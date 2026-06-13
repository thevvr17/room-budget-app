const mongoose = require("mongoose");

const settlementSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room"
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  amount: Number,
  canMemberSettle: {
    type: Boolean,
    default: false
  },
  relatedExpenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    default: null
  },
  expenseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Expense",
    default: null
  },
  status: {
    type: String,
    enum: ["pending", "paid", "waived"],
    default: "pending"
  }
}, { timestamps: true });

settlementSchema.index({ relatedExpenseId: 1 });
settlementSchema.index({ expenseId: 1 });

module.exports = mongoose.model("Settlement", settlementSchema);
