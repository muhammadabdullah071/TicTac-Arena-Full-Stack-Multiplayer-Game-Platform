"use client";

import { useState } from "react";
import useAuth from "@/utils/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import TicTacLogo from "@/components/TicTacLogo";

function Field({ id, label, type, value, onChange, placeholder }) {
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
    </div>
  );
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signInWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signInWithCredentials({
        email,
        password,
        callbackUrl,
        redirect: false,
      });
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        navigate(callbackUrl);
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
          top: "20%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "600px",
          height: "400px",
          background:
            "radial-gradient(ellipse, rgba(124,58,237,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      <div className="w-full max-w-md relative">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center gap-4">
          <TicTacLogo size={12} showText={false} />
          <div>
            <h1
              className="text-4xl font-black tracking-tight"
              style={{ color: "#F8FAFC" }}
            >
              Welcome Back
            </h1>
            <p className="text-sm mt-1" style={{ color: "#64748B" }}>
              Sign in to continue your journey
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
          <h2 className="text-xl font-bold text-white mb-6">Sign In</h2>

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

          <form onSubmit={handleSubmit} className="space-y-5">
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
              placeholder="Your password"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full font-bold py-3.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
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
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div
            className="mt-6 text-center text-sm"
            style={{ color: "#64748B" }}
          >
            Don&apos;t have an account?{" "}
            <a
              href="/account/signup"
              className="font-semibold transition-colors"
              style={{ color: "#A78BFA" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C4B5FD")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A78BFA")}
            >
              Sign up free
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
