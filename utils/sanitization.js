const validator = require("express-validator");

const sanitizeInput = (text) => {
  if (!text || typeof text !== "string") return "";

  return text
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 4096); // Limit length
};

const sanitizePhoneNumber = (phone) => {
  if (!phone) return "";
  return phone.replace(/[^\d]/g, "");
};

module.exports = {
  sanitizeInput,
  sanitizePhoneNumber,
};
