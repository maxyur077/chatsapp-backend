const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    message_id: {
      type: String,
      required: true,
      unique: true,
    },
    wa_id: {
      type: String,
      required: true,
      index: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "audio", "video", "document"],
      default: "text",
    },
    content: {
      text: String,
      media_url: String,
      filename: String,
      caption: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },
    direction: {
      type: String,
      enum: ["inbound", "outbound"],
      required: true,
    },
    contact_name: String,
    sender_username: String,
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ wa_id: 1, timestamp: -1 });
messageSchema.index({ from: 1, timestamp: -1 });
messageSchema.index({ "content.text": "text" });

module.exports = mongoose.model("Message", messageSchema);
