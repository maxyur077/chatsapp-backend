const Message = require("../models/Message");
const { validationResult } = require("express-validator");

class MessageController {
  constructor() {
    // Explicitly bind all methods to maintain 'this' context
    this.getMessages = this.getMessages.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.searchMessages = this.searchMessages.bind(this);
    this.updateMessageStatus = this.updateMessageStatus.bind(this);
    this.deleteMessage = this.deleteMessage.bind(this);
  }

  async sendMessage(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { from_username, to, message, contact_name } = req.body;

      const newMessage = new Message({
        wa_id: to,
        message_id: `msg_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`,
        from: from_username,
        to: to,
        type: "text",
        content: { text: message },
        timestamp: new Date(),
        status: "sent",
        direction: "outbound",
        contact_name: contact_name || to,
        sender_username: from_username,
      });

      const savedMessage = await newMessage.save();

      // FIX: Emit message to BOTH sender and recipient
      const io = req.app.get("io");
      if (io) {
        const messageData = {
          id: savedMessage._id.toString(),
          from: from_username,
          to: to,
          content: message, // Send as string, not object
          timestamp: savedMessage.timestamp,
          status: "sent",
          senderName: contact_name || from_username,
        };

        // Emit to recipient
        io.to(to).emit("new-message", messageData);
        console.log(`📨 Message sent to recipient: ${to}`);

        // Also emit to sender for real-time update
        io.to(from_username).emit("new-message", messageData);
        console.log(`📨 Message sent to sender: ${from_username}`);
      }

      res.status(201).json({
        success: true,
        message: "Message sent successfully",
        data: {
          message_id: savedMessage.message_id,
          from: savedMessage.from,
          to: savedMessage.to,
          content: message,
          timestamp: savedMessage.timestamp,
          status: savedMessage.status,
        },
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while sending message",
      });
    }
  }

  async getMessages(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { wa_id } = req.params;
      const { page = 1, limit = 50 } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const messages = await Message.find({
        $or: [{ from: wa_id }, { to: wa_id }],
      })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      // FIX: Process messages to return proper content format
      const processedMessages = messages.reverse().map((msg) => ({
        id: msg._id,
        from: msg.from,
        to: msg.to,
        content: msg.content?.text || msg.content || "", // Extract text content
        timestamp: msg.timestamp,
        status: msg.status,
        senderName: msg.contact_name || msg.from,
      }));

      res.status(200).json({
        success: true,
        data: {
          messages: processedMessages,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(
              (await Message.countDocuments({ wa_id })) / parseInt(limit)
            ),
          },
        },
      });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while fetching messages",
      });
    }
  }

  async searchMessages(req, res) {
    try {
      const { wa_id } = req.params;
      const { q: query } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Search query is required",
        });
      }

      const messages = await Message.find({
        wa_id,
        "content.text": { $regex: query, $options: "i" },
      }).sort({ timestamp: -1 });

      res.status(200).json({
        success: true,
        data: { messages, searchQuery: query },
      });
    } catch (error) {
      console.error("Search messages error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while searching messages",
      });
    }
  }

  async updateMessageStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const message = await Message.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Message status updated",
        data: message,
      });
    } catch (error) {
      console.error("Update message status error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while updating message status",
      });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;

      const message = await Message.findByIdAndDelete(messageId);

      if (!message) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      res.status(200).json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      console.error("Delete message error:", error);
      res.status(500).json({
        success: false,
        message: "Server error while deleting message",
      });
    }
  }
}

module.exports = MessageController;
