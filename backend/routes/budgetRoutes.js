const express = require("express");
const router = express.Router();

const { createBudget } = require("../controllers/budgetController");
const { addTopUp } = require("../controllers/budgetController");
const { getBalance } = require("../controllers/budgetController");


const authMiddleware = require("../middleware/authMiddleware");
const { requireRoomMember, requireRoomAdmin } = require("../middleware/roomAuthMiddleware");

router.post("/create", authMiddleware, requireRoomAdmin, createBudget);
router.post("/topup", authMiddleware, requireRoomAdmin, addTopUp);
router.get("/balance/:roomId", authMiddleware, requireRoomMember, getBalance);

module.exports = router;
