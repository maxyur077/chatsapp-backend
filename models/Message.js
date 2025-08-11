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
      index: true,
    },
    to: {
      type: String,
      required: true,
      index: true,
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
    sender_username: {
      type: String,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

messageSchema.index({ from: 1, to: 1, timestamp: -1 });
messageSchema.index({ wa_id: 1, timestamp: -1 });
messageSchema.index({ from: 1, timestamp: -1 });
messageSchema.index({ to: 1, timestamp: -1 });
messageSchema.index({ "content.text": "text" });

messageSchema.methods.canAccess = function (username) {
  return this.from === username || this.to === username;
};

module.exports = mongoose.model("Message", messageSchema);
