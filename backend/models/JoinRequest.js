const mongoose = require("mongoose");

const joinRequestSchema = new mongoose.Schema(
{
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room"
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending"
  }
},
{ timestamps: true }
);

module.exports = mongoose.model(
  "JoinRequest",
  joinRequestSchema
);