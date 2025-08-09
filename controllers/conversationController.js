const MessageService = require("../services/messageService");
const WebhookProcessor = require("../services/webhookProcessor");
const { logger } = require("../utils/logger");

class ConversationController {
  constructor() {
    this.messageService = new MessageService();
    this.webhookProcessor = new WebhookProcessor();
  }

  getConversations = async (req, res, next) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await this.messageService.getConversations(page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  processWebhook = async (req, res, next) => {
    try {
      const payload = req.body;

      logger.info("Processing webhook payload:", {
        id: payload._id,
        type: payload.payload_type,
      });

      const result = await this.webhookProcessor.processWebhookPayload(payload);

      res.json({
        success: true,
        message: "Webhook processed successfully",
        processed_count: result.length,
      });
    } catch (error) {
      logger.error("Webhook processing failed:", error);
      next(error);
    }
  };
}

module.exports = ConversationController;
