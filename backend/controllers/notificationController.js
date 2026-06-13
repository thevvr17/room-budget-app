const Notification = require("../models/Notification");
const Settlement = require("../models/Settlement");

exports.getNotifications = async (req, res) => {
  try {
    const { roomId } = req.params;

    const notifications =
      await Notification.find({ roomId })
        .populate("createdBy", "name")
        .populate("resolvedBy", "name")
        .sort({ createdAt: -1 });

    res.json({ notifications });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};


const Room = require("../models/Room");

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
