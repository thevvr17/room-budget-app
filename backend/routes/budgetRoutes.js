const express = require("express");
const router = express.Router();

const { createBudget } = require("../controllers/budgetController");
const { addTopUp } = require("../controllers/budgetController");
const { getBalance } = require("../controllers/budgetController");


const authMiddleware = require("../middleware/authMiddleware");

router.post("/create", authMiddleware, createBudget);
router.post("/topup", authMiddleware, addTopUp);
router.get("/balance/:roomId", authMiddleware, getBalance);

module.exports = router;