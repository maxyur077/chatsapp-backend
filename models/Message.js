const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    wa_id: {
      type: String,
      required: true,
      index: true,
    },
    message_id: {
      type: String,
      required: true,
      unique: true,
    },
    meta_msg_id: String,
    from: {
      type: String,
      required: true,
    },
    to: String,
    type: {
      type: String,
      enum: ["text"],
      default: "text",
    },
    content: {
      text: String,
    },
    timestamp: {
      type: Date,
      required: true,
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
    conversation_id: String,
    sender_username: String,
    metadata: {
      phone_number_id: String,
      display_phone_number: String,
      gs_app_id: String,
      entry_id: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
messageSchema.index({ wa_id: 1, timestamp: -1 });
messageSchema.index({ message_id: 1 });
messageSchema.index({ meta_msg_id: 1 });
messageSchema.index({ sender_username: 1 });

module.exports = mongoose.model("Message", messageSchema, "processed_messages");
