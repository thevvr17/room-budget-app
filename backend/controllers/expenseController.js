const Expense = require("../models/Expense");
const detectCategory = require("../utils/category");

// ==============================
// UPDATE EXPENSE
// ==============================
exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { title, amount, category } = req.body;

    const Room = require("../models/Room");

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    const room = await Room.findById(expense.roomId);

    const isAdmin =
      room.admin.toString() === req.user.id;

    const isOwner =
      expense.paidBy.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message: "Not allowed"
      });
    }

    expense.title = title || expense.title;
    expense.amount =
      amount || expense.amount;
    expense.category =
      category || expense.category;

    await expense.save();

    res.json({
      message: "Expense updated",
      expense
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

// ==============================
// DELETE EXPENSE
// ==============================
exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;

    const Room = require("../models/Room");

    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({
        message: "Expense not found"
      });
    }

    const room = await Room.findById(expense.roomId);

    const isAdmin =
      room.admin.toString() === req.user.id;

    const isOwner =
      expense.paidBy.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        message: "Not allowed"
      });
    }

    await expense.deleteOne();

    res.json({
      message: "Expense deleted"
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

// ==============================
// SEARCH EXPENSES
// ==============================
exports.searchExpenses = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { keyword } = req.query;

    const expenses = await Expense.find({
      roomId,
      title: {
        $regex: keyword,
        $options: "i"
      }
    }).sort({ createdAt: -1 });

    res.json({
      expenses
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
// ADD EXPENSE
exports.addExpense = async (req, res) => {
  try {
    const { roomId, title, amount, category } = req.body;

    const finalCategory = category || detectCategory(title);

    const month = new Date().toISOString().slice(0, 7);

    const Room = require("../models/Room");
    const Settlement = require("../models/Settlement");

    const expense = new Expense({
      roomId,
      title,
      amount,
      category: finalCategory,
      paidBy: req.user.id,
      month
    });

    await expense.save();

    // check if paid by admin
    const room = await Room.findById(roomId);

    if (room.admin.toString() !== req.user.id) {
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
    res.status(500).json({
      error: error.message
    });
  }
};