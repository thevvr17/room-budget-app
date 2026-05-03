const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { resetMonth } = require("../controllers/adminController");
const {
  getRequests,
  approveRequest,
  rejectRequest
} = require("../controllers/adminController");

router.post("/reset-month", authMiddleware, resetMonth);

router.get(
  "/requests/:roomId",
  authMiddleware,
  getRequests
);

router.post(
  "/approve-request",
  authMiddleware,
  approveRequest
);

router.post(
  "/reject-request",
  authMiddleware,
  rejectRequest
);

module.exports = router;