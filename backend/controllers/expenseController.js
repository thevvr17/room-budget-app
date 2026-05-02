const Expense = require("../models/Expense");
const detectCategory = require("../utils/category");

// ADD EXPENSE
exports.addExpense = async (req, res) => {
  try {
    const { roomId, title, amount } = req.body;

    const category = detectCategory(title);

    const month = new Date().toISOString().slice(0, 7);
      const Room = require("../models/Room");
      const Settlement = require("../models/Settlement");

    const expense = new Expense({
      roomId,
      title,
      amount,
      category,
      paidBy: req.user.id,
      month
    });

    await expense.save();
    // check if paid by admin
const room = await Room.findById(roomId);

if (room.admin.toString() !== req.user.id) {
  // create settlement (admin owes user)
  const settlement = new Settlement({
    roomId,
    fromUser: room.admin,
    toUser: req.user.id,
    amount
  });

  await settlement.save();
}

    res.json({
      message: "Expense added",
      expense
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};