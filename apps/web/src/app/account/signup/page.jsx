"use client";

import { useState } from "react";
import useAuth from "@/utils/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import TicTacLogo from "@/components/TicTacLogo";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { signUpWithCredentials } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }

    setLoading(true);

    try {
      // First create the profile
      const profileResponse = await fetch("/api/profiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username }),
      });

      if (!profileResponse.ok) {
        const data = await profileResponse.json();
        throw new Error(data.error || "Failed to create profile");
      }

      // Then sign up
      const result = await signUpWithCredentials({
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
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

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center gap-3">
          <TicTacLogo showText={false} />
          <h1 className="text-4xl font-semibold text-white tracking-tight mb-2">
            TicTac Arena
          </h1>
          <p className="text-sm text-gray-400">
            Create your account and start playing
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-subtle)] p-8">
          <h2 className="text-xl font-semibold text-white mb-6">
            Create Account
          </h2>

          {error && (
            <div className="mb-6 p-4 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-lg">
              <p className="text-sm text-[var(--error)]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-medium text-gray-400 mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-transparent transition-all"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-gray-400 mb-2"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-transparent transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium text-gray-400 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-transparent transition-all"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs font-medium text-gray-400 mb-2"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[var(--bg-input)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)] focus:border-transparent transition-all"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-400">
              Already have an account?{" "}
              <a
                href="/account/signin"
                className="text-[var(--accent-primary)] hover:text-[var(--accent-secondary)] font-medium transition-colors"
              >
                Sign in
              </a>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
