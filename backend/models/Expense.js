const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room"
  },
  title: String,
  amount: Number,
  category: String,
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  month: String
}, { timestamps: true });

module.exports = mongoose.model("Expense", expenseSchema);