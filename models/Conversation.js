const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    wa_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    contact_name: String,
    last_message: {
      content: String,
      timestamp: Date,
      direction: String,
    },
    unread_count: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "archived", "blocked"],
      default: "active",
    },
    metadata: {
      phone_number_id: String,
      display_phone_number: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Conversation", conversationSchema);
