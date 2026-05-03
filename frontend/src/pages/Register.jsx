import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import toast from "react-hot-toast";

export default function Register() {
  
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const registerUser = async (e) => {
    e.preventDefault();

      if (!form.name.trim()) {
    return toast.error("Name is required");
  }

  if (form.name.trim().length < 2) {
    return toast.error  ("Name must be at least 2 characters");
  }

  if (!form.email.trim()) {
    return toast.error("Email is required");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(form.email)) {
    return toast.error("Enter valid email");
  }

  if (!form.password) {
    return toast.error("Password is required");
  }

  if (form.password.length < 6) {
    return toast.error("Password must be at least 6 characters");
  }

    try {
      const res = await api.post("/users/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: "member"
      });

      toast.success("Registered Successfully");

      navigate("/");

    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Registration Failed"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-950 flex items-center justify-center px-4">

      <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl">

        <h1 className="text-2xl sm:text-3xl font-bold text-white text-center">
          Create Account
        </h1>

        <p className="text-slate-300 text-center mt-2 text-sm">
          Join RoomExpenser
        </p>

        <form
          onSubmit={registerUser}
          className="mt-6 space-y-4"
        >

          <input
            type="text"
            placeholder="Full Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value
              })
            }
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-300 outline-none"
          />

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
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-300 outline-none"
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
            className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-slate-300 outline-none"
          />

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-semibold"
          disabled={!form.name || !form.email || !form.password}>
            Register
          </button>

        </form>

        <p className="text-center text-slate-300 mt-5 text-sm">
          Already have account?{" "}
          <Link
            to="/"
            className="text-purple-400 font-semibold"
          >
            Login
          </Link>
        </p>

      </div>

    </div>
  );
}