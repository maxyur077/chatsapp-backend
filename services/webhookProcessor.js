const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { logger } = require("../utils/logger");
const { sanitizeInput, sanitizePhoneNumber } = require("../utils/sanitization");

class WebhookProcessor {
  async processWebhookPayload(payload) {
    try {
      if (!payload || !payload.metaData || !payload.metaData.entry) {
        throw new Error("Invalid webhook payload structure");
      }

      const results = [];

      for (const entry of payload.metaData.entry) {
        if (!entry.changes) continue;

        for (const change of entry.changes) {
          if (change.field === "messages") {
            const result = await this.processMessageChange(
              change.value,
              payload
            );
            if (result) results.push(result);
          }
        }
      }

      return results;
    } catch (error) {
      logger.error("Error processing webhook payload:", error);
      throw error;
    }
  }

  async processMessageChange(value, originalPayload) {
    try {
      // Process new messages
      if (value.messages && value.messages.length > 0) {
        return await this.processMessages(value, originalPayload);
      }

      // Process status updates
      if (value.statuses && value.statuses.length > 0) {
        return await this.processStatusUpdates(value.statuses);
      }

      return null;
    } catch (error) {
      logger.error("Error processing message change:", error);
      throw error;
    }
  }

  async processMessages(value, originalPayload) {
    const results = [];

    for (const message of value.messages) {
      try {
        const contact = value.contacts
          ? value.contacts.find((c) => c.wa_id === message.from)
          : null;
        const contactName = contact ? sanitizeInput(contact.profile.name) : "";

        const messageData = {
          wa_id: sanitizePhoneNumber(message.from),
          message_id: message.id,
          from: sanitizePhoneNumber(message.from),
          to: value.metadata
            ? sanitizePhoneNumber(value.metadata.display_phone_number)
            : "",
          type: message.type || "text",
          content: this.extractContent(message),
          timestamp: new Date(parseInt(message.timestamp) * 1000),
          direction: this.determineDirection(message.from, value.metadata),
          contact_name: contactName,
          conversation_id: originalPayload.metaData.gs_app_id || "",
          metadata: {
            phone_number_id: value.metadata
              ? value.metadata.phone_number_id
              : "",
            display_phone_number: value.metadata
              ? value.metadata.display_phone_number
              : "",
            gs_app_id: originalPayload.metaData.gs_app_id || "",
            entry_id: originalPayload.metaData.entry[0].id || "",
          },
        };

        // Check if message already exists
        const existingMessage = await Message.findOne({
          message_id: message.id,
        });
        if (existingMessage) {
          logger.info(`Message ${message.id} already exists, skipping`);
          continue;
        }

        const savedMessage = await Message.create(messageData);
        await this.updateConversation(messageData);

        results.push(savedMessage);
        logger.info(`Processed message: ${message.id}`);
      } catch (error) {
        logger.error(
          `Error processing individual message ${message.id}:`,
          error
        );
      }
    }

    return results;
  }

  async processStatusUpdates(statuses) {
    const results = [];

    for (const status of statuses) {
      try {
        const updateQuery = {};

        if (status.id) {
          updateQuery.message_id = status.id;
        } else if (status.meta_msg_id) {
          updateQuery.meta_msg_id = status.meta_msg_id;
        } else {
          logger.warn("Status update missing both id and meta_msg_id:", status);
          continue;
        }

        const updatedMessage = await Message.findOneAndUpdate(
          updateQuery,
          {
            status: status.status,
            meta_msg_id: status.meta_msg_id || status.id,
          },
          { new: true }
        );

        if (updatedMessage) {
          results.push(updatedMessage);
          logger.info(
            `Updated message status: ${status.id} -> ${status.status}`
          );
        } else {
          logger.warn(
            `Message not found for status update: ${
              status.id || status.meta_msg_id
            }`
          );
        }
      } catch (error) {
        logger.error(`Error processing status update ${status.id}:`, error);
      }
    }

    return results;
  }

  extractContent(message) {
    const content = {};

    switch (message.type) {
      case "text":
        content.text = sanitizeInput(message.text ? message.text.body : "");
        break;
      case "image":
      case "audio":
      case "video":
      case "document":
        if (message[message.type]) {
          content.media_url = message[message.type].id || "";
          content.caption = sanitizeInput(message[message.type].caption || "");
          content.filename = sanitizeInput(
            message[message.type].filename || ""
          );
        }
        break;
      default:
        content.text = "Unsupported message type";
    }

    return content;
  }

  determineDirection(from, metadata) {
    if (!metadata || !metadata.display_phone_number) {
      return "inbound";
    }

    return from === metadata.display_phone_number ? "outbound" : "inbound";
  }

  async updateConversation(messageData) {
    try {
      const conversationUpdate = {
        wa_id: messageData.wa_id,
        contact_name: messageData.contact_name,
        last_message: {
          content:
            messageData.content.text ||
            messageData.content.caption ||
            "Media message",
          timestamp: messageData.timestamp,
          direction: messageData.direction,
        },
        metadata: {
          phone_number_id: messageData.metadata.phone_number_id,
          display_phone_number: messageData.metadata.display_phone_number,
        },
      };

      // Increment unread count for inbound messages
      if (messageData.direction === "inbound") {
        conversationUpdate.$inc = { unread_count: 1 };
      }

      await Conversation.findOneAndUpdate(
        { wa_id: messageData.wa_id },
        conversationUpdate,
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.error("Error updating conversation:", error);
    }
  }
}

module.exports = WebhookProcessor;
