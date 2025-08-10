const express = require("express");
const MessageController = require("../controllers/messageController");
const {
  validateSendMessage,
  validateGetMessages,
  validateSearchMessages,
  validateUpdateMessageStatus,
} = require("../middleware/validation");
const { messageLimiter } = require("../middleware/rateLimiter");
const auth = require("../middleware/auth");

const router = express.Router();
const messageController = new MessageController();

// Get messages for a specific conversation
router.get("/:wa_id", auth, validateGetMessages, (req, res) =>
  messageController.getMessages(req, res)
);

// Search messages in a conversation
router.get("/:wa_id/search", auth, validateSearchMessages, (req, res) =>
  messageController.searchMessages(req, res)
);

// Send a new message
router.post("/", auth, messageLimiter, validateSendMessage, (req, res) =>
  messageController.sendMessage(req, res)
);

// Update message status
router.put("/:id/status", auth, validateUpdateMessageStatus, (req, res) =>
  messageController.updateMessageStatus(req, res)
);

// Delete a message
router.delete("/:messageId", auth, (req, res) =>
  messageController.deleteMessage(req, res)
);

module.exports = router;
