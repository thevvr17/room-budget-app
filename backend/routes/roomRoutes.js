const express = require("express");
const router = express.Router();

const { createRoom } = require("../controllers/roomController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRoomMember } = require("../middleware/roomAuthMiddleware");
const { addMember } = require("../controllers/roomController");
const {
  getRoom,
  leaveRoom,
  getLeaveRequestStatus
} = require("../controllers/roomController");
const { joinRequest } = require("../controllers/roomController");
router.get("/:roomId", authMiddleware, requireRoomMember, getRoom);

router.post("/add-member", authMiddleware, addMember);

router.post("/create", authMiddleware, createRoom);
router.post("/leave", authMiddleware, requireRoomMember, leaveRoom);
router.get(
  "/leave-request/:roomId",
  authMiddleware,
  requireRoomMember,
  getLeaveRequestStatus
);
router.post(
  "/join-request",
  authMiddleware,
  joinRequest
);
module.exports = router;
