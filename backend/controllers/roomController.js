const Room = require("../models/Room");
const User = require("../models/User");
const mongoose = require("mongoose"); // ✅ MOVE HERE
const JoinRequest = require("../models/JoinRequest");
const Membership = require("../models/Membership");
const LeaveRequest = require("../models/LeaveRequest");
const Notification = require("../models/Notification");

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
        await Membership.create({
            roomId: room._id,
            userId: req.user.id,
            joinedAt: room.createdAt,
            status: "active"
        });
        await User.findByIdAndUpdate(req.user.id, { role: "admin" });

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

    const io = req.app.get("io");
    io.to(roomId.toString()).emit("join-request-created");

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
        await Membership.create({
            roomId: room._id,
            userId: user._id,
            joinedAt: new Date(),
            status: "active"
        });

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

    const memberships = await Membership.find({
      roomId,
      status: { $ne: "left" }
    });
    const membershipByUser = new Map(
      memberships.map((membership) => [
        membership.userId.toString(),
        membership
      ])
    );

    const roomData = room.toObject();
    roomData.members = roomData.members.map((member) => ({
      ...member,
      membership: membershipByUser.get(member._id.toString()) || null
    }));

    res.json({ room: roomData });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LEAVE ROOM
exports.leaveRoom = async (req, res) => {
  try {
    const { roomId, requestedLeavingAt } = req.body;
    const room = await Room.findById(roomId);

    if (!room || !room.members.some((id) => id.toString() === req.user.id)) {
      return res.status(403).json({ message: "Room access denied" });
    }

    if (room.admin.toString() === req.user.id) {
      return res.status(400).json({
        message: "The room admin cannot submit a leave request"
      });
    }

    const requestedDate = new Date(`${requestedLeavingAt}T00:00:00.000Z`);
    if (!requestedLeavingAt || Number.isNaN(requestedDate.getTime())) {
      return res.status(400).json({ message: "Choose your requested final day" });
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (requestedDate < today) {
      return res.status(400).json({
        message: "Requested final day cannot be in the past"
      });
    }

    const existing = await LeaveRequest.findOne({
      roomId,
      userId: req.user.id,
      status: { $in: ["pending", "scheduled"] }
    });

    if (existing) {
      return res.status(400).json({
        message: "Your leave request is already under review"
      });
    }

    const latestCancelled = await LeaveRequest.findOne({
      roomId,
      userId: req.user.id,
      status: "cancelled"
    }).sort({ updatedAt: -1 });

    if (latestCancelled) {
      const cooldownUntil = new Date(
        latestCancelled.updatedAt.getTime() + 2 * 24 * 60 * 60 * 1000
      );

      if (cooldownUntil > new Date()) {
        return res.status(400).json({
          message: "Leave requests are temporarily disabled after cancellation",
          cooldownUntil
        });
      }
    }

    const leaveRequest = await LeaveRequest.create({
      roomId,
      userId: req.user.id,
      requestedLeavingAt: requestedDate
    });

    await Notification.create({
      roomId,
      type: "leave_request",
      message: `Leave requested for ${requestedDate.toLocaleDateString("en-IN")}. Review dues and schedule the final day.`,
      createdBy: req.user.id,
      relatedId: leaveRequest._id
    });

    const io = req.app.get("io");
    io.to(roomId.toString()).emit("leave-request-updated");
    io.to(roomId.toString()).emit("new-alert");

    res.status(201).json({
      message: "Leave request sent to admin",
      leaveRequest
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaveRequestStatus = async (req, res) => {
  try {
    const { roomId } = req.params;
    const leaveRequest = await LeaveRequest.findOne({
      roomId,
      userId: req.user.id,
      status: { $in: ["pending", "scheduled"] }
    }).sort({ createdAt: -1 });

    const cancelled = await LeaveRequest.findOne({
      roomId,
      userId: req.user.id,
      status: "cancelled"
    }).sort({ updatedAt: -1 });

    let cooldownUntil = null;
    if (cancelled) {
      const until = new Date(
        cancelled.updatedAt.getTime() + 2 * 24 * 60 * 60 * 1000
      );
      if (until > new Date()) {
        cooldownUntil = until;
      }
    }

    res.json({ leaveRequest, cooldownUntil });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
