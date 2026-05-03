import { useNavigate } from "react-router-dom";

export default function PendingApproval() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">

      <div className="w-full max-w-sm bg-white/5 rounded-3xl p-6 text-center">

        <h1 className="text-2xl font-bold">
          Request Sent ✅
        </h1>

        <p className="text-slate-400 mt-3">
          Waiting for admin approval.
        </p>

        <button
          onClick={logout}
          className="w-full mt-6 bg-red-500 py-3 rounded-xl font-semibold"
        >
          Logout
        </button>

      </div>

    </div>
  );
}