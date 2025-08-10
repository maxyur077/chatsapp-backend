const dotenv = require("dotenv");

dotenv.config();

const config = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/ChatsApp",
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3001",
  WEBHOOK_VERIFY_TOKEN: process.env.WEBHOOK_VERIFY_TOKEN || "verify_token",
  RATE_LIMIT_WINDOW: parseInt(process.env.RATE_LIMIT_WINDOW || "900000"),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || "100"),
};

const validateEnvironment = () => {
  const required = ["MONGODB_URI"];

  for (const env of required) {
    if (!process.env[env]) {
      throw new Error(`Missing required environment variable: ${env}`);
    }
  }
};

module.exports = { config, validateEnvironment };
