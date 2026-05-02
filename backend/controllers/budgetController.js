const Budget = require("../models/Budget");
const Room = require("../models/Room");

// CREATE MONTHLY BUDGET
exports.createBudget = async (req, res) => {
  try {
    const { roomId, contribution } = req.body;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // only admin can set budget
    if (room.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only admin can set budget" });
    }

    const totalMembers = room.members.length;

    const baseBudget = totalMembers * contribution;

    const month = new Date().toISOString().slice(0, 7); // "YYYY-MM"

    const existing = await Budget.findOne({ roomId, month });
    if (existing) {
      return res.status(400).json({ message: "Budget already created for this month" });
    }

    const budget = new Budget({
      roomId,
      month,
      totalMembers,
      contributionPerPerson: contribution,
      baseBudget
    });

    await budget.save();

    res.json({
      message: "Budget created successfully",
      budget
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const TopUp = require("../models/TopUp");

// ADD TOP-UP
exports.addTopUp = async (req, res) => {
  try {
    const { roomId, amountPerPerson } = req.body;

    const room = await Room.findById(roomId);

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // only admin
    if (room.admin.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only admin can add top-up" });
    }

    const totalMembers = room.members.length;

    const totalAmount = totalMembers * amountPerPerson;

    const month = new Date().toISOString().slice(0, 7);

    const topUp = new TopUp({
      roomId,
      month,
      amountPerPerson,
      totalAmount,
      createdBy: req.user.id
    });

    await topUp.save();

    res.json({
      message: "Top-up added successfully",
      topUp
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const Expense = require("../models/Expense");

// GET FINAL BALANCE
exports.getBalance = async (req, res) => {
  try {
    const { roomId } = req.params;

    const month = new Date().toISOString().slice(0, 7);

    // get budget
    const budget = await Budget.findOne({ roomId, month });

    if (!budget) {
      return res.status(404).json({ message: "Budget not found" });
    }

    // get top-ups
    const topUps = await TopUp.find({ roomId, month });

    const totalTopUp = topUps.reduce((sum, t) => sum + t.totalAmount, 0);

    // get expenses
    const expenses = await Expense.find({ roomId, month });

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

    const finalBalance =
      budget.baseBudget +
      totalTopUp +
      budget.carryForward -
      totalExpense;

    res.json({
      baseBudget: budget.baseBudget,
      totalTopUp,
      totalExpense,
      carryForward: budget.carryForward,
      finalBalance
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};