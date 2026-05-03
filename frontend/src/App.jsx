import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import MainLayout from "./pages/MainLayout";
import JoinRoom from "./pages/JoinRoom";
import PendingApproval from "./pages/PendingApproval";
import Expenses from "./pages/Expenses";
import { Toaster } from "react-hot-toast";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<MainLayout />} />
        <Route path="/join-room" element={<JoinRoom />} />
        <Route path="/pending" element={<PendingApproval />} />
        <Route path="/expenses" element={<Expenses />} />
      </Routes>

      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#0f172a",
            color: "#fff",
            border: "1px solid #334155",
          },
        }}
      />
    </BrowserRouter>
  );
}
