import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const loginUser = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) {
  return toast.error("Email is required");
}

if (!form.password) {
  return toast.error("Password is required");
}

    try {
      // login
      const res = await api.post("/users/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      // check status
      const status = await api.get("/users/status", {
        headers: {
          Authorization: res.data.token
        }
      });

      if (status.data.hasRoom) {
        navigate("/dashboard");
      } else if (status.data.pending) {
        navigate("/pending");
      } else {
        navigate("/join-room");
      }

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Login failed"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-950 flex items-center justify-center px-4">

      <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10">

        <h1 className="text-3xl font-bold text-white text-center">
          RoomExpenser
        </h1>

        <p className="text-slate-300 text-center mt-2 text-sm">
          Welcome back
        </p>

        <form
          onSubmit={loginUser}
          className="mt-6 space-y-4"
        >

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value
              })
            }
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value
              })
            }
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white outline-none"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold"
          >
            Login
          </button>

        </form>

        <p className="text-center text-slate-300 mt-5 text-sm">
          No account?{" "}
          <Link
            to="/register"
            className="text-indigo-400 font-semibold"
          >
            Register
          </Link>
        </p>

      </div>

    </div>
  );
}