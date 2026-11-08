const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
const Room = require("../models/Room");
const Membership = require("../models/Membership");
const Budget = require("../models/Budget");
const BudgetCharge = require("../models/BudgetCharge");
const Expense = require("../models/Expense");
const Settlement = require("../models/Settlement");
const TopUp = require("../models/TopUp");
const Notification = require("../models/Notification");
const JoinRequest = require("../models/JoinRequest");
const LeaveRequest = require("../models/LeaveRequest");

async function seedData() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error("❌ MONGO_URI missing in backend/.env");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log("✅ Connected.");

    console.log("Wiping existing collections...");
    await Promise.all([
      User.deleteMany({}),
      Room.deleteMany({}),
      Membership.deleteMany({}),
      Budget.deleteMany({}),
      BudgetCharge.deleteMany({}),
      Expense.deleteMany({}),
      Settlement.deleteMany({}),
      TopUp.deleteMany({}),
      Notification.deleteMany({}),
      JoinRequest.deleteMany({}),
      LeaveRequest.deleteMany({})
    ]);

    console.log("Creating Admin 1: Vishnu...");
    const hashedPassword1 = await bcrypt.hash("vishnu@123", 10);
    const admin1 = await User.create({
      name: "Vishnu",
      email: "thevvr17@gmail.com",
      password: hashedPassword1,
      role: "admin"
    });

    console.log("Creating Admin 2: Gorigin Naidu...");
    const hashedPassword2 = await bcrypt.hash("Gorgin@123", 10);
    const admin2 = await User.create({
      name: "Gorigin Naidu",
      email: "garogapatipradeep2000@gmail.com",
      password: hashedPassword2,
      role: "admin"
    });

    console.log("Creating Room: Flat202 with both admins...");
    const room = await Room.create({
      name: "Flat202",
      admin: admin1._id,
      admins: [admin1._id, admin2._id],
      members: [admin1._id, admin2._id],
      monthlyContributionPerPerson: 0
    });

    // Start on November 1st, 2026 for 100% full-month billing
    const nov1st = new Date(Date.UTC(2026, 10, 1));

    console.log("Creating active memberships starting Nov 1st...");
    await Membership.create([
      {
        roomId: room._id,
        userId: admin1._id,
        joinedAt: nov1st,
        status: "active"
      },
      {
        roomId: room._id,
        userId: admin2._id,
        joinedAt: nov1st,
        status: "active"
      }
    ]);

    console.log("\n========================================");
    console.log("🎉 PRODUCTION SETUP COMPLETE!");
    console.log("========================================");
    console.log("Room Name:", room.name);
    console.log("Room ID:  ", room._id.toString());
    console.log("\nAdmins configured:");
    console.log("1) Vishnu        - thevvr17@gmail.com");
    console.log("2) Gorigin Naidu - garogapatipradeep2000@gmail.com");
    console.log("\nBilling start date: November 1st (Full 30-day billing)");
    console.log("========================================\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  }
}

seedData();
