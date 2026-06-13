const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { requireRoomMember } = require("../middleware/roomAuthMiddleware");

const {
  getNotifications,
  resolveNotification
} = require("../controllers/notificationController");

router.get(
  "/:roomId",
  authMiddleware,
  requireRoomMember,
  getNotifications
);

router.put(
  "/resolve/:id",
  authMiddleware,
  resolveNotification
);

module.exports = router;
