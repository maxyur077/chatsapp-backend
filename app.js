const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:4200",
      "http://localhost:3000",
    ],
    credentials: true,
  },
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || [
      "http://localhost:4200",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.set("io", io);

let isDbConnected = false;
let dbConnectionTime = null;

mongoose.connection.on("connected", () => {
  isDbConnected = true;
  dbConnectionTime = new Date();
  console.log("✅ MongoDB connected successfully");
});

mongoose.connection.on("error", (err) => {
  isDbConnected = false;
  console.error("❌ MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  isDbConnected = false;
  console.log("⚠️ MongoDB disconnected");
});

io.on("connection", (socket) => {
  console.log("✅ User connected:", socket.id);

  socket.on("join-user", (username) => {
    socket.join(username);
    console.log(`✅ User ${username} joined room ${username}`);

    socket.emit("joined-room", username);
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

app.get("/api/health", (req, res) => {
  const healthStatus = {
    success: true,
    message: "ChatsApp Backend API is running",
    timestamp: new Date().toISOString(),
    server: {
      status: "running",
      port: process.env.PORT || 3000,
      environment: process.env.NODE_ENV || "development",
    },
    database: {
      connected: isDbConnected,
      connectionTime: dbConnectionTime,
      status: isDbConnected ? "connected" : "disconnected",
    },
    websocket: {
      status: "active",
      connectedClients: io.engine.clientsCount,
    },
  };

  const statusCode = isDbConnected ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

app.use("/api/users", require("./routes/users"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/conversations", require("./routes/conversations"));

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

const startServer = async () => {
  try {
    console.log("🚀 Starting ChatsApp Backend...");

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ Connected to MongoDB successfully");
    console.log("📊 Database:", mongoose.connection.name);

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔌 WebSocket Server: Running`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully");
  httpServer.close(() => {
    console.log("🛑 Server closed");
    mongoose.connection.close();
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully");
  httpServer.close(() => {
    console.log("🛑 Server closed");
    mongoose.connection.close();
  });
});

startServer();

module.exports = app;
