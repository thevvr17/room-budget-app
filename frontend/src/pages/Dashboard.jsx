import { useEffect, useState } from "react";
import api from "../services/api";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  const [topUpAmount, setTopUpAmount] = useState("");
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "food",
  });
  const navigate = useNavigate();
  const roomId = "69dbe53a583d97f6bb22ac2b";

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard");
    } catch (error) {
      toast.error("Copy failed");
    }
  };

  const fetchDashboard = async () => {
    try {
      const res = await api.get(`/dashboard/${roomId}`, {
        headers: {
          Authorization: token,
        },
        params: {
          t: Date.now(),
        },
      });

      setData(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const addExpense = async () => {
    if (!expenseForm.title.trim()) {
      return toast.error("Expense title required");
    }

    if (expenseForm.title.trim().length < 2) {
      return toast.error("Title too short");
    }

    if (!expenseForm.amount) {
      return toast.error("Amount required");
    }

    if (Number(expenseForm.amount) <= 0) {
      return toast.error("Amount must be greater than 0");
    }
    try {
      await api.post(
        "/expenses/add",
        {
          roomId,
          title: expenseForm.title,
          amount: Number(expenseForm.amount),
          category: expenseForm.category,
        },
        {
          headers: {
            Authorization: token,
          },
        },
      );

      setShowExpenseModal(false);

      setExpenseForm({
        title: "",
        amount: "",
        category: "food",
      });

      fetchDashboard();
    } catch (error) {
      console.log(error);
      toast.error("Failed to add expense");
    }
  };

  const addTopUp = async () => {
    if (!topUpAmount) {
      return toast.error("Amount required");
    }

    if (Number(topUpAmount) <= 0) {
      return toast.error("Amount must be greater than 0");
    }

    try {
      await api.post(
        "/budget/topup",
        {
          roomId,
          amountPerPerson: Number(topUpAmount),
        },
        {
          headers: {
            Authorization: token,
          },
        },
      );

      toast.success("Top up added");

      setShowTopUpModal(false);
      setTopUpAmount("");

      fetchDashboard();
    } catch (error) {
      console.log(error);
      toast.error("Failed to add top up");
    }
  };
  if (loading || !data) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const monthName = new Date().toLocaleString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const chartData = Object.entries(data.categoryStats || {}).map(
    ([name, value]) => ({
      name,
      value,
    }),
  );

  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#84cc16",
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-5 pb-10">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-xl font-bold">Hi, {user?.name}</h1>

        <p className="text-sm mt-1 text-slate-300">{monthName}</p>

        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs bg-white/10 px-3 py-2 rounded-xl text-slate-300">
            Room ID: {roomId}
          </span>

          <button
            onClick={copyRoomId}
            className="text-xs bg-indigo-500 px-3 py-2 rounded-xl font-semibold"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Balance */}
        <div className="bg-indigo-500 rounded-3xl p-5">
          <p className="text-indigo-100 text-sm">Current Balance</p>

          <h2 className="text-3xl sm:text-4xl font-bold mt-2">
            ₹{data.finalBalance}
          </h2>

          <p className="text-indigo-100 text-sm mt-2">Available Balance</p>
        </div>

        {/* Pie Chart */}
        <div className="bg-white/5 rounded-3xl p-4 h-72">
          <p className="text-sm mb-2">Expense Split</p>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={75}
                label={false}
              >
                {chartData.map((item, index) => (
                  <Cell key={index} fill={colors[index % colors.length]} />
                ))}
              </Pie>

              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-5">
        <button
          onClick={() => setShowExpenseModal(true)}
          className="bg-emerald-500 rounded-2xl py-3 font-semibold hover:opacity-90 transition"
        >
          + Add Expense
        </button>

        <button
          onClick={() => setShowTopUpModal(true)}
          className="bg-purple-500 rounded-2xl py-3 font-semibold hover:opacity-90 transition"
        >
          + Top Up
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-5">
        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-slate-400 text-sm">Budget</p>
          <h3 className="text-xl font-semibold mt-1">
            ₹{data.budget?.baseBudget || 0}
          </h3>
        </div>

        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-slate-400 text-sm">Top-Up</p>
          <h3 className="text-xl font-semibold mt-1">₹{data.totalTopUp}</h3>
        </div>

        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-slate-400 text-sm">Expenses</p>
          <h3 className="text-xl font-semibold mt-1">₹{data.totalExpense}</h3>
        </div>

        <div className="bg-white/5 rounded-2xl p-4">
          <p className="text-slate-400 text-sm">Categories</p>
          <h3 className="text-xl font-semibold mt-1">
            {Object.keys(data.categoryStats || {}).length}
          </h3>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-7">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Recent Activity</h2>

          <button
            onClick={() => navigate("/expenses")}
            className="text-sm hover:text-indigo-400 transition"
          >
            View All
          </button>
        </div>

        <div className="space-y-3">
          {data?.expenses?.length > 0 ? (
            data.expenses.slice(0, 4).map((item) => (
              <div
                key={item._id}
                className="bg-white/5 rounded-2xl p-4 flex justify-between items-center"
              >
                <div className="min-w-0">
                  <p className="font-medium capitalize truncate">
                    {item.title}
                  </p>

                  <p className="text-slate-400 text-sm capitalize">
                    {item.category}
                  </p>
                </div>

                <p className="font-semibold shrink-0">₹{item.amount}</p>
              </div>
            ))
          ) : (
            <div className="bg-white/5 rounded-2xl p-4">No recent activity</div>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-5">
            <h2 className="text-xl font-bold mb-4">Add Expense</h2>

            <input
              type="text"
              placeholder="Expense title"
              value={expenseForm.title}
              onChange={(e) =>
                setExpenseForm({
                  ...expenseForm,
                  title: e.target.value,
                })
              }
              className="w-full mb-3 px-4 py-3 rounded-xl bg-white/10 outline-none"
            />

            <input
              type="number"
              placeholder="Amount"
              value={expenseForm.amount}
              onChange={(e) =>
                setExpenseForm({
                  ...expenseForm,
                  amount: e.target.value,
                })
              }
              className="w-full mb-3 px-4 py-3 rounded-xl bg-white/10 outline-none"
            />

            <select
              value={expenseForm.category}
              onChange={(e) =>
                setExpenseForm({
                  ...expenseForm,
                  category: e.target.value,
                })
              }
              className="w-full mb-4 px-4 py-3 rounded-xl bg-slate-800 text-white border border-slate-700 outline-none"
            >
              <option value="food" className="text-black">
                Food
              </option>
              <option value="groceries" className="text-black">
                Groceries
              </option>
              <option value="transport" className="text-black">
                Transport
              </option>
              <option value="rent" className="text-black">
                Rent
              </option>
              <option value="bills" className="text-black">
                Bills
              </option>
              <option value="medical" className="text-black">
                Medical
              </option>
              <option value="entertainment" className="text-black">
                Entertainment
              </option>
              <option value="misc" className="text-black">
                Misc
              </option>
            </select>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowExpenseModal(false)}
                className="py-3 rounded-xl bg-white/10"
              >
                Cancel
              </button>

              <button
                onClick={addExpense}
                className="py-3 rounded-xl bg-emerald-500 font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {showTopUpModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">
          {" "}
          <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-5">
            {" "}
            <h2 className="text-xl font-bold mb-4 text-white">
              {" "}
              Add Top Up{" "}
            </h2>{" "}
            <p className="text-sm text-slate-400 mb-3">
              {" "}
              Amount Per Person{" "}
            </p>{" "}
            <input
              type="number"
              placeholder="Enter amount"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              className="w-full mb-4 px-4 py-3 rounded-xl bg-white/10 text-white outline-none"
            />{" "}
            <div className="grid grid-cols-2 gap-3">
              {" "}
              <button
                onClick={() => setShowTopUpModal(false)}
                className="py-3 rounded-xl bg-white/10 text-white"
              >
                {" "}
                Cancel{" "}
              </button>{" "}
              <button
                onClick={addTopUp}
                className="py-3 rounded-xl bg-purple-500 font-semibold text-white"
              >
                {" "}
                Add{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}
    </div>
  );
}
