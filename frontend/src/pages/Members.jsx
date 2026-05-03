// ===============================
// src/pages/Members.jsx
// CREATE NEW FILE
// ===============================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Members() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const roomId = "69dbe53a583d97f6bb22ac2b";

  const [room, setRoom] = useState(null);
  const [email, setEmail] = useState("");

const fetchMembers = async () => {
  try {
    const res = await api.get(`/rooms/${roomId}`, {
      headers: {
        Authorization: token
      }
    });

    setRoom(res.data.room);

  } catch (error) {
    console.log(error);
  }
};

  useEffect(() => {
    fetchMembers();
  }, []);

  const addMember = async () => {
  try {
    const res = await api.post(
      "/rooms/add-member",
      {
        roomId,
        email
      },
      {
        headers: {
          Authorization: token
        }
      }
    );

    toast.success(res.data.message);

    setEmail("");
    fetchMembers();

  } catch (error) {
    console.log(error.response?.data);

    toast.error(
      error.response?.data?.message ||
      "Failed to add member"
    );
  }
};
  const leaveRoom = async () => {
    try {
      await api.post(
        "/rooms/leave",
        {
          roomId
        },
        {
          headers: {
            Authorization: token
          }
        }
      );

      navigate("/dashboard");

    } catch (error) {
      toast.error("Failed to leave room");
    }
  };

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-5 pb-10">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">

        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm"
        >
          ← Back
        </button>

        <h1 className="text-xl font-bold">
          Members
        </h1>

        <div></div>
      </div>

      {/* Room Name */}
      <div className="bg-indigo-500 rounded-3xl p-5 mb-5">
        <p className="text-indigo-100 text-sm">
          Room Name
        </p>

        <h2 className="text-2xl font-bold mt-1">
          {room.name}
        </h2>
      </div>

      {/* Members List */}
      <div className="space-y-3">

        {room.members?.map((member) => (
          <div
            key={member._id}
            className="bg-white/5 rounded-2xl p-4 flex justify-between items-center"
          >
            <div>
              <p className="font-semibold">
                {member.name}
              </p>

              <p className="text-sm text-slate-400">
                {member.email}
              </p>
            </div>

            <div>
              {member._id === room.admin._id ? (
                <span className="text-yellow-400 text-sm">
                  👑 Admin
                </span>
              ) : (
                <span className="text-slate-400 text-sm">
                  Member
                </span>
              )}
            </div>
          </div>
        ))}

      </div>

      {/* Add Member (Admin Only) */}
      {user.role === "admin" && (
        <div className="mt-7 bg-white/5 rounded-3xl p-5">

          <h2 className="text-lg font-semibold mb-4">
            Add Member
          </h2>

          <input
            type="email"
            placeholder="Enter member email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800 outline-none mb-4"
          />

          <button
            onClick={addMember}
            className="w-full bg-emerald-500 py-3 rounded-xl font-semibold"
          >
            + Add Member
          </button>

        </div>
      )}

      {/* Leave Room */}
      <div className="mt-6">
        <button
          onClick={leaveRoom}
          className="w-full bg-red-500 py-3 rounded-xl font-semibold"
        >
          Leave Room
        </button>
      </div>

    </div>
  );
}