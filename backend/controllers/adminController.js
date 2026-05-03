const Expense = require("../models/Expense");
const TopUp = require("../models/TopUp");
const Settlement = require("../models/Settlement");
const JoinRequest = require("../models/JoinRequest");
const Room = require("../models/Room");

exports.resetMonth = async (req, res) => {
  try {
    const { roomId } = req.body;

    const month = new Date().toISOString().slice(0, 7);
    if (req.user.role !== "admin") {
  return res.status(403).json({
    message: "Admin only"
  });
}

    await Expense.deleteMany({ roomId, month });

    await TopUp.deleteMany({ roomId, month });

    await Settlement.deleteMany({ roomId });

    res.json({
      message: "Current month data reset successfully"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const { roomId } = req.params;

    const requests = await JoinRequest.find({
      roomId,
      status: "pending"
    }).populate("userId", "name email");

    res.json({ requests });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    const request = await JoinRequest.findById(requestId);

    if (!request) {
      return res.status(404).json({
        message: "Request not found"
      });
    }

    const room = await Room.findById(request.roomId);

    room.members.push(request.userId);
    await room.save();

    request.status = "approved";
    await request.save();

    res.json({
      message: "Member approved"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.body;

    await JoinRequest.findByIdAndUpdate(
      requestId,
      { status: "rejected" }
    );

    res.json({
      message: "Request rejected"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};