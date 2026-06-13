const mongoose = require("mongoose");

const leaveRequestSchema = new mongoose.Schema(
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
    requestedLeavingAt: {
      type: Date,
      required: true
    },
    scheduledLeavingAt: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ["pending", "scheduled", "completed", "cancelled"],
      default: "pending"
    }
  },
  { timestamps: true }
);

leaveRequestSchema.index({ roomId: 1, userId: 1, status: 1 });

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
