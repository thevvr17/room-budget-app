const Budget = require("../models/Budget");
const TopUp = require("../models/TopUp");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const Room = require("../models/Room");
const BudgetCharge = require("../models/BudgetCharge");
const { ensureMonthlyBudget } = require("../services/budgetService");

exports.getDashboard = async (req, res) => {
  try {
    const { roomId } = req.params;
    const mongoose = require("mongoose");

if (!mongoose.Types.ObjectId.isValid(roomId)) {
  return res.status(400).json({ message: "Invalid Room ID" });
}

    const month = new Date().toISOString().slice(0, 7);

    const room = await Room.findById(roomId);
    const { budget } = await ensureMonthlyBudget(room, month);
    const charges = await BudgetCharge.find({ roomId, month })
      .populate("userId", "name email")
      .sort({ amount: -1 });

    const topUps = await TopUp.find({ roomId, month });
    const expenses = await Expense.find({ roomId, month })
  .sort({ createdAt: -1 });
    await Settlement.deleteMany({
      roomId,
      status: "pending",
      relatedExpenseId: null
    });

    const settlements = await Settlement.find({ roomId });

    const totalTopUp = topUps.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
    const pendingDuesByUser = settlements
      .filter((settlement) =>
        settlement.status === "pending" && settlement.relatedExpenseId
      )
      .reduce((totals, settlement) => {
        const userId = settlement.toUser.toString();
        totals[userId] = (totals[userId] || 0) + settlement.amount;
        return totals;
      }, {});

    const finalBalance =
      (budget?.baseBudget || 0) +
      totalTopUp +
      (budget?.carryForward || 0) -
      totalExpense;
    if (budget) {
      budget.finalBalance = finalBalance;
      await budget.save();
    }
       const categoryStats = {};

expenses.forEach(e => {
  categoryStats[e.category] =
    (categoryStats[e.category] || 0) + e.amount;
});
    res.json({
      budget,
      charges,
      totalTopUp,
      totalExpense,
      finalBalance,
      settlements,
      pendingDuesByUser,
      categoryStats,
      expenses: expenses.slice(0, 5)
    });



  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

