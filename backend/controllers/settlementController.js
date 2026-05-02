const Settlement = require("../models/Settlement");

// GET SETTLEMENTS
exports.getSettlements = async (req, res) => {
  try {
    const { roomId } = req.params;

    const settlements = await Settlement.find({ roomId })
      .populate("fromUser", "name")
      .populate("toUser", "name");

    res.json({ settlements });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// MARK AS PAID
exports.markAsPaid = async (req, res) => {
  try {
    const { settlementId } = req.body;

    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      return res.status(404).json({ message: "Settlement not found" });
    }

    // CASE 1: Admin marking
    if (settlement.fromUser.toString() === req.user.id) {
      settlement.status = "paid";
      await settlement.save();

      return res.json({
        message: "Settlement marked as paid by admin",
        settlement
      });
    }

    // CASE 2: Member marking (only if allowed)
    if (
      settlement.toUser.toString() === req.user.id &&
      settlement.canMemberSettle
    ) {
      settlement.status = "paid";
      await settlement.save();

      return res.json({
        message: "Settlement marked as paid by member",
        settlement
      });
    }

    // OTHERWISE
    return res.status(403).json({
      message: "Not authorized to mark this settlement"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.allowMemberSettle = async (req, res) => {
  try {
    const { settlementId } = req.body;

    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      return res.status(404).json({ message: "Settlement not found" });
    }

    // only admin can allow
    if (settlement.fromUser.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only admin can allow this" });
    }

    settlement.canMemberSettle = true;
    await settlement.save();

    res.json({
      message: "Member can now mark settlement",
      settlement
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.waiveSettlement = async (req, res) => {
  try {
    const { settlementId } = req.body;

    const settlement = await Settlement.findById(settlementId);

    if (!settlement) {
      return res.status(404).json({ message: "Settlement not found" });
    }

    // admin OR allowed member
    if (
      settlement.fromUser.toString() === req.user.id ||
      (settlement.toUser.toString() === req.user.id &&
        settlement.canMemberSettle)
    ) {
      settlement.status = "waived";
      await settlement.save();

      return res.json({
        message: "Settlement waived",
        settlement
      });
    }

    return res.status(403).json({
      message: "Not authorized to waive"
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};