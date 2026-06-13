import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Dashboard from "./Dashboard";
import Members from "./Members";
import Requests from "./Requests";
import Alerts from "./Alerts";
import api from "../services/api";
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");

export default function MainLayout() {
  const navigate = useNavigate();

  let user = null;

try {
  user = JSON.parse(localStorage.getItem("user"));
} catch {
  localStorage.removeItem("user");
}
  const token = localStorage.getItem("token");


const roomId = user?.roomId;

  const [tab, setTab] = useState("home");
  const [requestCount, setRequestCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  const fetchRequestCount = async () => {
    try {
      if (user?.role !== "admin") return;

      const res = await api.get(
        `/admin/requests/${roomId}`,
        {
          headers: {
            Authorization: token
          }
        }
      );

      setRequestCount(
        res.data.requests?.length || 0
      );

    } catch (error) {
      console.log(error);
    }
  };

  const fetchAlertCount = async () => {
  try {
    const res = await api.get(
      `/notifications/${roomId}`,
      {
        headers: {
          Authorization: token
        }
      }
    );

    const active =
      res.data.notifications.filter(
        (x) => x.status === "active"
      ).length;

    setAlertCount(active);

  } catch (error) {
    console.log(error);
  }
};

useEffect(() => {
  fetchRequestCount();
  fetchAlertCount();

  socket.emit("join-room", roomId);

  socket.on("new-alert", () => {
    fetchAlertCount();
  });

  socket.on("alert-resolved", () => {
    fetchAlertCount();
  });

  return () => {
    socket.off("new-alert");
    socket.off("alert-resolved");
  };
}, []);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-24">

      {/* Pages */}
      {tab === "home" && <Dashboard />}

      {tab === "members" && <Members />}
      {tab === "alerts" && <Alerts />}

      {tab === "requests" &&
        user?.role === "admin" && (
          <Requests
            refreshBadge={fetchRequestCount}
          />
        )}

      {tab === "more" && (
        <div className="p-5">

          <h1 className="text-xl font-bold mb-5">
            More
          </h1>

          <div className="bg-white/5 rounded-2xl p-4 mb-4">
            <p className="text-slate-400 text-sm">
              Logged in as
            </p>

            <p className="font-semibold mt-1">
              {user?.name}
            </p>

            <p className="text-sm text-slate-400">
              {user?.email}
            </p>
          </div>

          <button
            onClick={logout}
            className="w-full bg-red-500 py-3 rounded-xl font-semibold"
          >
            Logout
          </button>

        </div>
      )}

      {/* Tabs */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-white/10 px-2 py-2">

        <div
          className={`grid gap-2 max-w-md mx-auto ${
            user?.role === "admin"
              ? "grid-cols-5"
              : "grid-cols-4"
          }`}
        >

          <button
            onClick={() => setTab("home")}
            className={`py-2 rounded-xl text-sm ${
              tab === "home"
                ? "bg-indigo-500 text-white"
                : "text-slate-400"
            }`}
          >
            🏠 Home
          </button>

          <button
            onClick={() => setTab("members")}
            className={`py-2 rounded-xl text-sm ${
              tab === "members"
                ? "bg-indigo-500 text-white"
                : "text-slate-400"
            }`}
          >
            👥 Members
          </button>

          {user?.role === "admin" && (
            <button
              onClick={() => {
                setTab("requests");
                fetchRequestCount();
              }}
              className={`relative py-2 rounded-xl text-sm ${
                tab === "requests"
                  ? "bg-indigo-500 text-white"
                  : "text-slate-400"
              }`}
            >
              📨 Requests

              {requestCount > 0 && (
                <span className="absolute -top-1 right-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
                  {requestCount}
                </span>
              )}
            </button>
          )}

          <button
  onClick={() => {
    setTab("alerts");
    fetchAlertCount();
  }}
  className={`relative py-2 rounded-xl text-sm ${
    tab === "alerts"
      ? "bg-indigo-500 text-white"
      : "text-slate-400"
  }`}
>
  🔔 Alerts

  {alertCount > 0 && (
    <span className="absolute -top-1 right-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full">
      {alertCount}
    </span>
  )}
</button>

          <button
            onClick={() => setTab("more")}
            className={`py-2 rounded-xl text-sm ${
              tab === "more"
                ? "bg-indigo-500 text-white"
                : "text-slate-400"
            }`}
          >
            ⚙️ More
          </button>

        </div>

      </div>

    </div>
  );
}