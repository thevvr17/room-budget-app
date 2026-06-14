import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import socket from "../services/socket";
import toast from "react-hot-toast";

export default function Settlements() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (e) {
    user = null;
  }
  const roomId = user?.roomId;
  const [settlements, setSettlements] = useState([]);

  const fetchSettlements = async () => {
    try {
      const response = await api.get(`/settlements/room/${roomId}`, {
        headers: { Authorization: token },
      });
      setSettlements(response.data.settlements || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load settlements");
    }
  };

  useEffect(() => {
    fetchSettlements();
    const refresh = () => fetchSettlements();
    socket.on("settlements-updated", refresh);

    return () => {
      socket.off("settlements-updated", refresh);
    };
  }, []);

  const mine = useMemo(
    () =>
      settlements.filter(
        (item) =>
          item.toUser?._id === user?._id ||
          item.fromUser?._id === user?._id,
      ),
    [settlements, user?._id],
  );

  const grouped = {
    pending: mine.filter(
      (item) => item.status === "pending" && item.relatedExpenseId,
    ),
    paid: mine.filter((item) => item.status === "paid"),
    waived: mine.filter((item) => item.status === "waived"),
  };

  const renderList = (title, items, tone) => (
    <div className="mt-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">{title}</h2>
      {items.length === 0 ? (
        <div className="bg-white/5 rounded-2xl p-4 text-slate-400">
          No {title.toLowerCase()}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item._id} className="bg-white/5 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {item.relatedExpenseId?.title || "Expense settlement"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 capitalize">
                    {item.relatedExpenseId?.category || "expense"}
                  </p>
                </div>
                <p className="font-bold shrink-0">₹{item.amount}</p>
              </div>
              <p className={`text-sm mt-3 ${tone}`}>
                {item.status === "pending"
                  ? "Waiting for admin approval/payment"
                  : item.status === "paid"
                    ? "Approved and paid by admin"
                    : "Waived"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Admin: {item.fromUser?.name || "Admin"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-5 pb-10">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 rounded-xl bg-white/10"
        >
          Back
        </button>
        <h1 className="text-xl font-bold">Settlement Status</h1>
      </div>

      {renderList("Pending Requests", grouped.pending, "text-amber-300")}
      {renderList("Approved Payments", grouped.paid, "text-emerald-300")}
      {renderList("Waived Payments", grouped.waived, "text-slate-300")}
    </div>
  );
}
