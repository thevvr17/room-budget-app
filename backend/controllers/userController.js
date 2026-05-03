const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Room = require("../models/Room");
const JoinRequest = require("../models/JoinRequest");

exports.getStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // Check room membership
    const room = await Room.findOne({
      members: userId
    });

    if (room) {
      return res.json({
        hasRoom: true,
        roomId: room._id,
        pending: false
      });
    }

    // Check pending request
    const request = await JoinRequest.findOne({
      userId,
      status: "pending"
    });

    if (request) {
      return res.json({
        hasRoom: false,
        pending: true,
        roomId: request.roomId
      });
    }

    // No room / no request
    res.json({
      hasRoom: false,
      pending: false
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await user.save();

const userData = {
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
};

res.status(201).json({
  message: "User registered successfully",
  user: userData
});

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};