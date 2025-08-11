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

const verifyMessageAccess = async (req, res, next) => {
  try {
    const currentUser = req.user;
    const targetUsername = req.params.wa_id;

    if (targetUsername === currentUser.username) {
      return res.status(400).json({
        success: false,
        message: "Cannot access messages with yourself",
      });
    }

    req.targetUsername = targetUsername;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying message access",
    });
  }
};

router.get(
  "/:wa_id",
  auth,
  verifyMessageAccess,
  validateGetMessages,
  (req, res) => messageController.getMessages(req, res)
);

router.get(
  "/:wa_id/search",
  auth,
  verifyMessageAccess,
  validateSearchMessages,
  (req, res) => messageController.searchMessages(req, res)
);

router.post("/", auth, messageLimiter, validateSendMessage, (req, res) => {
  if (req.body.from_username && req.body.from_username !== req.user.username) {
    return res.status(403).json({
      success: false,
      message: "Unauthorized: Cannot send message as another user",
    });
  }

  if (req.body.to === req.user.username) {
    return res.status(400).json({
      success: false,
      message: "Cannot send message to yourself",
    });
  }

  messageController.sendMessage(req, res);
});

router.put(
  "/:id/status",
  auth,
  validateUpdateMessageStatus,
  async (req, res) => {
    try {
      const Message = require("../models/Message");
      const message = await Message.findById(req.params.id);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      if (
        message.from !== req.user.username &&
        message.to !== req.user.username
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Unauthorized: You can only update status of your own messages",
        });
      }

      messageController.updateMessageStatus(req, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Error updating message status",
      });
    }
  }
);

router.delete("/:messageId", auth, async (req, res) => {
  try {
    const Message = require("../models/Message");
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    if (message.from !== req.user.username) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You can only delete your own messages",
      });
    }

    messageController.deleteMessage(req, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting message",
    });
  }
});

router.get("/:wa_id/participants", auth, verifyMessageAccess, (req, res) => {
  try {
    const currentUser = req.user;
    const targetUsername = req.params.wa_id;

    res.json({
      success: true,
      data: {
        participants: [currentUser.username, targetUsername],
        conversationId: `${currentUser.username}_${targetUsername}`,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting conversation participants",
    });
  }
});

module.exports = router;
