import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function JoinRoom() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");

  const [roomId, setRoomId] = useState("");

  const sendRequest = async () => {
    if (!roomId.trim()) {
  return toast.error("Room ID is required");
}

if (roomId.trim().length !== 24) {
  return toast.error("Invalid Room ID");
}
    try {
      await api.post(
        "/rooms/join-request",
        { roomId },
        {
          headers: {
            Authorization: token
          }
        }
      );

      navigate("/pending");

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Failed to send request"
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">

      <div className="w-full max-w-sm bg-white/5 rounded-3xl p-6">

        <h1 className="text-2xl font-bold text-center">
          Join Room
        </h1>

        <p className="text-slate-400 text-sm text-center mt-2">
          Ask admin for Room ID
        </p>

        <input
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
          className="w-full mt-5 px-4 py-3 rounded-xl bg-slate-800 outline-none"
        />

        <button
          onClick={sendRequest}
          className="w-full mt-4 bg-indigo-500 py-3 rounded-xl font-semibold"
        >
          Send Request
        </button>

      </div>

    </div>
  );
}