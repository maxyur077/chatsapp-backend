const { body, param, query } = require("express-validator");

// User validation functions
const validateUserRegister = [
  body("username")
    .isLength({ min: 3, max: 20 })
    .withMessage("Username must be between 3 and 20 characters"),
  body("name").isLength({ min: 1, max: 50 }).withMessage("Name is required"),
  body("email").isEmail().withMessage("Please enter a valid email address"),
  body("phone")
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage("Please enter a valid phone number"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

const validateUserLogin = [
  body("username").notEmpty().withMessage("Username or email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Message validation functions
const validateSendMessage = [
  body("from_username").notEmpty().withMessage("from_username is required"),
  body("to").notEmpty().withMessage("to is required"),
  body("message").notEmpty().withMessage("message is required"),
];

const validateGetMessages = [
  param("wa_id").notEmpty().withMessage("wa_id is required"),
];

const validateSearchMessages = [
  param("wa_id").notEmpty().withMessage("wa_id is required"),
  query("q").notEmpty().withMessage("search query is required"),
];

const validateUpdateMessageStatus = [
  param("id").notEmpty().withMessage("message id is required"),
  body("status")
    .isIn(["sent", "delivered", "read", "failed"])
    .withMessage("Invalid status"),
];

// Conversation validation functions (ADD THESE)
const validateGetConversations = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100"),
];

const validateWebhook = [
  body("type").notEmpty().withMessage("webhook type is required"),
  body("data").notEmpty().withMessage("webhook data is required"),
];

// Export ALL validation functions
module.exports = {
  validateUserRegister,
  validateUserLogin,
  validateSendMessage,
  validateGetMessages,
  validateSearchMessages,
  validateUpdateMessageStatus,
  validateGetConversations, // ADD THIS
  validateWebhook, // ADD THIS
};
