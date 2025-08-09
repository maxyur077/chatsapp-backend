const User = require("../models/User");
const { sanitizeInput, sanitizePhoneNumber } = require("../utils/sanitization");

class UserService {
  async register({ username, name, email, phone }) {
    const cleanUsername = sanitizeInput(username.toLowerCase());
    const cleanName = sanitizeInput(name);
    const cleanEmail = sanitizeInput(email.toLowerCase());
    const cleanPhone = sanitizePhoneNumber(phone);

    // Check for existing user
    const existing = await User.findOne({
      $or: [
        { username: cleanUsername },
        { email: cleanEmail },
        { phone: cleanPhone },
      ],
    });

    if (existing) {
      const reason =
        existing.username === cleanUsername
          ? "username"
          : existing.email === cleanEmail
          ? "email"
          : "phone";
      const err = new Error(`${reason} already in use`);
      err.status = 409;
      throw err;
    }

    const user = await User.create({
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
    });

    return user.toObject();
  }

  async getByUsername(username) {
    const user = await User.findOne({
      username: username.toLowerCase(),
    }).lean();
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }
    return user;
  }
}

module.exports = UserService;
