const Budget = require("../models/Budget");
const BudgetCharge = require("../models/BudgetCharge");
const Membership = require("../models/Membership");

const getMonth = (date = new Date()) => date.toISOString().slice(0, 7);

const getMonthBounds = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);
  const monthIndex = monthNumber - 1;
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

  return { start, end, daysInMonth };
};

const getDateInMonth = (month, day) => {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber - 1, day));
};

const roundMoney = (amount) => Math.round(amount * 100) / 100;

const calculateCharge = (membership, contributionPerPerson, month) => {
  const { start, end, daysInMonth } = getMonthBounds(month);
  const joinedAt = membership.joinedAt || start;
  const exitAt = membership.leftAt || membership.leavingAt || end;

  if (joinedAt > end || exitAt < start) {
    return null;
  }

  const fromDate = joinedAt > start ? joinedAt : start;
  const toDate = exitAt < end ? exitAt : end;

  const fromDay = fromDate.getUTCDate();
  const toDay = toDate.getUTCDate();
  let daysCharged = toDay - fromDay + 1;

  // Product rule: joining on the 10th in a 30-day month means 20 billable days.
  if (fromDay > 1) {
    daysCharged -= 1;
  }

  if (daysCharged <= 0) {
    return null;
  }

  let reason = "full_month";
  if (fromDay > 1 && toDay < daysInMonth) {
    reason = "custom_period";
  } else if (fromDay > 1) {
    reason = "joined_mid_month";
  } else if (toDay < daysInMonth) {
    reason = "left_mid_month";
  }

  return {
    userId: membership.userId,
    fromDate: getDateInMonth(month, fromDay),
    toDate: getDateInMonth(month, toDay),
    daysCharged,
    amount: roundMoney((contributionPerPerson * daysCharged) / daysInMonth),
    reason
  };
};

const ensureMembershipsForRoom = async (room) => {
  const existing = await Membership.find({
    roomId: room._id,
    status: { $ne: "left" }
  });
  const existingUserIds = new Set(existing.map((membership) =>
    membership.userId.toString()
  ));
  const missingMembers = room.members.filter(
    (memberId) => !existingUserIds.has(memberId.toString())
  );

  if (missingMembers.length > 0) {
    await Membership.insertMany(
      missingMembers.map((memberId) => ({
        roomId: room._id,
        userId: memberId,
        joinedAt: room.createdAt || new Date(),
        status: "active"
      })),
      { ordered: false }
    ).catch(() => {});
  }
};

const ensureMonthlyBudget = async (room, month = getMonth()) => {
  if (!room.monthlyContributionPerPerson || room.monthlyContributionPerPerson <= 0) {
    return {
      budget: await Budget.findOne({ roomId: room._id, month }),
      charges: []
    };
  }

  await ensureMembershipsForRoom(room);

  const previousMonthDate = new Date(`${month}-01T00:00:00.000Z`);
  previousMonthDate.setUTCMonth(previousMonthDate.getUTCMonth() - 1);
  const previousMonth = getMonth(previousMonthDate);
  const previousBudget = await Budget.findOne({
    roomId: room._id,
    month: previousMonth
  });

  let carryForward = 0;
  if (previousBudget) {
    carryForward = previousBudget.finalBalance ?? previousBudget.carryForward ?? 0;
  }

  let budget = await Budget.findOne({ roomId: room._id, month });

  if (!budget) {
    budget = await Budget.create({
      roomId: room._id,
      month,
      totalMembers: room.members.length,
      contributionPerPerson: room.monthlyContributionPerPerson,
      baseBudget: 0,
      carryForward
    });
  } else if (
    budget.contributionPerPerson !== room.monthlyContributionPerPerson
  ) {
    budget.contributionPerPerson = room.monthlyContributionPerPerson;
  }

  const memberships = await Membership.find({
    roomId: room._id,
    joinedAt: { $lte: getMonthBounds(month).end },
    $or: [
      { leftAt: null },
      { leftAt: { $gte: getMonthBounds(month).start } }
    ]
  });

  const charges = [];
  const chargedUserIds = [];
  for (const membership of memberships) {
    const charge = calculateCharge(
      membership,
      budget.contributionPerPerson,
      month
    );

    if (!charge) continue;

    const savedCharge = await BudgetCharge.findOneAndUpdate(
      {
        roomId: room._id,
        userId: charge.userId,
        month
      },
      {
        ...charge,
        roomId: room._id,
        budgetId: budget._id,
        month
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    charges.push(savedCharge);
    chargedUserIds.push(charge.userId);
  }

  await BudgetCharge.deleteMany({
    roomId: room._id,
    month,
    ...(chargedUserIds.length > 0
      ? { userId: { $nin: chargedUserIds } }
      : {})
  });

  const baseBudget = roundMoney(
    charges.reduce((sum, charge) => sum + charge.amount, 0)
  );

  budget.totalMembers = charges.length;
  budget.baseBudget = baseBudget;
  await budget.save();

  return { budget, charges };
};

module.exports = {
  calculateCharge,
  ensureMembershipsForRoom,
  ensureMonthlyBudget,
  getMonth,
  getMonthBounds,
  roundMoney
};
