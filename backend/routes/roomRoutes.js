const express = require("express");
const router = express.Router();

const { createRoom } = require("../controllers/roomController");
const authMiddleware = require("../middleware/authMiddleware");
const { addMember } = require("../controllers/roomController");
const { getRoom,leaveRoom  } = require("../controllers/roomController");
const { joinRequest } = require("../controllers/roomController");
router.get("/:roomId", authMiddleware, getRoom);

router.post("/add-member", authMiddleware, addMember);

router.post("/create", authMiddleware, createRoom);
router.post("/leave", authMiddleware, leaveRoom);
router.post(
  "/join-request",
  authMiddleware,
  joinRequest
);
module.exports = router;