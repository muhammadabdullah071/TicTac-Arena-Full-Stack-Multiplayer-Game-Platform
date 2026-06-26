"use client";

import { useState } from "react";
import useAuth from "@/utils/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import TicTacLogo from "@/components/TicTacLogo";

function Field({ id, label, type, value, onChange, placeholder, hint }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold mb-2 uppercase tracking-wider"
        style={{ color: "#94A3B8" }}
      >
        {label}
      </label>
      <div
        className="flex items-center rounded-xl px-4 py-3 transition-all"
        style={{
          background: "#0A1628",
          border: focused
            ? "1.5px solid #7C3AED"
            : "1.5px solid rgba(124,58,237,0.2)",
          boxShadow: focused ? "0 0 12px rgba(124,58,237,0.25)" : "none",
        }}
      >
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required
          className="flex-1 bg-transparent text-sm outline-none"
          style={{ color: "#F8FAFC" }}
        />
      </div>
      {hint && (
        <p className="mt-1 text-xs" style={{ color: "#475569" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signUpWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (username.trim().length < 3)
      return setError("Username must be at least 3 characters.");
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");
    if (password !== confirmPassword)
      return setError("Passwords do not match.");

    setLoading(true);
    try {
      // Try to create profile in DB (gracefully ignores failures)
      try {
        await fetch("/api/profiles/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, username: username.trim() }),
        });
      } catch (_) {
        // Profile creation is best-effort; auth signup still proceeds
      }

      // Sign up via credentials provider (creates the user in auth system)
      const result = await signUpWithCredentials({
        email,
        password,
        name: username.trim(),
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        // If account already exists, try signing in instead
        if (result.error === "CredentialsSignin" || result.error?.includes("already")) {
          setError("An account with this email already exists. Please sign in.");
        } else {
          setError("Failed to create account. Please try again.");
        }
      } else {
        navigate(callbackUrl);
      }
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const strength =
    password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;
  const strengthColors = ["", "#EF4444", "#F59E0B", "#10B981"];
  const strengthLabels = ["", "Weak", "Fair", "Strong"];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "#050B18",
        backgroundImage:
          "linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* Ambient glow */}
      <div
        className="fixed pointer-events-none"
        style={{
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "500px",
          background:
            "radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="w-full max-w-md relative" style={{ animation: "fadeInUp 0.5s ease-out forwards" }}>
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center gap-4">
          <TicTacLogo size={12} showText={false} />
          <div>
            <h1
              className="text-4xl font-black tracking-tight"
              style={{ color: "#F8FAFC" }}
            >
              Join the Arena
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              Create your free account and start competing
            </p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(13,21,38,0.9)",
            border: "1px solid rgba(124,58,237,0.25)",
            boxShadow:
              "0 0 40px rgba(124,58,237,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
            backdropFilter: "blur(12px)",
          }}
        >
          <h2 className="text-xl font-bold text-white mb-6">Create Account</h2>

          {error && (
            <div
              className="mb-5 p-4 rounded-xl text-sm"
              style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                color: "#FCA5A5",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field
              id="username"
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Choose a username"
              hint="Min 3 characters"
            />
            <Field
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Field
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />

            {/* Password strength */}
            {password.length > 0 && (
              <div className="px-1">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="flex-1 h-1 rounded-full transition-all"
                      style={{
                        background:
                          i <= strength
                            ? strengthColors[strength]
                            : "rgba(255,255,255,0.08)",
                      }}
                    />
                  ))}
                </div>
                <p
                  className="text-xs"
                  style={{ color: strengthColors[strength] }}
                >
                  {strengthLabels[strength]} password
                </p>
              </div>
            )}

            <Field
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat your password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3.5 px-4 rounded-xl text-sm transition-all mt-2 flex items-center justify-center gap-2"
              style={{
                background: loading
                  ? "rgba(124,58,237,0.5)"
                  : "linear-gradient(135deg, #7C3AED, #6D28D9)",
                color: "#fff",
                boxShadow: loading ? "none" : "0 4px 15px rgba(124,58,237,0.4)",
                cursor: loading ? "not-allowed" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 6px 22px rgba(124,58,237,0.6)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = loading
                  ? "none"
                  : "0 4px 15px rgba(124,58,237,0.4)";
              }}
            >
              {loading ? (
                <>
                  <span
                    className="w-4 h-4 border-2 rounded-full"
                    style={{
                      borderColor: "rgba(255,255,255,0.3)",
                      borderTopColor: "#fff",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Creating account...
                </>
              ) : (
                "Create Free Account"
              )}
            </button>
          </form>

          <div
            className="mt-6 text-center text-sm"
            style={{ color: "#64748B" }}
          >
            Already have an account?{" "}
            <a
              href="/account/signin"
              className="font-semibold transition-colors"
              style={{ color: "#A78BFA" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C4B5FD")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A78BFA")}
            >
              Sign in
            </a>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm transition-colors"
            style={{ color: "#475569" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#94A3B8")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
