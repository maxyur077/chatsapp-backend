const UserService = require("../services/userService");

class UserController {
  constructor() {
    this.userService = new UserService();
  }

  async register(req, res, next) {
    try {
      const { username, name, email, phone } = req.body;
      const user = await this.userService.register({
        username,
        name,
        email,
        phone,
      });
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }

  async getByUsername(req, res, next) {
    try {
      const { username } = req.params;
      const user = await this.userService.getByUsername(username);
      res.json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = UserController;
