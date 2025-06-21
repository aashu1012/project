import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Auth() {
  const [mode, setMode] = useState("login"); // 'login' or 'register'
  const [showSuccess, setShowSuccess] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const navigate = useNavigate();

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

  // Login handler
  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
      {
        email: loginEmail,
        password: loginPassword,
      }
    );
    localStorage.setItem("token", res.data.token);
    navigate("/");
  } catch (err) {
    alert("Login failed: " + (err?.response?.data?.error || "Server error"));
  }
};


  // Register handler
  const handleRegister = async (e) => {
  e.preventDefault();
  try {
    await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/auth/register`,
      {
        name: regName,
        email: regEmail,
        password: regPassword,
      }
    );
    setShowSuccess(true);
    setRegName("");
    setRegEmail("");
    setRegPassword("");
  } catch (err) {
    alert("Registration failed: " + (err?.response?.data?.error || "Server error"));
  }
};


  // Smooth transition classes
  const formContainerClass =
    "relative w-full max-w-md overflow-hidden min-h-[420px]";
  const slideClass =
    "absolute top-0 left-0 w-full transition-transform duration-500";

  return (
    <div className="min-h-screen flex justify-center items-center glass-bg">
      <div className="glass-card p-8 rounded-2xl shadow-lg w-full max-w-md flex flex-col items-center">
        <div className="mb-4 flex flex-col items-center">
          <LogoSVG />
          <h2 className="text-2xl font-bold mt-2 mb-1 tracking-tight">
            {mode === "login" ? "Login" : "Register"}
          </h2>
          <p className="text-gray-400 text-sm mb-2">
            {mode === "login"
              ? "Sign in to your CloudTasker"
              : "Create your CloudTasker account"}
          </p>
        </div>
        <div className={formContainerClass} style={{ height: showSuccess && mode === "register" ? 220 : 340 }}>
          {/* Login Form */}
          <form
            className={slideClass + (mode === "login" ? " translate-x-0 z-10" : " -translate-x-full z-0")}
            style={{ pointerEvents: mode === "login" ? "auto" : "none", opacity: mode === "login" ? 1 : 0 }}
            onSubmit={handleLogin}
            autoComplete="on"
          >
            <input
              type="email"
              placeholder="Email"
              className="w-full p-2 mb-4 border rounded glass-input"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-2 mb-6 border rounded glass-input"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="submit"
              className="glass-btn w-full p-2 rounded text-lg font-semibold"
            >
              Login
            </button>
          </form>

          {/* Register Form */}
          <form
            className={slideClass + (mode === "register" && !showSuccess ? " translate-x-0 z-10" : " translate-x-full z-0")}
            style={{ pointerEvents: mode === "register" && !showSuccess ? "auto" : "none", opacity: mode === "register" && !showSuccess ? 1 : 0 }}
            onSubmit={handleRegister}
            autoComplete="on"
          >
            <input
              type="text"
              placeholder="Name"
              className="w-full p-2 mb-4 border rounded glass-input"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              autoComplete="name"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full p-2 mb-4 border rounded glass-input"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="Password"
              className="w-full p-2 mb-6 border rounded glass-input"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="submit"
              className="glass-btn w-full p-2 rounded text-lg font-semibold"
            >
              Register
            </button>
          </form>

          {/* Registration Success Message */}
          {showSuccess && mode === "register" && (
            <div className="absolute top-0 left-0 w-full flex flex-col items-center justify-center h-full transition-all duration-500 z-20 bg-opacity-80">
              <div className="text-center">
                <div className="text-3xl mb-2">🎉</div>
                <div className="font-bold text-lg mb-2">Registration successful!</div>
                <button
                  className="glass-btn px-6 py-2 mt-2"
                  onClick={() => {
                    setShowSuccess(false);
                    setMode("login");
                  }}
                >
                  Go to Login
                </button>
              </div>
            </div>
          )}
        </div>
        {/* Toggle/slider at the bottom */}
        <div className="w-full flex justify-center items-center mt-6">
          <span className="text-gray-400 text-sm">
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            className="ml-2 glass-nav-btn text-base px-3 py-1"
            style={{ minWidth: 80 }}
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setShowSuccess(false);
            }}
            type="button"
          >
            {mode === "login" ? "Register" : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
} 