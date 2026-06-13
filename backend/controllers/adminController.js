const Expense = require("../models/Expense");
const TopUp = require("../models/TopUp");
const Settlement = require("../models/Settlement");
const JoinRequest = require("../models/JoinRequest");
const Room = require("../models/Room");
const Membership = require("../models/Membership");
const LeaveRequest = require("../models/LeaveRequest");
const Notification = require("../models/Notification");
const { ensureMonthlyBudget } = require("../services/budgetService");

const isAdminForRoom = (room, userId) =>
  room && room.admin.toString() === userId;

exports.resetMonth = async (req, res) => {
  try {
    const { roomId } = req.body;
    const room = await Room.findById(roomId);

    const month = new Date().toISOString().slice(0, 7);
    const monthStart = new Date(`${month}-01T00:00:00.000Z`);
    const monthEnd = new Date(monthStart);
    monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);

    if (!isAdminForRoom(room, req.user.id)) {
      return res.status(403).json({ message: "Admin only" });
    }

    await Expense.deleteMany({ roomId, month });

    await TopUp.deleteMany({ roomId, month });

    await Settlement.deleteMany({ roomId });

    await Notification.deleteMany({
      roomId,
      type: "expense",
      createdAt: {
        $gte: monthStart,
        $lt: monthEnd
      }
    });

    req.app.get("io").to(roomId.toString()).emit("alert-resolved");
    req.app.get("io").to(roomId.toString()).emit("expenses-updated");
    req.app.get("io").to(roomId.toString()).emit("settlements-updated");

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
    const room = await Room.findById(roomId);

    if (!isAdminForRoom(room, req.user.id)) {
      return res.status(403).json({ message: "Admin only" });
    }

    const requests = await JoinRequest.find({
      roomId,
      status: "pending"
    }).populate("userId", "name email");

    const leaveRequests = await LeaveRequest.find({
      roomId,
      status: "pending"
    })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.json({ requests, leaveRequests });

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

    if (!isAdminForRoom(room, req.user.id)) {
      return res.status(403).json({ message: "Admin only" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already handled" });
    }

    if (!room.members.some((id) => id.toString() === request.userId.toString())) {
      room.members.push(request.userId);
    }
    await room.save();

    await Membership.findOneAndUpdate(
      {
        roomId: room._id,
        userId: request.userId,
        status: { $ne: "left" }
      },
      {
        $setOnInsert: {
          roomId: room._id,
          userId: request.userId,
          joinedAt: new Date()
        },
        $set: {
          status: "active",
          leavingAt: null,
          leftAt: null
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    request.status = "approved";
    await request.save();
    await ensureMonthlyBudget(room);

    const io = req.app.get("io");
    io.to(request.roomId.toString()).emit("join-request-updated");
    io.to(request.roomId.toString()).emit("members-updated");

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
    const pendingRequest = await JoinRequest.findById(requestId);

    if (!pendingRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    const room = await Room.findById(pendingRequest.roomId);
    if (!isAdminForRoom(room, req.user.id)) {
      return res.status(403).json({ message: "Admin only" });
    }

    const request = await JoinRequest.findByIdAndUpdate(
      requestId,
      { status: "rejected" },
      { new: true }
    );

    if (request) {
      const io = req.app.get("io");
      io.to(request.roomId.toString()).emit("join-request-updated");
    }

    res.json({
      message: "Request rejected"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.scheduleMemberLeave = async (req, res) => {
  try {
    const { roomId, userId, leavingAt } = req.body;
    const room = await Room.findById(roomId);

    if (!isAdminForRoom(room, req.user.id)) {
      return res.status(403).json({ message: "Admin only" });
    }

    if (room.admin.toString() === userId) {
      return res.status(400).json({ message: "The room admin cannot be removed" });
    }

    const leaveDate = new Date(`${leavingAt}T00:00:00.000Z`);
    if (!leavingAt || Number.isNaN(leaveDate.getTime())) {
      return res.status(400).json({ message: "Valid leaving date required" });
    }

    const membership = await Membership.findOne({
      roomId,
      userId,
      status: { $ne: "left" }
    });

    if (!membership) {
      return res.status(404).json({ message: "Active membership not found" });
    }

    if (leaveDate < membership.joinedAt) {
      return res.status(400).json({
        message: "Leaving date cannot be before joining date"
      });
    }

    membership.leavingAt = leaveDate;
    membership.status = "scheduled_leave";
    await membership.save();

    const leaveRequest = await LeaveRequest.findOneAndUpdate(
      {
        roomId,
        userId,
        status: "pending"
      },
      {
        status: "scheduled",
        scheduledLeavingAt: leaveDate
      },
      { new: true, sort: { createdAt: -1 } }
    );

    if (leaveRequest) {
      await Notification.findOneAndUpdate(
        {
          roomId,
          relatedId: leaveRequest._id,
          type: "leave_request",
          status: "active"
        },
        {
          status: "resolved",
          resolvedBy: req.user.id,
          resolvedAt: new Date()
        }
      );
    }

    await ensureMonthlyBudget(room);

    const io = req.app.get("io");
    io.to(roomId.toString()).emit("members-updated");
    io.to(roomId.toString()).emit("leave-request-updated");
    io.to(roomId.toString()).emit("alert-resolved");
    res.json({ message: "Leaving date scheduled", membership });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    const room = await Room.findById(roomId);

    if (!isAdminForRoom(room, req.user.id)) {
      return res.status(403).json({ message: "Admin only" });
    }

    if (room.admin.toString() === userId) {
      return res.status(400).json({ message: "The room admin cannot be removed" });
    }

    const membership = await Membership.findOne({
      roomId,
      userId,
      status: { $ne: "left" }
    });

    if (!membership) {
      return res.status(404).json({ message: "Active membership not found" });
    }

    if (membership.status !== "scheduled_leave" || !membership.leavingAt) {
      return res.status(400).json({
        message: "Schedule the member's final day before confirming removal"
      });
    }

    const pendingCount = await Settlement.countDocuments({
      roomId,
      status: "pending",
      $or: [{ fromUser: userId }, { toUser: userId }]
    });

    if (pendingCount > 0) {
      return res.status(400).json({
        message: "Clear all pending settlements before removing this member"
      });
    }

    const effectiveDate = membership.leavingAt;
    if (membership.leavingAt > new Date()) {
      return res.status(400).json({
        message: "The scheduled leaving date has not arrived yet"
      });
    }

    membership.leftAt = effectiveDate;
    membership.leavingAt = effectiveDate;
    membership.status = "left";
    await membership.save();

    await LeaveRequest.findOneAndUpdate(
      {
        roomId,
        userId,
        status: { $in: ["pending", "scheduled"] }
      },
      {
        status: "completed",
        scheduledLeavingAt: effectiveDate
      },
      { sort: { createdAt: -1 } }
    );

    room.members = room.members.filter((id) => id.toString() !== userId);
    await room.save();
    await ensureMonthlyBudget(room);

    const io = req.app.get("io");
    io.to(roomId.toString()).emit("members-updated");
    io.to(roomId.toString()).emit("leave-request-updated");
    res.json({ message: "Member removed successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelLeaveRequest = async (req, res) => {
  try {
    const { roomId, userId } = req.body;
    const room = await Room.findById(roomId);

    if (!isAdminForRoom(room, req.user.id)) {
      return res.status(403).json({ message: "Admin only" });
    }

    const leaveRequest = await LeaveRequest.findOne({
      roomId,
      userId,
      status: { $in: ["pending", "scheduled"] }
    }).sort({ createdAt: -1 });

    if (!leaveRequest) {
      return res.status(404).json({ message: "Active leave request not found" });
    }

    leaveRequest.status = "cancelled";
    leaveRequest.scheduledLeavingAt = null;
    await leaveRequest.save();

    const membership = await Membership.findOne({
      roomId,
      userId,
      status: "scheduled_leave"
    });

    if (membership) {
      membership.status = "active";
      membership.leavingAt = null;
      await membership.save();
      await ensureMonthlyBudget(room);
    }

    await Notification.findOneAndUpdate(
      {
        roomId,
        relatedId: leaveRequest._id,
        type: "leave_request",
        status: "active"
      },
      {
        status: "resolved",
        resolvedBy: req.user.id,
        resolvedAt: new Date()
      }
    );

    await Notification.create({
      roomId,
      type: "leave_cancelled",
      message: "Your leave request was cancelled",
      createdBy: req.user.id,
      toUser: userId,
      relatedId: leaveRequest._id
    });

    const io = req.app.get("io");
    io.to(roomId.toString()).emit("members-updated");
    io.to(roomId.toString()).emit("leave-request-updated");
    io.to(roomId.toString()).emit("alert-resolved");
    io.to(roomId.toString()).emit("new-alert");

    res.json({
      message: "Leave request cancelled",
      cooldownUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
