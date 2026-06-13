const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const Room = require("../models/Room");
const Settlement = require("../models/Settlement");
const Notification = require("../models/Notification");
const User = require("../models/User");
const detectCategory = require("../utils/category");
const { isRoomMember } = require("../middleware/roomAuthMiddleware");

const findExpenseNotification = async (expense) => {
  const linked = await Notification.findOne({
    type: "expense",
    $or: [
      { expenseId: expense._id },
      { relatedId: expense._id }
    ]
  });
  if (linked) return linked;

  const timeWindow = 10000;
  return Notification.findOne({
    roomId: expense.roomId,
    type: "expense",
    createdBy: expense.paidBy,
    createdAt: {
      $gte: new Date(expense.createdAt.getTime() - timeWindow),
      $lte: new Date(expense.createdAt.getTime() + timeWindow)
    }
  }).sort({ createdAt: 1 });
};

const findExpenseSettlement = async (expense, room) => {
  const linked = await Settlement.findOne({
    $or: [
      { expenseId: expense._id },
      { relatedExpenseId: expense._id }
    ]
  });

  if (linked) {
    return { settlement: linked, isAggregate: false };
  }

  const aggregate = await Settlement.findOne({
    roomId: expense.roomId,
    fromUser: room.admin,
    toUser: expense.paidBy,
    status: "pending",
    relatedExpenseId: null
  }).sort({ createdAt: 1 });

  return { settlement: aggregate, isAggregate: Boolean(aggregate) };
};

const emitExpenseRelationsChanged = (req, roomId) => {
  const io = req.app.get("io");
  io.to(roomId.toString()).emit("alert-resolved");
  io.to(roomId.toString()).emit("expenses-updated");
  io.to(roomId.toString()).emit("settlements-updated");
};

const attachSettlements = async (roomId, expenses) => {
  const expenseIds = expenses.map((expense) => expense._id);
  const settlements = await Settlement.find({
    roomId,
    $or: [
      { expenseId: { $in: expenseIds } },
      { relatedExpenseId: { $in: expenseIds } }
    ]
  });
  const byExpenseId = new Map();

  settlements.forEach((settlement) => {
    const id = settlement.expenseId || settlement.relatedExpenseId;
    if (id) byExpenseId.set(id.toString(), settlement);
  });

  return expenses.map((expense) => ({
    ...expense.toObject(),
    settlement: byExpenseId.get(expense._id.toString()) || null
  }));
};

exports.updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { title, amount, category } = req.body;
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const room = await Room.findById(expense.roomId);
    const isAdmin = room.admin.toString() === req.user.id;
    const isOwner = expense.paidBy.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const nextAmount = Number(amount ?? expense.amount);
    if (!nextAmount || nextAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0"
      });
    }

    const isMemberExpense = room.admin.toString() !== expense.paidBy.toString();

    if (isMemberExpense) {
      const { settlement } = await findExpenseSettlement(
        expense,
        room
      );

      if (settlement && settlement.status !== "pending") {
        return res.status(403).json({
          message: "Cannot edit approved expense"
        });
      }

      if (settlement) {
        settlement.amount = nextAmount;
        settlement.expenseId = expense._id;
        settlement.relatedExpenseId = expense._id;
        await settlement.save();
      }

      const notification = await findExpenseNotification(expense);
      if (notification) {
        const payer = await User.findById(expense.paidBy);
        notification.expenseId = expense._id;
        notification.relatedId = expense._id;
        notification.message =
          `${payer?.name || "Member"} added ₹${nextAmount}`;
        await notification.save();
      }
    }

    expense.title = title || expense.title;
    expense.amount = nextAmount;
    expense.category = category || expense.category;
    await expense.save();

    emitExpenseRelationsChanged(req, expense.roomId);
    res.json({ message: "Expense updated", expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findById(expenseId);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    const room = await Room.findById(expense.roomId);
    const isAdmin = room.admin.toString() === req.user.id;
    const isOwner = expense.paidBy.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const isMemberExpense = room.admin.toString() !== expense.paidBy.toString();

    if (isMemberExpense) {
      const { settlement } = await findExpenseSettlement(
        expense,
        room
      );

      if (settlement && settlement.status !== "pending") {
        return res.status(403).json({
          message: "Cannot delete approved expense"
        });
      }

      if (settlement) {
        if (settlement.amount > expense.amount) {
          settlement.amount -= expense.amount;
          await settlement.save();
        } else {
          await settlement.deleteOne();
        }
      }

      await Notification.deleteMany({
        type: "expense",
        $or: [
          { expenseId: expense._id },
          { relatedId: expense._id }
        ]
      });
    }

    await expense.deleteOne();
    emitExpenseRelationsChanged(req, expense.roomId);
    res.json({ message: "Expense deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { roomId } = req.params;
    const expenses = await Expense.find({ roomId }).sort({ createdAt: -1 });
    res.json({ expenses: await attachSettlements(roomId, expenses) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.searchExpenses = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { keyword = "" } = req.query;
    const expenses = await Expense.find({
      roomId,
      title: { $regex: keyword, $options: "i" }
    }).sort({ createdAt: -1 });

    res.json({ expenses: await attachSettlements(roomId, expenses) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addExpense = async (req, res) => {
  try {
    const { roomId, title, amount, category } = req.body;
    const expenseAmount = Number(amount);

    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({ message: "Invalid Room ID" });
    }

    if (!expenseAmount || expenseAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0"
      });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (!isRoomMember(room, req.user.id)) {
      return res.status(403).json({ message: "Room access denied" });
    }

    const expense = await Expense.create({
      roomId,
      title,
      amount: expenseAmount,
      category: category || detectCategory(title),
      paidBy: req.user.id,
      month: new Date().toISOString().slice(0, 7)
    });

    const isAdmin = room.admin.toString() === req.user.id;

    if (!isAdmin) {
      const currentUser = await User.findById(req.user.id);

      await Notification.create({
        roomId,
        type: "expense",
        message:
          `${currentUser.name} added ₹${expenseAmount}`,
        createdBy: req.user.id,
        expenseId: expense._id,
        relatedId: expense._id
      });

      await Settlement.create({
        roomId,
        fromUser: room.admin,
        toUser: req.user.id,
        amount: expenseAmount,
        expenseId: expense._id,
        relatedExpenseId: expense._id
      });

      req.app.get("io").to(roomId.toString()).emit("new-alert");
      req.app.get("io").to(roomId.toString()).emit("settlements-updated");
    }

    req.app.get("io").to(roomId.toString()).emit("expenses-updated");
    res.json({ message: "Expense added", expense });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
