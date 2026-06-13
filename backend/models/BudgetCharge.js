const mongoose = require("mongoose");

const budgetChargeSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    budgetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Budget",
      required: true
    },
    month: {
      type: String,
      required: true
    },
    fromDate: {
      type: Date,
      required: true
    },
    toDate: {
      type: Date,
      required: true
    },
    daysCharged: {
      type: Number,
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    reason: {
      type: String,
      enum: ["full_month", "joined_mid_month", "left_mid_month", "custom_period"],
      default: "full_month"
    }
  },
  { timestamps: true }
);

budgetChargeSchema.index(
  { roomId: 1, userId: 1, month: 1 },
  { unique: true }
);
budgetChargeSchema.index({ roomId: 1, month: 1 });

module.exports = mongoose.model("BudgetCharge", budgetChargeSchema);
