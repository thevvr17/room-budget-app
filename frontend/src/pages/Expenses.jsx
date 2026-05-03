import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Expenses() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const roomId = "69dbe53a583d97f6bb22ac2b";

  const [expenses, setExpenses] = useState([]);
  const [search, setSearch] = useState("");

  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "food"
  });

  const fetchExpenses = async () => {
    try {
      const res = await api.get(
        `/dashboard/${roomId}`,
        {
          headers: {
            Authorization: token
          },
          params: { t: Date.now() }
        }
      );

      setExpenses(res.data.expenses || []);

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const searchExpenses = async () => {
    try {
      if (!search.trim()) {
        return fetchExpenses();
      }

      const res = await api.get(
        `/expenses/search/${roomId}?keyword=${search}`,
        {
          headers: {
            Authorization: token
          }
        }
      );

      setExpenses(res.data.expenses || []);

    } catch (error) {
      toast.error("Search failed");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await api.delete(
        `/expenses/delete/${id}`,
        {
          headers: {
            Authorization: token
          }
        }
      );

      toast.success("Deleted");
      fetchExpenses();

    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const openEdit = (item) => {
    setEditId(item._id);

    setForm({
      title: item.title,
      amount: item.amount,
      category: item.category
    });
  };

  const updateExpense = async () => {
    try {
      await api.put(
        `/expenses/update/${editId}`,
        form,
        {
          headers: {
            Authorization: token
          }
        }
      );

      toast.success("Updated");

      setEditId(null);

      fetchExpenses();

    } catch (error) {
      toast.error("Update failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-5 pb-10">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">

        <button
          onClick={() => navigate(-1)}
          className="px-3 py-2 rounded-xl bg-white/10"
        >
          ←
        </button>

        <h1 className="text-xl font-bold">
          Expenses
        </h1>

      </div>

      {/* Search */}
      <div className="flex gap-2 mb-5">

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search expense..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 outline-none"
        />

        <button
          onClick={searchExpenses}
          className="px-4 rounded-xl bg-indigo-500"
        >
          Go
        </button>

      </div>

      {/* List */}
      <div className="space-y-3">

        {expenses.map((item) => (
          <div
            key={item._id}
            className="bg-white/5 rounded-2xl p-4"
          >

            <div className="flex justify-between items-center">

              <div>
                <p className="font-semibold capitalize">
                  {item.title}
                </p>

                <p className="text-sm text-slate-400 capitalize">
                  {item.category}
                </p>
              </div>

              <p className="font-bold">
                ₹{item.amount}
              </p>

            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">

              <button
                onClick={() => openEdit(item)}
                className="py-2 rounded-xl bg-amber-500 font-semibold"
              >
                Edit
              </button>

              <button
                onClick={() =>
                  deleteExpense(item._id)
                }
                className="py-2 rounded-xl bg-red-500 font-semibold"
              >
                Delete
              </button>

            </div>

          </div>
        ))}

      </div>

      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center px-4 z-50">

          <div className="w-full max-w-sm bg-slate-900 rounded-3xl p-5">

            <h2 className="text-xl font-bold mb-4">
              Edit Expense
            </h2>

            <input
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value
                })
              }
              className="w-full mb-3 px-4 py-3 rounded-xl bg-white/10 outline-none"
            />

            <input
              type="number"
              value={form.amount}
              onChange={(e) =>
                setForm({
                  ...form,
                  amount: e.target.value
                })
              }
              className="w-full mb-3 px-4 py-3 rounded-xl bg-white/10 outline-none"
            />

            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value
                })
              }
              className="w-full mb-4 px-4 py-3 rounded-xl bg-slate-800"
            >
              <option value="food">Food</option>
              <option value="rent">Rent</option>
              <option value="bills">Bills</option>
              <option value="transport">Transport</option>
              <option value="misc">Misc</option>
            </select>

            <div className="grid grid-cols-2 gap-3">

              <button
                onClick={() =>
                  setEditId(null)
                }
                className="py-3 rounded-xl bg-white/10"
              >
                Cancel
              </button>

              <button
                onClick={updateExpense}
                className="py-3 rounded-xl bg-emerald-500 font-semibold"
              >
                Save
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}