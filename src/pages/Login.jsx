import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
      { email, password }
    );
    localStorage.setItem("token", res.data.token);
    navigate("/");
  } catch (err) {
    alert("Login failed: " + (err?.response?.data?.error || "Server error"));
  }
};


  // SVG logo for consistency
  const LogoSVG = () => (
    <svg width="44" height="44" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="30" height="30" rx="10" fill="url(#paint0_linear)"/>
      <path d="M12 18h12M18 12v12" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="paint0_linear" x1="3" y1="3" x2="33" y2="33" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1"/>
          <stop offset="1" stopColor="#0ea5e9"/>
        </linearGradient>
      </defs>
    </svg>
  );

  return (
    <div className="min-h-screen flex justify-center items-center glass-bg">
      <form className="glass-card p-8 rounded-2xl shadow-lg w-full max-w-md flex flex-col items-center" onSubmit={handleLogin}>
        <div className="mb-4 flex flex-col items-center">
          <LogoSVG />
          <h2 className="text-2xl font-bold mt-2 mb-1 tracking-tight">Login</h2>
          <p className="text-gray-400 text-sm mb-2">Sign in to your CloudTasker</p>
        </div>
        <input
          type="email"
          placeholder="Email"
          className="w-full p-2 mb-4 border rounded glass-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-2 mb-6 border rounded glass-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="glass-btn w-full p-2 rounded text-lg font-semibold"
        >
          Login
        </button>
      </form>
    </div>
  );
}
