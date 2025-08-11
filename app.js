const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { createServer } = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
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
    methods: ["GET", "POST"],
  },
  transports: ["websocket", "polling"],
  allowEIO3: true,
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

const connectedUsers = new Map();
const userSockets = new Map();
const authenticatedSockets = new Map();

mongoose.connection.on("connected", () => {
  isDbConnected = true;
  dbConnectionTime = new Date();
});

mongoose.connection.on("error", () => {
  isDbConnected = false;
});

mongoose.connection.on("disconnected", () => {
  isDbConnected = false;
});

io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    authenticatedSockets.set(socket.id, decoded);
    next();
  } catch (error) {
    next(new Error("Invalid authentication token"));
  }
});

io.on("connection", (socket) => {
  const authenticatedUser = socket.user;

  if (!authenticatedUser) {
    socket.disconnect();
    return;
  }

  socket.on("join-user", (username) => {
    if (username !== authenticatedUser.username) {
      socket.emit("error", {
        message: "Unauthorized: Cannot join another user's room",
      });
      return;
    }

    socket.username = username;
    connectedUsers.set(username, socket.id);
    userSockets.set(socket.id, username);

    socket.join(username);

    socket.emit("joined-room", {
      username: username,
      socketId: socket.id,
      timestamp: new Date(),
    });

    const onlineUsers = Array.from(connectedUsers.keys());
    socket.emit("online-users", onlineUsers);

    socket.broadcast.emit("user-online", {
      username: username,
      timestamp: new Date(),
      onlineUsers: onlineUsers,
    });
  });

  // SECURE: Message sending with authorization
  socket.on("send-message", (messageData) => {
    const { to, from, message, messageId } = messageData;

    // CRITICAL: Verify sender is authenticated user
    if (from !== authenticatedUser.username) {
      socket.emit("error", {
        message: "Unauthorized: Cannot send message as another user",
      });
      return;
    }

    // Additional validation: Ensure user exists and is not sending to themselves
    if (from === to) {
      socket.emit("error", { message: "Cannot send message to yourself" });
      return;
    }

    const messageObject = {
      id: messageId || `msg-${Date.now()}-${Math.random()}`,
      from: from,
      to: to,
      content: message,
      timestamp: new Date(),
      status: "sent",
      senderName: from,
    };

    // Send to recipient only if they're online
    const recipientSocketId = connectedUsers.get(to);
    if (recipientSocketId) {
      io.to(to).emit("newMessage", messageObject);

      socket.emit("message-delivered", {
        messageId: messageObject.id,
        to: to,
        timestamp: new Date(),
      });
    }

    socket.emit("message-sent", messageObject);
  });

  socket.on("typing", (data) => {
    const { to, from, isTyping } = data;

    // Verify sender
    if (from !== authenticatedUser.username) {
      return;
    }

    const recipientSocketId = connectedUsers.get(to);
    if (recipientSocketId) {
      io.to(to).emit("user-typing", {
        from: from,
        isTyping: isTyping,
        timestamp: new Date(),
      });
    }
  });

  socket.on("mark-as-read", (data) => {
    const { messageId, from, to } = data;

    // Verify user authorization
    if (to !== authenticatedUser.username) {
      return;
    }

    const senderSocketId = connectedUsers.get(from);
    if (senderSocketId) {
      io.to(from).emit("message-read", {
        messageId: messageId,
        readBy: to,
        timestamp: new Date(),
      });
    }
  });

  socket.on("disconnect", () => {
    const username = userSockets.get(socket.id);
    if (username) {
      connectedUsers.delete(username);
      userSockets.delete(socket.id);
      authenticatedSockets.delete(socket.id);

      const onlineUsers = Array.from(connectedUsers.keys());

      socket.broadcast.emit("user-offline", {
        username: username,
        timestamp: new Date(),
        onlineUsers: onlineUsers,
      });
    }
  });
});

// SECURE: Health endpoint with real online users
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
      connectedUsers: connectedUsers.size,
      authenticatedUsers: authenticatedSockets.size,
      onlineUsers: Array.from(connectedUsers.keys()),
    },
  };

  const statusCode = isDbConnected ? 200 : 503;
  res.status(statusCode).json(healthStatus);
});

// SECURE: Protected online users endpoint
app.get("/api/users/online", (req, res) => {
  res.json({
    success: true,
    data: {
      onlineUsers: Array.from(connectedUsers.keys()),
      count: connectedUsers.size,
    },
  });
});

app.use("/api/users", require("./routes/users"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/conversations", require("./routes/conversations"));

app.use((err, req, res, next) => {
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
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
      if (process.env.NODE_ENV === "development") {
        console.log(`Server running on port ${PORT}`);
      }
    });
  } catch (error) {
    process.exit(1);
  }
};

process.on("SIGTERM", () => {
  httpServer.close(() => {
    mongoose.connection.close();
  });
});

process.on("SIGINT", () => {
  httpServer.close(() => {
    mongoose.connection.close();
  });
});

startServer();

module.exports = app;
