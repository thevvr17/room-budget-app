import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Dashboard from "./Dashboard";
import Members from "./Members";
import Requests from "./Requests";

import api from "../services/api";

export default function MainLayout() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const roomId = "69dbe53a583d97f6bb22ac2b";

  const [tab, setTab] = useState("home");
  const [requestCount, setRequestCount] = useState(0);

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

  useEffect(() => {
    fetchRequestCount();
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
              ? "grid-cols-4"
              : "grid-cols-3"
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