const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },

    type: {
      type: String,
      default: "general"
    },

    message: {
      type: String,
      required: true
    },

    status: {
      type: String,
      default: "active"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    resolvedAt: {
      type: Date,
      default: null
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },

    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);
