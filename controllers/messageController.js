const Message = require("../models/Message");
const jwt = require("jsonwebtoken");

class MessageController {
  async getMessages(req, res) {
    try {
      const targetUsername = req.params.wa_id;
      const currentUser = req.user;

      console.log(
        "Getting messages between:",
        currentUser.username,
        "and",
        targetUsername
      );

      const messages = await Message.find({
        $or: [
          { from: currentUser.username, to: targetUsername },
          { from: targetUsername, to: currentUser.username },
        ],
      })
        .sort({ timestamp: -1 })
        .limit(50)
        .exec();

      const filteredMessages = messages.filter(
        (msg) =>
          (msg.from === currentUser.username ||
            msg.to === currentUser.username) &&
          (msg.from === targetUsername || msg.to === targetUsername)
      );

      res.json({
        success: true,
        data: {
          messages: filteredMessages.reverse(),
        },
      });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch messages",
      });
    }
  }

  async sendMessage(req, res) {
    try {
      const { to, message, contact_name } = req.body;
      const currentUser = req.user;

      if (
        req.body.from_username &&
        req.body.from_username !== currentUser.username
      ) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: Cannot send message as another user",
        });
      }

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
        },
      });
    } catch (error) {
      console.error("Send message error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to send message",
      });
    }
  }
}

module.exports = MessageController;
