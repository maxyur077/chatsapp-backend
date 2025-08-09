const express = require("express");
const ConversationController = require("../controllers/conversationController");
const {
  validateGetConversations,
  validateWebhook,
} = require("../middleware/validation");
const { webhookLimiter } = require("../middleware/rateLimiter");

const router = express.Router();
const conversationController = new ConversationController();

router.get(
  "/",
  validateGetConversations,
  conversationController.getConversations
);

router.post(
  "/webhook",
  webhookLimiter,
  validateWebhook,
  conversationController.processWebhook
);

module.exports = router;
