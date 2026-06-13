const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
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
    joinedAt: {
      type: Date,
      default: Date.now
    },
    leavingAt: {
      type: Date,
      default: null
    },
    leftAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["active", "scheduled_leave", "left"],
      default: "active"
    }
  },
  { timestamps: true }
);

membershipSchema.index({ roomId: 1, userId: 1 });
membershipSchema.index({ roomId: 1, status: 1 });

module.exports = mongoose.model("Membership", membershipSchema);
