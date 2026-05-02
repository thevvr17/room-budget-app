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
  status: {
    type: String,
    enum: ["pending", "paid"],
    default: "pending"
  },
  canMemberSettle: {
  type: Boolean,
  default: false
},
status: {
  type: String,
  enum: ["pending", "paid", "waived"],
  default: "pending"
}
}, { timestamps: true });

module.exports = mongoose.model("Settlement", settlementSchema);