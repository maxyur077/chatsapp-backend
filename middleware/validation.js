const { body, param, query, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }
  next();
};

const validateWebhook = [
  body("metaData").exists().withMessage("metaData is required"),
  body("metaData.entry").isArray().withMessage("entry must be an array"),
  handleValidationErrors,
];

const validateSendMessage = [
  body("from_username")
    .optional()
    .isString()
    .isLength({ min: 3 })
    .withMessage("from_username must be at least 3 characters"),
  body("to").isMobilePhone().withMessage("Valid phone number is required"),
  body("message")
    .isLength({ min: 1, max: 4096 })
    .withMessage("Message must be 1-4096 characters"),
  body("contact_name")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("Contact name too long"),
  handleValidationErrors,
];

const validateGetMessages = [
  param("wa_id").isMobilePhone().withMessage("Valid wa_id is required"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

const validateSearchMessages = [
  param("wa_id").isMobilePhone().withMessage("Valid wa_id is required"),
  query("q")
    .isLength({ min: 2, max: 100 })
    .withMessage("Search query must be 2-100 characters"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  handleValidationErrors,
];

const validateUpdateMessageStatus = [
  param("id")
    .isString()
    .isLength({ min: 5 })
    .withMessage("Valid message ID required"),
  body("status")
    .isIn(["sent", "delivered", "read", "failed"])
    .withMessage("Invalid status"),
  handleValidationErrors,
];

const validateGetConversations = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage("Limit must be between 1 and 50"),
  handleValidationErrors,
];

const validateUserRegister = [
  body("username")
    .isLength({ min: 3, max: 30 })
    .withMessage("Username 3-30 chars")
    .matches(/^[a-z0-9_]+$/)
    .withMessage("Lowercase letters, numbers, underscores only"),
  body("name").isLength({ min: 1, max: 80 }).withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email required"),
  body("phone").isMobilePhone().withMessage("Valid phone required"),
  handleValidationErrors,
];

module.exports = {
  validateWebhook,
  validateSendMessage,
  validateGetMessages,
  validateSearchMessages,
  validateUpdateMessageStatus,
  validateGetConversations,
  validateUserRegister,
  handleValidationErrors,
};
