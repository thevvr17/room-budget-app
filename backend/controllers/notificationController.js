const Notification = require("../models/Notification");
const Settlement = require("../models/Settlement");
const Room = require("../models/Room");

exports.getNotifications = async (req, res) => {
  try {
    const { roomId } = req.params;

    const notifications =
      await Notification.find({ roomId })
        .populate("createdBy", "name")
        .populate("toUser", "name")
        .populate("resolvedBy", "name")
        .sort({ createdAt: -1 });

    const formattedNotifications = notifications.map(notification => {
      const notifObj = notification.toObject ? notification.toObject() : notification;
      
      const requesterId = notifObj.createdBy?._id?.toString() || notifObj.createdBy?.toString();
      const requesterName = notifObj.createdBy?.name || "Someone";
      const targetUserId = notifObj.toUser?._id?.toString() || notifObj.toUser?.toString();
      const targetUserName = notifObj.toUser?.name || "Someone";
      const currentUserId = req.user.id;
      const adminId = req.room?.admin?.toString();

      if (notifObj.type === "leave_request") {
        if (currentUserId === adminId) {
          notifObj.message = `${requesterName} sent a leave request please clear all the dues and schedule the request date`;
        } else if (currentUserId === requesterId) {
          notifObj.message = `your leave request is sent for admin`;
        } else {
          notifObj.message = `${requesterName} sent leave request to admin`;
        }
      } else if (notifObj.type === "leave_approved") {
        if (currentUserId === targetUserId) {
          notifObj.message = `your leave request was approved`;
        } else {
          notifObj.message = `${targetUserName}'s leave request was approved`;
        }
      } else if (notifObj.type === "leave_cancelled") {
        if (currentUserId === targetUserId) {
          notifObj.message = `your leave request was cancelled`;
        } else {
          notifObj.message = `${targetUserName}'s leave request was cancelled`;
        }
      }
      return notifObj;
    });

    res.json({ notifications: formattedNotifications });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.resolveNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification =
      await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found"
      });
    }

    const room = await Room.findById(
      notification.roomId
    );

    if (
      room.admin.toString() !== req.user.id
    ) {
      return res.status(403).json({
        message: "Only admin can resolve alerts"
      });
    }

    notification.status = "resolved";
    notification.resolvedBy = req.user.id;
    notification.resolvedAt = new Date();

    await notification.save();

    const expenseId = notification.expenseId || notification.relatedId;

    if (notification.type === "expense" && expenseId) {
      await Settlement.findOneAndUpdate(
        {
          roomId: notification.roomId,
          $or: [
            { expenseId },
            { relatedExpenseId: expenseId }
          ],
          status: "pending"
        },
        { status: "paid" }
      );
    }

    // REALTIME UPDATE
    const io = req.app.get("io");

    io.to(notification.roomId.toString())
      .emit("alert-resolved");
    io.to(notification.roomId.toString())
      .emit("settlements-updated");

    res.json({
      message: "Resolved"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
