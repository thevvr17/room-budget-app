const Room = require("../models/Room");
const User = require("../models/User");
const mongoose = require("mongoose"); // ✅ MOVE HERE
const JoinRequest = require("../models/JoinRequest");

// CREATE ROOM
exports.createRoom = async (req, res) => {
    try {
        const { name } = req.body;

        const room = new Room({
            name,
            admin: req.user.id,
            members: [req.user.id]
        });

        await room.save();

        res.status(201).json({
            message: "Room created successfully",
            room
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
//join reuest 
exports.joinRequest = async (req, res) => {
  try {
    const { roomId } = req.body;

    const existing = await JoinRequest.findOne({
      roomId,
      userId: req.user.id,
      status: "pending"
    });

    if (existing) {
      return res.status(400).json({
        message: "Request already pending"
      });
    }

    const request = new JoinRequest({
      roomId,
      userId: req.user.id
    });

    await request.save();

    res.json({
      message: "Join request sent"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
// ADD MEMBER
exports.addMember = async (req, res) => {
    try {
        const { roomId, email } = req.body;

        // ✅ validation works now
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({ message: "Invalid Room ID" });
        }

        const room = await Room.findOne({
            _id: new mongoose.Types.ObjectId(roomId)
        });

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // check admin
        if (room.admin.toString() !== req.user.id) {
            return res.status(403).json({ message: "Only admin can add members" });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // safer check
        if (room.members.some(m => m.toString() === user._id.toString())) {
            return res.status(400).json({ message: "User already in room" });
        }

        room.members.push(user._id);
        await room.save();

        res.json({
            message: "Member added successfully",
            room
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET ROOM DETAILS
exports.getRoom = async (req, res) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findById(roomId)
      .populate("admin", "name email")
      .populate("members", "name email");

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    res.json({
      room
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const Settlement = require("../models/Settlement");

// LEAVE ROOM
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.body;

    const userId = req.user.id;

    // check pending settlements
    const pending = await Settlement.find({
      roomId,
      status: "pending",
      $or: [
        { fromUser: userId },
        { toUser: userId }
      ]
    });

    if (pending.length > 0) {
      return res.status(400).json({
        message: "You have pending settlements. Clear them before leaving."
      });
    }

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // remove user from members
    room.members = room.members.filter(
      m => m.toString() !== userId
    );

    await room.save();

    res.json({
      message: "Left room successfully"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};