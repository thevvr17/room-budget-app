import { useEffect, useState } from "react";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Requests() {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const roomId = "69dbe53a583d97f6bb22ac2b";

  const [requests, setRequests] = useState([]);

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

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchRequests();
    }
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

    } catch (error) {
      toast.error("Failed");
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

      <h1 className="text-xl font-bold mb-5">
        Join Requests
      </h1>

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

    </div>
  );
}