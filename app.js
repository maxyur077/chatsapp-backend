const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const mongoSanitize = require("express-mongo-sanitize");

const { config, validateEnvironment } = require("./config/environment");
const { connectDatabase } = require("./config/database");
const { logger } = require("./utils/logger");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { generalLimiter } = require("./middleware/rateLimiter");

// Routes
const messageRoutes = require("./routes/messages");
const conversationRoutes = require("./routes/conversations");
const userRoutes = require("./routes/users");

validateEnvironment();

const app = express();

app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true }));
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(mongoSanitize());

// Rate limiting
app.use(generalLimiter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "WhatsApp Backend API is running",
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV,
  });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`);
      logger.info(`Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Promise Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received, shutting down gracefully");
  process.exit(0);
});

startServer();

module.exports = app;
