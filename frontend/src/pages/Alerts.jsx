import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import socket from "../services/socket";

export default function Alerts({ refreshBadge }) {
  const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));
const roomId = user?.roomId;

  const isAdmin = user?.role === "admin";

  const [items, setItems] = useState([]);

  const fetchAlerts = async () => {
    try {
      const res = await api.get(`/notifications/${roomId}`, {
        headers: { Authorization: token }
      });

      setItems(res.data.notifications || []);
    } catch (error) {
      toast.error("Failed to load alerts");
    }
  };

useEffect(() => {
  fetchAlerts();

  socket.emit("join-room", { roomId, token });

  const handleNewAlert = () => {
    fetchAlerts();
  };

  const handleAlertResolved = () => {
    fetchAlerts();
  };

  socket.on("new-alert", handleNewAlert);
  socket.on("alert-resolved", handleAlertResolved);

  return () => {
    socket.off("new-alert", handleNewAlert);
    socket.off("alert-resolved", handleAlertResolved);
  };
}, []);

  const resolveAlert = async (id) => {
    try {
      await api.put(
        `/notifications/resolve/${id}`,
        {},
        {
          headers: { Authorization: token }
        }
      );

toast.success("Resolved");
fetchAlerts();
refreshBadge?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed");
    }
  };

  return (
    <div className="p-4 pb-24 text-white">
      <h1 className="text-xl font-bold mb-4">Alerts</h1>

      <div className="space-y-3">
        {items.length === 0 && (
          <div className="bg-white/5 p-4 rounded-2xl">
            No alerts
          </div>
        )}

        {items.map((item) => (
          <div
            key={item._id}
            className="bg-white/5 p-4 rounded-2xl"
          >
            <p className="font-medium">{item.message}</p>

            <p className="text-sm text-slate-300 mt-2">
              Created by {item.createdBy?.name || "Unknown"}
            </p>

            <p className="text-xs text-slate-400 mt-1">
              {new Date(item.createdAt).toLocaleString()}
            </p>

            {item.status === "active" ? (
              <>
                {isAdmin ? (
                  <button
                    onClick={() => resolveAlert(item._id)}
                    className="mt-3 bg-indigo-500 px-4 py-2 rounded-xl text-sm"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <p className="text-yellow-400 text-sm mt-3">
                    Waiting for admin approval
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-emerald-400 mt-3">
                Resolved by {item.resolvedBy?.name || "Admin"}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
