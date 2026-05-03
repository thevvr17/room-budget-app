const express = require("express");
const router = express.Router();

const {
  addExpense,
  updateExpense,
  deleteExpense,
  searchExpenses
} = require("../controllers/expenseController");
const authMiddleware = require("../middleware/authMiddleware");

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
  "/search/:roomId",
  authMiddleware,
  searchExpenses
);
module.exports = router;