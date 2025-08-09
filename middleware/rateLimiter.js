const rateLimit = require("express-rate-limit");
const { config } = require("../config/environment");

const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

const generalLimiter = createRateLimiter(
  config.RATE_LIMIT_WINDOW,
  config.RATE_LIMIT_MAX,
  "Too many requests, please try again later"
);

const webhookLimiter = createRateLimiter(
  60 * 1000,
  200,
  "Too many webhook requests"
);

const messageLimiter = createRateLimiter(
  60 * 1000,
  30,
  "Too many messages sent, please slow down"
);

module.exports = {
  generalLimiter,
  webhookLimiter,
  messageLimiter,
};
