const mongoose = require("mongoose");
const Room = require("../models/Room");

const getRoomId = (req) => req.params.roomId || req.body.roomId;

const loadRoom = async (req, res) => {
  const roomId = getRoomId(req);

  if (!roomId || !mongoose.Types.ObjectId.isValid(roomId)) {
    res.status(400).json({ message: "Invalid Room ID" });
    return null;
  }

  const room = await Room.findById(roomId);

  if (!room) {
    res.status(404).json({ message: "Room not found" });
    return null;
  }

  req.room = room;
  return room;
};

const isRoomAdmin = (room, userId) => {
  if (!room || !userId) return false;
  const userStr = userId.toString();
  const primaryAdmin = room.admin ? room.admin.toString() : null;
  const inAdminsList = Array.isArray(room.admins) && room.admins.some((a) => (a?._id || a).toString() === userStr);
  return primaryAdmin === userStr || inAdminsList;
};

const isRoomMember = (room, userId) => {
  if (!room || !userId) return false;
  const userStr = userId.toString();
  return (
    isRoomAdmin(room, userStr) ||
    (Array.isArray(room.members) && room.members.some((m) => (m?._id || m).toString() === userStr))
  );
};

exports.requireRoomMember = async (req, res, next) => {
  try {
    const room = await loadRoom(req, res);
    if (!room) return;

    if (!isRoomMember(room, req.user.id)) {
      return res.status(403).json({ message: "Room access denied" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.requireRoomAdmin = async (req, res, next) => {
  try {
    const room = await loadRoom(req, res);
    if (!room) return;

    if (!isRoomAdmin(room, req.user.id)) {
      return res.status(403).json({ message: "Admin only" });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.isRoomAdmin = isRoomAdmin;
exports.isRoomMember = isRoomMember;
