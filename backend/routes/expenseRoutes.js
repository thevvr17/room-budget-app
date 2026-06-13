const express = require("express");
const router = express.Router();

const {
  addExpense,
  updateExpense,
  deleteExpense,
  searchExpenses,
  getExpenses
} = require("../controllers/expenseController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRoomMember } = require("../middleware/roomAuthMiddleware");

router.post("/add", authMiddleware, addExpense);

router.put(
  "/update/:expenseId",
  authMiddleware,
  updateExpense
);

router.delete(
  "/delete/:expenseId",
  authMiddleware,
  deleteExpense
);

router.get(
  "/room/:roomId",
  authMiddleware,
  requireRoomMember,
  getExpenses
);

router.get(
  "/search/:roomId",
  authMiddleware,
  requireRoomMember,
  searchExpenses
);
module.exports = router;
