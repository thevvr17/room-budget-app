const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const { resetMonth } = require("../controllers/adminController");
const {
  getRequests,
  approveRequest,
  rejectRequest,
  scheduleMemberLeave,
  removeMember,
  cancelLeaveRequest
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

router.post("/schedule-leave", authMiddleware, scheduleMemberLeave);
router.post("/cancel-leave", authMiddleware, cancelLeaveRequest);
router.post("/remove-member", authMiddleware, removeMember);

module.exports = router;
