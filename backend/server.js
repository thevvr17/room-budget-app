const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Make io available in controllers
app.set("io", io);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("DB Connected"))
.catch(err => console.log(err));

// Root
app.get("/", (req, res) => {
  res.send("API Running...");
});

// Routes
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

const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

app.use("/api/admin", require("./routes/adminRoutes"));

const dashboardRoutes = require("./routes/dashboardRoutes");
app.use("/api/dashboard", dashboardRoutes);

// Socket connection
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log("Joined room:", roomId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

// Start server
server.listen(5000, () => {
  console.log("Server running on port 5000");
});