const Message = require("../models/Message");

class MessageController {
  // SECURE: Get messages with user filtering
  async getMessages(req, res) {
    try {
      const { wa_id } = req.params;
      const currentUser = req.user;
      const { page = 1, limit = 50 } = req.query;

      // Extract target username from wa_id
      const targetUsername = wa_id;

      // Only fetch messages between current user and target user
      const messages = await Message.find({
        $or: [
          { from: currentUser.username, to: targetUsername },
          { from: targetUsername, to: currentUser.username },
        ],
      })
        .sort({ timestamp: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const totalMessages = await Message.countDocuments({
        $or: [
          { from: currentUser.username, to: targetUsername },
          { from: targetUsername, to: currentUser.username },
        ],
      });

      res.json({
        success: true,
        data: {
          messages: messages.reverse(), // Reverse to show oldest first
          pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalMessages / limit),
            totalMessages,
            hasNext: page < Math.ceil(totalMessages / limit),
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch messages",
        error: error.message,
      });
    }
  }

  // SECURE: Send message with verification
  async sendMessage(req, res) {
    try {
      const { to, message, contact_name } = req.body;
      const currentUser = req.user;

      // Create message with proper sender verification
      const newMessage = new Message({
        message_id: `msg-${Date.now()}-${Math.random()}`,
        wa_id: `${currentUser.username}_${to}`,
        from: currentUser.username,
        to: to,
        content: {
          text: message,
        },
        direction: "outbound",
        contact_name: contact_name,
        sender_username: currentUser.username,
        status: "sent",
      });

      const savedMessage = await newMessage.save();

      res.json({
        success: true,
        data: {
          message_id: savedMessage._id,
          message: savedMessage,
        },
        message: "Message sent successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to send message",
        error: error.message,
      });
    }
  }

  // SECURE: Search messages with user filtering
  async searchMessages(req, res) {
    try {
      const { wa_id } = req.params;
      const { query } = req.query;
      const currentUser = req.user;

      const targetUsername = wa_id;

      const messages = await Message.find({
        $and: [
          {
            $or: [
              { from: currentUser.username, to: targetUsername },
              { from: targetUsername, to: currentUser.username },
            ],
          },
          {
            "content.text": { $regex: query, $options: "i" },
          },
        ],
      })
        .sort({ timestamp: -1 })
        .limit(20);

      res.json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to search messages",
        error: error.message,
      });
    }
  }

  async updateMessageStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updatedMessage = await Message.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      );

      if (!updatedMessage) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      res.json({
        success: true,
        data: { message: updatedMessage },
        message: "Message status updated successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to update message status",
        error: error.message,
      });
    }
  }

  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;

      const deletedMessage = await Message.findByIdAndDelete(messageId);

      if (!deletedMessage) {
        return res.status(404).json({
          success: false,
          message: "Message not found",
        });
      }

      res.json({
        success: true,
        message: "Message deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to delete message",
        error: error.message,
      });
    }
  }
}

module.exports = MessageController;
