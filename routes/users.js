const express = require("express");
const UserController = require("../controllers/userController");
const { validateUserRegister } = require("../middleware/validation");

const router = express.Router();
const userController = new UserController();

router.post("/register", validateUserRegister, userController.register);
router.get("/:username", userController.getByUsername);

module.exports = router;
