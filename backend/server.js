const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("DB Connected"))
.catch(err => console.log(err));

app.get("/", (req, res) => {
  res.send("API Running...");
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

const authMiddleware = require("./middleware/authMiddleware");
app.get("/protected", authMiddleware, (req, res) => {
  res.json({
    message: "You are authorized",
    user: req.user
  });
});

const roomRoutes = require("./routes/roomRoutes");
app.use("/api/rooms", roomRoutes);

const budgetRoutes = require("./routes/budgetRoutes");
app.use("/api/budget", budgetRoutes);

const expenseRoutes = require("./routes/expenseRoutes");
app.use("/api/expenses", expenseRoutes);

const settlementRoutes = require("./routes/settlementRoutes");
app.use("/api/settlements", settlementRoutes);

const dashboardRoutes = require("./routes/dashboardRoutes");
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/dashboard", dashboardRoutes);