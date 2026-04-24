// RegisterScreen.jsx
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../db/firebase";
import { useNavigate } from "react-router-dom";

export default function RegisterScreen({ onNavigateLogin }) {
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const navigate = useNavigate();

  const handleRegister = async () => {
    setError("");
    setSuccess("");

    if (!fname || !lname || !email || !password || !confirm) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      await updateProfile(userCredential.user, {
        displayName: `${fname} ${lname}`,
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: fname,
        lastName: lname,
        email: email,
      });

      setSuccess("Account created successfully!");
      setTimeout(() => onNavigateLogin?.(), 1500);
    } catch (err) {
      setError(err.message);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#1a2e1a] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow — same as login */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-green-700/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-700/15 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl shadow-2xl my-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-7">
          <button
            onClick={() => navigate("/login")}
            className="text-yellow-400 text-2xl leading-none hover:scale-110 transition-transform"
          >
            ←
          </button>
          <h1 className="font-serif text-2xl font-bold text-white">Register</h1>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-sm">
            {success}
          </div>
        )}

        {/* First & Last Name row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-widest mb-1.5">
              First Name
            </label>
            <input
              type="text"
              value={fname}
              onChange={(e) => setFname(e.target.value)}
              placeholder="John"
              className="w-full bg-white/7 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 text-sm outline-none focus:border-green-500 focus:bg-green-500/10 focus:ring-2 focus:ring-green-500/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-white/50 text-xs uppercase tracking-widest mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              value={lname}
              onChange={(e) => setLname(e.target.value)}
              placeholder="Doe"
              className="w-full bg-white/7 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-white/25 text-sm outline-none focus:border-green-500 focus:bg-green-500/10 focus:ring-2 focus:ring-green-500/20 transition-all"
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="block text-white/50 text-xs uppercase tracking-widest mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-white/7 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/25 text-sm outline-none focus:border-green-500 focus:bg-green-500/10 focus:ring-2 focus:ring-green-500/20 transition-all"
          />
        </div>

        {/* Password */}
        <div className="mb-3">
          <label className="block text-white/50 text-xs uppercase tracking-widest mb-1.5">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white/7 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/25 text-sm outline-none focus:border-green-500 focus:bg-green-500/10 focus:ring-2 focus:ring-green-500/20 transition-all"
          />
        </div>

        {/* Confirm Password */}
        <div className="mb-2">
          <label className="block text-white/50 text-xs uppercase tracking-widest mb-1.5">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-white/7 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/25 text-sm outline-none focus:border-green-500 focus:bg-green-500/10 focus:ring-2 focus:ring-green-500/20 transition-all"
          />
        </div>

        {/* Register Button */}
        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-[#3a8f2a] hover:bg-[#4aaa38] text-white font-semibold text-sm tracking-widest uppercase py-3.5 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-green-700/40 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed mt-4"
        >
          {loading ? "Creating Account…" : "Register"}
        </button>

        {/* Login link */}
        <p className="text-center text-white/40 text-sm mt-4">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-yellow-400 font-semibold hover:text-yellow-300 transition-colors"
          >
            Sign in here
          </button>
        </p>
      </div>
    </div>
  );
}
