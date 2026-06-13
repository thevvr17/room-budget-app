const express = require("express");
const router = express.Router();

const { getDashboard } = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRoomMember } = require("../middleware/roomAuthMiddleware");

router.get("/:roomId", authMiddleware, requireRoomMember, getDashboard);

module.exports = router;
