const express = require("express");
const router = express.Router();

const { getDashboard } = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/:roomId", authMiddleware, getDashboard);

module.exports = router;