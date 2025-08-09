const express = require("express");
const MessageController = require("../controllers/messageController");
const {
  validateSendMessage,
  validateGetMessages,
  validateSearchMessages,
  validateUpdateMessageStatus,
} = require("../middleware/validation");
const { messageLimiter } = require("../middleware/rateLimiter");

const router = express.Router();
const messageController = new MessageController();

// GET /api/messages/:wa_id - Get messages for a specific user by phone
router.get("/:wa_id", validateGetMessages, messageController.getMessages);

// GET /api/messages/:wa_id/search - Search messages for a user
router.get(
  "/:wa_id/search",
  validateSearchMessages,
  messageController.searchMessages
);

// POST /api/messages - Send a text message
router.post(
  "/",
  messageLimiter,
  validateSendMessage,
  messageController.sendMessage
);

// PUT /api/messages/:id/status - Update message status
router.put(
  "/:id/status",
  validateUpdateMessageStatus,
  messageController.updateMessageStatus
);

// DELETE /api/messages/:messageId - Delete a message
router.delete("/:messageId", messageController.deleteMessage);

module.exports = router;
