const Conversation = require("../models/Conversation");
const { validationResult } = require("express-validator");

class ConversationController {
  constructor() {
    this.getConversations = this.getConversations.bind(this);
    this.processWebhook = this.processWebhook.bind(this);
  }

  async getConversations(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const sampleConversations = [
        {
          wa_id: "john_doe",
          contact_name: "John Doe",
          last_message: {
            content: "Hello there!",
            timestamp: new Date(),
            direction: "inbound",
          },
          unread_count: 2,
          status: "active",
        },
      ];

      res.status(200).json({
        success: true,
        data: sampleConversations,
      });
    } catch (error) {
      console.error("Get conversations error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching conversations",
      });
    }
  }

  async processWebhook(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      console.log("Webhook received:", req.body);

      res.status(200).json({
        success: true,
        message: "Webhook processed successfully",
      });
    } catch (error) {
      console.error("Process webhook error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while processing webhook",
      });
    }
  }
}

module.exports = ConversationController;
