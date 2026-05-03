const Budget = require("../models/Budget");
const TopUp = require("../models/TopUp");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");

exports.getDashboard = async (req, res) => {
  try {
    const { roomId } = req.params;
    const mongoose = require("mongoose");

if (!mongoose.Types.ObjectId.isValid(roomId)) {
  return res.status(400).json({ message: "Invalid Room ID" });
}

    const month = new Date().toISOString().slice(0, 7);

    const budget = await Budget.findOne({ roomId, month });

    const topUps = await TopUp.find({ roomId, month });
    const expenses = await Expense.find({ roomId, month })
  .sort({ createdAt: -1 });
    const settlements = await Settlement.find({ roomId });

    const totalTopUp = topUps.reduce((sum, t) => sum + t.totalAmount, 0);
    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    const finalBalance =
      (budget?.baseBudget || 0) +
      totalTopUp +
      (budget?.carryForward || 0) -
      totalExpense;
       const categoryStats = {};

expenses.forEach(e => {
  categoryStats[e.category] =
    (categoryStats[e.category] || 0) + e.amount;
});
    res.json({
      budget,
      totalTopUp,
      totalExpense,
      finalBalance,
      settlements,
      categoryStats,
      expenses: expenses.slice(0, 5)
    });



  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

