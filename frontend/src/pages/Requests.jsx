import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import socket from "../services/socket";

export default function Requests({ refreshBadge }) {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    user = null;
  }
  const roomId = user?.roomId;

  const [requests, setRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [scheduleDates, setScheduleDates] = useState({});
  const fetchRequests = async () => {
    try {
      const res = await api.get(
        `/admin/requests/${roomId}`,
        {
          headers: {
            Authorization: token
          }
        }
      );

      setRequests(res.data.requests || []);
      setLeaveRequests(res.data.leaveRequests || []);

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchRequests();
    }

    const handleJoinRequestChange = () => {
      fetchRequests();
      refreshBadge?.();
    };

    socket.on("join-request-created", handleJoinRequestChange);
    socket.on("join-request-updated", handleJoinRequestChange);
    socket.on("leave-request-updated", handleJoinRequestChange);

    return () => {
      socket.off("join-request-created", handleJoinRequestChange);
      socket.off("join-request-updated", handleJoinRequestChange);
      socket.off("leave-request-updated", handleJoinRequestChange);
    };
  }, []);

  const approve = async (requestId) => {
    try {
      await api.post(
        "/admin/approve-request",
        { requestId },
        {
          headers: {
            Authorization: token
          }
        }
      );

      fetchRequests();
      refreshBadge?.();

    } catch (error) {
      toast.error("Failed");
    }
  };

  const reject = async (requestId) => {
    try {
      await api.post(
        "/admin/reject-request",
        { requestId },
        {
          headers: {
            Authorization: token
          }
        }
      );

      fetchRequests();
      refreshBadge?.();

    } catch (error) {
      toast.error("Failed");
    }
  };

  const scheduleLeave = async (request) => {
    const leavingAt =
      scheduleDates[request._id] ||
      request.requestedLeavingAt?.slice(0, 10);

    if (!leavingAt) return toast.error("Choose the final active day");

    try {
      await api.post(
        "/admin/schedule-leave",
        {
          roomId,
          userId: request.userId?._id,
          leavingAt,
        },
        { headers: { Authorization: token } },
      );

      toast.success("Final day scheduled");
      fetchRequests();
      refreshBadge?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to schedule leave");
    }
  };

  const cancelLeave = async (request) => {
    try {
      await api.post(
        "/admin/cancel-leave",
        {
          roomId,
          userId: request.userId?._id,
        },
        { headers: { Authorization: token } },
      );

      toast.success("Leave request cancelled");
      fetchRequests();
      refreshBadge?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to cancel request");
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="p-5 text-white">
        Only admin can view requests.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-5 pb-24">

      <h1 className="text-xl font-bold mb-5">Requests</h1>

      <h2 className="text-sm font-semibold text-slate-300 mb-3">
        Join Requests
      </h2>

      {requests.length === 0 ? (
        <div className="bg-white/5 rounded-2xl p-4">
          No pending requests
        </div>
      ) : (
        <div className="space-y-3">

          {requests.map((item) => (
            <div
              key={item._id}
              className="bg-white/5 rounded-2xl p-4"
            >
              <p className="font-semibold">
                {item.userId?.name}
              </p>

              <p className="text-sm text-slate-400">
                {item.userId?.email}
              </p>

              <div className="grid grid-cols-2 gap-3 mt-4">

                <button
                  onClick={() => approve(item._id)}
                  className="py-2 rounded-xl bg-emerald-500 font-semibold"
                >
                  Approve
                </button>

                <button
                  onClick={() => reject(item._id)}
                  className="py-2 rounded-xl bg-red-500 font-semibold"
                >
                  Reject
                </button>

              </div>
            </div>
          ))}

        </div>
      )}

      <h2 className="text-sm font-semibold text-slate-300 mt-7 mb-3">
        Leave Requests
      </h2>

      {leaveRequests.length === 0 ? (
        <div className="bg-white/5 rounded-2xl p-4">
          No pending leave requests
        </div>
      ) : (
        <div className="space-y-3">
          {leaveRequests.map((item) => {
            const requestedDate = item.requestedLeavingAt?.slice(0, 10);

            return (
              <div key={item._id} className="bg-white/5 rounded-2xl p-4">
                <p className="font-semibold">{item.userId?.name}</p>
                <p className="text-sm text-slate-400">{item.userId?.email}</p>
                <p className="text-sm text-amber-300 mt-3">
                  Requested final day:{" "}
                  {new Date(item.requestedLeavingAt).toLocaleDateString("en-IN")}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Review pending settlements before confirming the date.
                </p>

                <div className="grid grid-cols-[1fr_auto] gap-2 mt-4">
                  <input
                    type="date"
                    value={scheduleDates[item._id] || requestedDate || ""}
                    onChange={(event) =>
                      setScheduleDates((current) => ({
                        ...current,
                        [item._id]: event.target.value,
                      }))
                    }
                    className="min-w-0 px-3 py-2 rounded-xl bg-slate-800 outline-none"
                  />
                  <button
                    onClick={() => scheduleLeave(item)}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-semibold"
                  >
                    Schedule
                  </button>
                </div>
                <button
                  onClick={() => cancelLeave(item)}
                  className="w-full mt-2 py-2 rounded-xl bg-white/10 font-semibold"
                >
                  Cancel Request
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
