const MessageService = require("../services/messageService");
const { logger } = require("../utils/logger");

class MessageController {
  constructor() {
    this.messageService = new MessageService();

    this.getMessages = this.getMessages.bind(this);
    this.getMessagesByUsername = this.getMessagesByUsername.bind(this);
    this.searchMessages = this.searchMessages.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.sendTextMessage = this.sendTextMessage.bind(this);
    this.sendMediaMessage = this.sendMediaMessage.bind(this);
    this.updateMessageStatus = this.updateMessageStatus.bind(this);
    this.deleteMessage = this.deleteMessage.bind(this);
  }

  async getMessages(req, res, next) {
    try {
      const { wa_id } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await this.messageService.getMessages(wa_id, page, limit);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessagesByUsername(req, res, next) {
    try {
      const { username } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const result = await this.messageService.getMessagesByUsername(
        username,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async searchMessages(req, res, next) {
    try {
      const { wa_id } = req.params;
      const { q: query } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: "Search query must be at least 2 characters long",
        });
      }

      const result = await this.messageService.searchMessages(
        wa_id,
        query,
        page,
        limit
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const messageData = req.body;
      const result = await this.messageService.sendMessage(messageData);

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendTextMessage(req, res, next) {
    try {
      const { from_username, to, message, contact_name } = req.body;
      const result = await this.messageService.sendText({
        from_username,
        to,
        message,
        contact_name,
      });

      res.status(201).json({
        success: true,
        message: "Text message sent successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async sendMediaMessage(req, res, next) {
    try {
      const { from_username, to, type, caption } = req.body;
      const file = req.file;
      console.log(file);

      if (!file) {
        return res.status(400).json({
          success: false,
          message: "Media file is required",
        });
      }

      const result = await this.messageService.sendMedia({
        from_username,
        to,
        type,
        file,
        caption,
      });

      res.status(201).json({
        success: true,
        message: "Media message sent successfully",
        data: {
          ...result.toObject(),

          optimized_urls: {
            thumbnail:
              result.type === "video"
                ? result.content.media_metadata.thumbnail_url
                : result.content.media_url,
            full_size: result.content.media_url,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMessageStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const result = await this.messageService.updateMessageStatus(id, status);

      res.json({
        success: true,
        message: "Status updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const result = await this.messageService.deleteMessage(messageId);

      res.json({
        success: true,
        message: "Message deleted successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = MessageController;
