const express = require("express");
const UserController = require("../controllers/userController");
const {
  validateUserRegister,
  validateUserLogin,
} = require("../middleware/validation");
const auth = require("../middleware/auth");

const router = express.Router();
const userController = new UserController();

// Public routes
router.post("/register", validateUserRegister, (req, res) =>
  userController.register(req, res)
);

router.post("/login", validateUserLogin, (req, res) =>
  userController.login(req, res)
);

router.get("/:username", (req, res) => userController.getByUsername(req, res));

// Protected routes
router.get("/", auth, (req, res) => userController.getAllUsers(req, res));

router.get("/profile", auth, (req, res) => userController.getProfile(req, res));

module.exports = router;
