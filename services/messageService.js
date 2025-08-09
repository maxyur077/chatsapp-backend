const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const { logger } = require("../utils/logger");
const { sanitizeInput, sanitizePhoneNumber } = require("../utils/sanitization");

class MessageService {
  async getConversations(page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const conversations = await Conversation.find({ status: "active" })
        .sort({ "last_message.timestamp": -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Conversation.countDocuments({ status: "active" });

      return {
        conversations,
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_count: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error fetching conversations:", error);
      throw error;
    }
  }

  async getMessages(wa_id, page = 1, limit = 50) {
    try {
      const sanitizedWaId = sanitizePhoneNumber(wa_id);
      if (!sanitizedWaId) {
        throw new Error("Invalid wa_id format");
      }

      const skip = (page - 1) * limit;

      const messages = await Message.find({ wa_id: sanitizedWaId })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Message.countDocuments({ wa_id: sanitizedWaId });

      // Mark messages as read
      await this.markMessagesAsRead(sanitizedWaId);

      return {
        messages: messages.reverse(), // Return in chronological order
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_count: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error fetching messages:", error);
      throw error;
    }
  }

  // Send text message with username support
  async sendMessage({ from_username, to, message, contact_name }) {
    try {
      let fromPhone = "918329446654"; // default

      // If from_username provided, get user's phone
      if (from_username) {
        const sender = await this.getUserByUsernameOrThrow(from_username);
        fromPhone = sender.phone;
      }

      const toPhone = sanitizePhoneNumber(to);
      const wa_id = toPhone;

      const sanitizedData = {
        wa_id,
        message_id: `msg_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        from: fromPhone,
        to: toPhone,
        type: "text",
        content: { text: sanitizeInput(message) },
        timestamp: new Date(),
        direction: "outbound",
        status: "sent",
        contact_name: sanitizeInput(contact_name || ""),
        sender_username: from_username || "",
        metadata: { display_phone_number: fromPhone },
      };

      const doc = await Message.create(sanitizedData);
      await this.updateConversationAfterSend(sanitizedData);

      logger.info(`Text message sent: ${doc.message_id}`);
      return doc;
    } catch (error) {
      logger.error("Error sending text message:", error);
      throw error;
    }
  }

  async updateMessageStatus(id, status) {
    try {
      const validStatuses = ["sent", "delivered", "read", "failed"];
      if (!validStatuses.includes(status)) {
        throw new Error("Invalid status value");
      }

      const updatedMessage = await Message.findOneAndUpdate(
        { message_id: id },
        { status: status },
        { new: true }
      );

      if (!updatedMessage) {
        const error = new Error("Message not found");
        error.status = 404;
        throw error;
      }

      logger.info(`Updated message status: ${id} -> ${status}`);
      return updatedMessage;
    } catch (error) {
      logger.error("Error updating message status:", error);
      throw error;
    }
  }

  async deleteMessage(messageId) {
    try {
      const message = await Message.findOne({ message_id: messageId });
      if (!message) {
        const error = new Error("Message not found");
        error.status = 404;
        throw error;
      }

      await Message.deleteOne({ message_id: messageId });

      logger.info(`Message deleted: ${messageId}`);
      return { success: true, message: "Message deleted successfully" };
    } catch (error) {
      logger.error("Error deleting message:", error);
      throw error;
    }
  }

  async markMessagesAsRead(wa_id) {
    try {
      await Conversation.findOneAndUpdate({ wa_id }, { unread_count: 0 });
    } catch (error) {
      logger.error("Error marking messages as read:", error);
    }
  }

  async updateConversationAfterSend(messageData) {
    try {
      await Conversation.findOneAndUpdate(
        { wa_id: messageData.wa_id },
        {
          wa_id: messageData.wa_id,
          contact_name: messageData.contact_name,
          last_message: {
            content: messageData.content.text || "",
            timestamp: messageData.timestamp,
            direction: messageData.direction,
          },
          metadata: messageData.metadata,
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.error("Error updating conversation after send:", error);
    }
  }

  async getUserByUsernameOrThrow(username) {
    try {
      const user = await User.findOne({ username: username.toLowerCase() });
      if (!user) {
        const err = new Error("Sender user not found");
        err.status = 404;
        throw err;
      }
      return user;
    } catch (error) {
      logger.error("Error finding user by username:", error);
      throw error;
    }
  }

  // Search messages
  async searchMessages(wa_id, query, page = 1, limit = 20) {
    try {
      const sanitizedWaId = sanitizePhoneNumber(wa_id);
      const sanitizedQuery = sanitizeInput(query);

      const skip = (page - 1) * limit;

      const messages = await Message.find({
        wa_id: sanitizedWaId,
        $or: [
          { "content.text": { $regex: sanitizedQuery, $options: "i" } },
          { contact_name: { $regex: sanitizedQuery, $options: "i" } },
        ],
      })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Message.countDocuments({
        wa_id: sanitizedWaId,
        $or: [
          { "content.text": { $regex: sanitizedQuery, $options: "i" } },
          { contact_name: { $regex: sanitizedQuery, $options: "i" } },
        ],
      });

      return {
        messages: messages.reverse(),
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_count: total,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error searching messages:", error);
      throw error;
    }
  }
}

module.exports = MessageService;
