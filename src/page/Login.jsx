// LoginScreen.jsx
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../db/firebase";
import { useNavigate } from "react-router-dom";

export default function LoginScreen({ onLoginSuccess, onNavigateRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      const userInfo = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "User Name",
        loginTime: new Date().getTime(),
      };

      localStorage.setItem("userData", JSON.stringify(userInfo)); // replaces AsyncStorage

      navigate("/dashboard");
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1a2e1a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-700/15 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl block mb-2">🌿</span>
          <div className="flex items-baseline justify-center gap-1 font-serif text-3xl font-bold">
            <span className="text-white">Green</span>
            <span className="text-white bg-[#3a8f2a] px-2 rounded-md">
              Leaves
            </span>
          </div>
          <p className="text-white/40 text-xs tracking-widest uppercase mt-1">
            Management Portal
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="block text-white/50 text-xs uppercase tracking-widest mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white/7 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-green-500 focus:bg-green-500/10 focus:ring-2 focus:ring-green-500/20 transition-all"
          />
        </div>

        {/* Password */}
        <div className="mb-6">
          <label className="block text-white/50 text-xs uppercase tracking-widest mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white/7 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/25 text-sm outline-none focus:border-green-500 focus:bg-green-500/10 focus:ring-2 focus:ring-green-500/20 transition-all"
          />
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-[#3a8f2a] hover:bg-[#4aaa38] text-white font-semibold text-sm tracking-widest uppercase py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-700/40 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Signing in…" : "Login"}
        </button>

        {/* Sign up */}
        <p className="text-center text-white/40 text-sm mt-5">
          Don't have an account?{" "}
          <button
            onClick={() => navigate("/register")}
            className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors"
          >
            Sign up here
          </button>
        </p>

        <hr className="border-white/8 my-5" />

        {/* Powered by */}
        <div className="text-center text-white/20 text-xs tracking-wide">
          <p>Powered by Ceylon Cyber Mart</p>
          <p>0725000987</p>
        </div>
      </div>
    </div>
  );
}
