import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function JoinRoom() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    user = null;
  }
  const isAdmin = user?.role === "admin";

  const [roomId, setRoomId] = useState("");
  const [roomName, setRoomName] = useState("");

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

  const createRoom = async () => {
    if (!roomName.trim()) {
      return toast.error("Room name is required");
    }
    
    try {
      const res = await api.post(
        "/rooms/create",
        { name: roomName },
        {
          headers: {
            Authorization: token
          }
        }
      );
      
      toast.success("Room created successfully!");
      
      // Update local storage user with the new roomId
      const updatedUser = { ...user, roomId: res.data.room._id };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      navigate("/dashboard");

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Failed to create room"
      );
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Logged out successfully");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4 relative">
      
      {/* Logout button at top-right */}
      <div className="absolute top-5 right-5">
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-semibold border border-red-500/20 transition"
        >
          Logout
        </button>
      </div>

      {isAdmin ? (
        <div className="w-full max-w-sm bg-white/5 rounded-3xl p-6">
          <h1 className="text-2xl font-bold text-center">
            Create Room
          </h1>

          <p className="text-slate-400 text-sm text-center mt-2">
            Establish a new room to start tracking expenses
          </p>

          <input
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="Enter Room Name"
            className="w-full mt-5 px-4 py-3 rounded-xl bg-slate-800 outline-none"
          />

          <button
            onClick={createRoom}
            className="w-full mt-4 bg-indigo-500 py-3 rounded-xl font-semibold hover:bg-indigo-600 transition"
          >
            Create Room
          </button>
        </div>
      ) : (
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
            className="w-full mt-4 bg-indigo-500 py-3 rounded-xl font-semibold hover:bg-indigo-600 transition"
          >
            Send Request
          </button>
        </div>
      )}
    </div>
  );
}
