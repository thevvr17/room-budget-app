const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Room = require("./models/Room");
const { isRoomMember } = require("./middleware/roomAuthMiddleware");

const dns = require("dns");

// Ensure reliable DNS resolution for MongoDB Atlas SRV records
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // Ignore in environments where setting DNS servers is restricted
}

require("dotenv").config();

// Ensure critical environment variables exist
if (!process.env.MONGO_URI) {
  console.warn("[WARNING] MONGO_URI is not defined in environment variables!");
}
if (!process.env.JWT_SECRET) {
  console.warn("[WARNING] JWT_SECRET is not defined in environment variables!");
}

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.BASE_URL || "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Make io available in controllers
app.set("io", io);

// Request logging middleware for production observability
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Middleware
app.use(cors({
  origin: process.env.BASE_URL || "*"
}));
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("[INFO] MongoDB Connected successfully"))
  .catch(err => console.error("[ERROR] MongoDB Connection Error:", err.message));

// Health check endpoints for deployment platforms (Render, Railway, AWS, Docker)
app.get("/", (req, res) => {
  res.send("API Running...");
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
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
  console.log(`[SOCKET] User connected: ${socket.id}`);

  socket.on("join-room", async ({ roomId, token } = {}) => {
    try {
      if (!roomId || !token) {
        return socket.emit("join-room-error", {
          message: "Room ID and token are required"
        });
      }

      const cleanToken = typeof token === "string" && token.startsWith("Bearer ")
        ? token.slice(7).trim()
        : token;

      const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
      const room = await Room.findById(roomId);

      if (!room || !isRoomMember(room, decoded.id)) {
        return socket.emit("join-room-error", {
          message: "Room access denied"
        });
      }

      socket.join(roomId);
      console.log(`[SOCKET] Socket ${socket.id} joined room: ${roomId}`);
    } catch (error) {
      console.error(`[SOCKET ERROR] Failed room join:`, error.message);
      socket.emit("join-room-error", {
        message: "Invalid socket authentication"
      });
    }
  });

  socket.on("disconnect", () => {
    console.log(`[SOCKET] User disconnected: ${socket.id}`);
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(`[UNHANDLED ERROR] ${req.method} ${req.originalUrl}:`, err);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error"
  });
});

// Process-level crash handlers
process.on("unhandledRejection", (reason, promise) => {
  console.error("[CRITICAL] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[CRITICAL] Uncaught Exception:", error);
  process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`[INFO] Server running on port ${PORT}`);
});
