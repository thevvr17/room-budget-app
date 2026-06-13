const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],
  monthlyContributionPerPerson: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);
