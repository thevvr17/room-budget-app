const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {}

require("dotenv").config();
const mongoose = require("mongoose");

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

async function resetDatabase() {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error("❌ ERROR: MONGO_URI is missing in backend/.env");
    process.exit(1);
  }

  try {
    console.log("Connecting to MongoDB Atlas...");
    await mongoose.connect(mongoUri);
    console.log(" Connected to database.");

    console.log("Clearing existing test collections...");
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

    console.log("✅ All collections wiped successfully!");
    console.log("The database is clean and ready for your real Admin and flatmates.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Reset failed:", err.message);
    if (err.message.includes("IP that isn't whitelisted")) {
      console.error("\n👉 Action Required: Open MongoDB Atlas -> Network Access -> Add IP '0.0.0.0/0' (Allow access from anywhere).");
    }
    process.exit(1);
  }
}

resetDatabase();
