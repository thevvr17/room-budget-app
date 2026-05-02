const mongoose = require("mongoose");

const topUpSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Room"
  },
  month: String,
  amountPerPerson: Number,
  totalAmount: Number,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

module.exports = mongoose.model("TopUp", topUpSchema);