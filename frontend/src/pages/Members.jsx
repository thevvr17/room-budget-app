import { useEffect, useState } from "react";
import api from "../services/api";
import socket from "../services/socket";
import toast from "react-hot-toast";

export default function Members() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const roomId = user?.roomId;

  const [room, setRoom] = useState(null);
  const [leaveDates, setLeaveDates] = useState({});
  const [requestedLeavingAt, setRequestedLeavingAt] = useState("");
  const [leaveRequest, setLeaveRequest] = useState(null);
  const [leaveCooldownUntil, setLeaveCooldownUntil] = useState(null);

  const fetchMembers = async () => {
    try {
      const response = await api.get(`/rooms/${roomId}`, {
        headers: { Authorization: token },
      });
      setRoom(response.data.room);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load members");
    }
  };

  const fetchLeaveRequest = async () => {
    if (user?.role === "admin") return;

    try {
      const response = await api.get(`/rooms/leave-request/${roomId}`, {
        headers: { Authorization: token },
      });
      setLeaveRequest(response.data.leaveRequest);
      setLeaveCooldownUntil(response.data.cooldownUntil || null);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load leave request",
      );
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchLeaveRequest();
    const handleMembersUpdated = () => fetchMembers();
    const handleLeaveRequestUpdated = () => {
      fetchMembers();
      fetchLeaveRequest();
    };
    socket.on("members-updated", handleMembersUpdated);
    socket.on("leave-request-updated", handleLeaveRequestUpdated);

    return () => {
      socket.off("members-updated", handleMembersUpdated);
      socket.off("leave-request-updated", handleLeaveRequestUpdated);
    };
  }, []);

  const requestLeave = async () => {
    if (!requestedLeavingAt) {
      return toast.error("Choose your requested final day");
    }

    try {
      const response = await api.post(
        "/rooms/leave",
        { roomId, requestedLeavingAt },
        { headers: { Authorization: token } },
      );
      toast.success(response.data.message);
      setLeaveRequest(response.data.leaveRequest);
      setLeaveCooldownUntil(null);
    } catch (error) {
      if (error.response?.data?.cooldownUntil) {
        setLeaveCooldownUntil(error.response.data.cooldownUntil);
      }
      toast.error(error.response?.data?.message || "Failed to request leave");
    }
  };

  const scheduleLeave = async (memberId) => {
    const leavingAt = leaveDates[memberId];
    if (!leavingAt) return toast.error("Choose the member's final day");

    try {
      const response = await api.post(
        "/admin/schedule-leave",
        { roomId, userId: memberId, leavingAt },
        { headers: { Authorization: token } },
      );
      toast.success(response.data.message);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to schedule leave");
    }
  };

  const removeMember = async (memberId) => {
    try {
      const response = await api.post(
        "/admin/remove-member",
        { roomId, userId: memberId },
        { headers: { Authorization: token } },
      );
      toast.success(response.data.message);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  };

  const cancelLeave = async (memberId) => {
    try {
      const response = await api.post(
        "/admin/cancel-leave",
        { roomId, userId: memberId },
        { headers: { Authorization: token } },
      );
      toast.success(response.data.message);
      fetchMembers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel leave");
    }
  };

  const formatDate = (value) =>
    value ? new Date(value).toLocaleDateString("en-IN") : "Not set";

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const isAdmin = room.admin?._id === user?._id;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-5 pb-10">
      <h1 className="text-xl font-bold mb-5">Members</h1>

      <div className="bg-indigo-500 rounded-2xl p-5 mb-5">
        <p className="text-indigo-100 text-sm">Room</p>
        <h2 className="text-2xl font-bold mt-1">{room.name}</h2>
        <p className="text-indigo-100 text-sm mt-2">
          {room.members?.length || 0} active members
        </p>
      </div>

      <div className="space-y-3">
        {room.members?.map((member) => (
          <div
            key={member._id}
            className="bg-white/5 rounded-2xl p-4"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{member.name}</p>
                <p className="text-sm text-slate-400 truncate">{member.email}</p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full shrink-0 ${
                  member._id === room.admin._id
                    ? "bg-yellow-400/20 text-yellow-300"
                    : member.membership?.status === "scheduled_leave"
                      ? "bg-amber-400/20 text-amber-300"
                      : "bg-emerald-400/20 text-emerald-300"
                }`}
              >
                {member._id === room.admin._id
                  ? "Admin"
                  : member.membership?.status === "scheduled_leave"
                    ? "Leaving"
                    : "Active"}
              </span>
            </div>
            {member._id !== room.admin._id && (
              <div className="grid grid-cols-2 gap-3 mt-3 text-xs text-slate-400">
                <p>Joined: {formatDate(member.membership?.joinedAt)}</p>
                <p>Final day: {formatDate(member.membership?.leavingAt)}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {isAdmin && (
        <div className="mt-7">
          <h2 className="text-lg font-semibold mb-3">Member Departures</h2>
          <div className="space-y-3">
            {room.members
              ?.filter((member) => member._id !== room.admin._id)
              .map((member) => (
                <div key={member._id} className="bg-white/5 rounded-2xl p-4">
                  <div className="flex justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-xs text-slate-400">
                        Final day: {formatDate(member.membership?.leavingAt)}
                      </p>
                    </div>
                    {member.membership?.status === "scheduled_leave" && (
                      <span className="text-xs text-amber-300">Scheduled</span>
                    )}
                  </div>
                  <div className="grid grid-cols-[1fr_auto] gap-2">
                    <input
                      type="date"
                      value={leaveDates[member._id] || ""}
                      onChange={(event) =>
                        setLeaveDates((current) => ({
                          ...current,
                          [member._id]: event.target.value,
                        }))
                      }
                      className="min-w-0 px-3 py-2 rounded-xl bg-slate-800 outline-none"
                    />
                    <button
                      onClick={() => scheduleLeave(member._id)}
                      className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold"
                    >
                      Schedule
                    </button>
                  </div>
                  <button
                    onClick={() => removeMember(member._id)}
                    className="w-full mt-2 py-2 rounded-xl bg-red-500 font-semibold"
                  >
                    Confirm Removal
                  </button>
                  {member.membership?.status === "scheduled_leave" && (
                    <button
                      onClick={() => cancelLeave(member._id)}
                      className="w-full mt-2 py-2 rounded-xl bg-white/10 font-semibold"
                    >
                      Cancel Leave Request
                    </button>
                  )}
                  <p className="text-xs text-slate-500 mt-2">
                    Scheduling only sets the final billable day. Removal is
                    manual and is allowed after that day when dues are clear.
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="mt-7 bg-white/5 rounded-2xl p-5">
          <h2 className="text-lg font-semibold">Leave Request</h2>

          {leaveRequest ? (
            <div className="mt-3">
              <p className="text-amber-300 font-medium">
                {leaveRequest.status === "scheduled"
                  ? "Leave date scheduled"
                  : "Request sent - under admin review"}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                Requested final day:{" "}
                {formatDate(leaveRequest.requestedLeavingAt)}
              </p>
              {leaveRequest.scheduledLeavingAt && (
                <p className="text-sm text-emerald-300 mt-1">
                  Admin scheduled: {formatDate(leaveRequest.scheduledLeavingAt)}
                </p>
              )}
              <p className="text-xs text-slate-500 mt-3">
                Settle all pending payments before the admin can confirm your
                removal.
              </p>
            </div>
          ) : leaveCooldownUntil ? (
            <div className="mt-3">
              <p className="text-slate-300 font-medium">
                Leave request temporarily disabled
              </p>
              <p className="text-sm text-slate-400 mt-2">
                You can request again after{" "}
                {new Date(leaveCooldownUntil).toLocaleString("en-IN")}.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-400 mt-2">
                Tell the admin your preferred final day.
              </p>
              <input
                type="date"
                value={requestedLeavingAt}
                onChange={(event) => setRequestedLeavingAt(event.target.value)}
                className="w-full mt-4 px-3 py-3 rounded-xl bg-slate-800 outline-none"
              />
              <button
                onClick={requestLeave}
                className="w-full mt-3 bg-red-500 py-3 rounded-xl font-semibold"
              >
                Send Leave Request
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
