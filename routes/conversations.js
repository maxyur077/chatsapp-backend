const express = require("express");
const ConversationController = require("../controllers/conversationController");
const {
  validateGetConversations,
  validateWebhook,
} = require("../middleware/validation");
const { webhookLimiter } = require("../middleware/rateLimiter");
const auth = require("../middleware/auth");

const router = express.Router();
const conversationController = new ConversationController();

// Get all conversations
router.get("/", auth, validateGetConversations, (req, res) =>
  conversationController.getConversations(req, res)
);

// Process webhook
router.post("/webhook", webhookLimiter, validateWebhook, (req, res) =>
  conversationController.processWebhook(req, res)
);

module.exports = router;
