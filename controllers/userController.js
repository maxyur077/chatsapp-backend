const User = require("../models/User");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

class UserController {
  async register(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { username, name, email, phone, password } = req.body;

      const existingUser = await User.findOne({
        $or: [{ email }, { username }, { phone }],
      });

      if (existingUser) {
        let field = "User";
        if (existingUser.email === email) field = "Email";
        else if (existingUser.username === username) field = "Username";
        else if (existingUser.phone === phone) field = "Phone";

        return res.status(400).json({
          success: false,
          message: `${field} already exists`,
        });
      }

      const user = new User({
        username,
        name,
        email,
        phone,
        password,
      });

      const savedUser = await user.save();

      const token = generateToken({
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
      });

      res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          id: savedUser._id,
          username: savedUser.username,
          name: savedUser.name,
          email: savedUser.email,
          phone: savedUser.phone,
          token,
          createdAt: savedUser.createdAt,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);

      if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json({
          success: false,
          message: `${
            field.charAt(0).toUpperCase() + field.slice(1)
          } already exists`,
        });
      }

      res.status(500).json({
        success: false,
        message: "Server error during registration",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { username, password } = req.body;

      const user = await User.findOne({
        $or: [{ username }, { email: username }],
      }).select("+password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const isPasswordCorrect = await user.comparePassword(password);

      if (!isPasswordCorrect) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      const token = generateToken({
        id: user._id,
        username: user.username,
        email: user.email,
      });

      res.status(200).json({
        success: true,
        message: "Login successful",
        data: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          token,
          loginAt: new Date(),
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during login",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async getByUsername(req, res) {
    try {
      const { username } = req.params;

      const user = await User.findOne({ username });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async getAllUsers(req, res) {
    try {
      const users = await User.find({})
        .select("-password")
        .sort({ createdAt: -1 });

      const usersWithStatus = users.map((user) => ({
        ...user.toObject(),
        isOnline: Math.random() > 0.5,
        lastSeen: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      }));

      res.status(200).json({
        success: true,
        data: usersWithStatus,
      });
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        data: {
          id: user._id,
          username: user.username,
          name: user.name,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
    } catch (error) {
      console.error("Get profile error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Internal server error",
      });
    }
  }
}

module.exports = UserController;
