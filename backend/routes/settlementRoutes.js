const express = require("express");
const router = express.Router();

const { getSettlements, markAsPaid,allowMemberSettle,waiveSettlement  } = require("../controllers/settlementController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRoomMember } = require("../middleware/roomAuthMiddleware");

// ✅ FIRST: specific routes
router.post("/pay", authMiddleware, markAsPaid);
router.post("/allow", authMiddleware, allowMemberSettle);
router.get("/room/:roomId", authMiddleware, requireRoomMember, getSettlements);
router.post("/waive", authMiddleware, waiveSettlement); 

module.exports = router;
