const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Room = require("../models/Room");
const JoinRequest = require("../models/JoinRequest");
const jwt = require("jsonwebtoken");

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
    const { name, email, password, isAdminRequested, adminCode } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    let assignedRole = "member";
    if (isAdminRequested) {
      const codeToMatch = process.env.ADMIN_SECRET_CODE || "FIRSTPROJECT";
      if (adminCode === codeToMatch) {
        assignedRole = "admin";
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: assignedRole
    });

    await user.save();

    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    let responseMessage = "User registered successfully";
    if (isAdminRequested) {
      if (user.role === "admin") {
        responseMessage = "User registered successfully as Admin";
      } else {
        responseMessage = "User registered successfully as Member (admin code invalid)";
      }
    }

    res.status(201).json({
      message: responseMessage,
      user: userData
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid credentials"
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    // FIND USER ROOM
    const room = await Room.findOne({
      $or: [
        { admin: user._id },
        { members: user._id }
      ]
    });

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roomId: room ? room._id : null
      }
    });

  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};
