"use client";

import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import TicTacLogo from "@/components/TicTacLogo";

export default function HomePage() {
  const { data: user, loading } = useUser();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-dark)] flex items-center justify-center">
        <div
          className="inline-block w-12 h-12 border-4 border-[var(--accent-primary)] border-t-transparent rounded-full"
          style={{ animation: "spin 1s linear infinite" }}
        >
          <style jsx global>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (user) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)]">
      {/* Navigation */}
      <nav className="border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <TicTacLogo />
            <div className="flex items-center gap-3">
              <a
                href="/account/signin"
                className="text-sm text-gray-300 hover:text-white transition-colors px-4 py-2"
              >
                Sign In
              </a>
              <a
                href="/account/signup"
                className="text-sm bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-[var(--accent-glow)] border border-[var(--accent-primary)]/20 rounded-full px-4 py-1.5 mb-8">
              <div className="w-2 h-2 bg-[var(--success)] rounded-full"></div>
              <span className="text-xs font-medium text-[var(--accent-secondary)]">
                Live Now
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-white tracking-tight mb-6">
              The Ultimate
              <br />
              <span className="bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--info)] bg-clip-text text-transparent">
                Tic-Tac-Toe Arena
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Compete globally, climb the ranks, and prove you're the best.
              Real-time multiplayer with ranked matches, tournaments, and AI
              challenges.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/account/signup"
                className="inline-flex items-center justify-center bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
              >
                Start Playing Free
              </a>
              <a
                href="/leaderboard"
                className="inline-flex items-center justify-center bg-white/5 hover:bg-white/10 border border-[var(--border-subtle)] text-white font-semibold px-8 py-4 rounded-xl transition-colors text-base"
              >
                View Leaderboard
              </a>
            </div>
          </div>
        </div>

        {/* Background Gradient */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-r from-[var(--accent-primary)]/20 via-[var(--accent-secondary)]/20 to-[var(--info)]/20 blur-3xl opacity-30 pointer-events-none"></div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Ranked Matches */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--accent-primary)]/30 transition-colors">
            <div className="w-12 h-12 bg-[var(--accent-glow)] rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[var(--accent-primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Ranked Competition
            </h3>
            <p className="text-sm text-gray-400">
              Climb from Bronze to Legend. ELO-based matchmaking ensures fair
              and competitive games every time.
            </p>
          </div>

          {/* Real-time Multiplayer */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--accent-primary)]/30 transition-colors">
            <div className="w-12 h-12 bg-[#22D3EE]/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[#22D3EE]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Real-time Play
            </h3>
            <p className="text-sm text-gray-400">
              Instant matchmaking, live spectating, and seamless reconnection.
              Never miss a move.
            </p>
          </div>

          {/* AI Training */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--accent-primary)]/30 transition-colors">
            <div className="w-12 h-12 bg-[var(--info)]/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[var(--info)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Real-time Play
            </h3>
            <p className="text-sm text-gray-400">
              Instant matchmaking, live spectating, and seamless reconnection.
              Never miss a move.
            </p>
          </div>

          {/* AI Training */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--accent-primary)]/30 transition-colors">
            <div className="w-12 h-12 bg-[var(--success)]/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[var(--success)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              AI Training Mode
            </h3>
            <p className="text-sm text-gray-400">
              Practice against advanced AI with difficulty settings from Easy to
              Impossible using minimax algorithms.
            </p>
          </div>

          {/* Achievements */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--accent-primary)]/30 transition-colors">
            <div className="w-12 h-12 bg-[var(--warning)]/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[var(--warning)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Unlock Achievements
            </h3>
            <p className="text-sm text-gray-400">
              Earn XP, level up, and unlock exclusive cosmetics. Track your
              progress and showcase your skills.
            </p>
          </div>

          {/* Tournaments */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--accent-primary)]/30 transition-colors">
            <div className="w-12 h-12 bg-[var(--error)]/10 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[var(--error)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Weekly Tournaments
            </h3>
            <p className="text-sm text-gray-400">
              Join competitive tournaments with automatic brackets and prize
              pools. Become a champion.
            </p>
          </div>

          {/* Ultimate Mode */}
          <div className="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-6 hover:border-[var(--accent-primary)]/30 transition-colors">
            <div className="w-12 h-12 bg-[var(--accent-glow)] rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-[var(--accent-secondary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-3zM14 16a1 1 0 011-1h4a1 1 0 011 1v3a1 1 0 01-1 1h-4a1 1 0 01-1-1v-3z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Ultimate Tic-Tac-Toe
            </h3>
            <p className="text-sm text-gray-400">
              Master the complex 9-board variant. Strategic depth meets classic
              gameplay.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-[var(--bg-card)] border-t border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-semibold text-white mb-2">
                10K+
              </div>
              <div className="text-sm text-gray-400">Active Players</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-semibold text-white mb-2">
                500K+
              </div>
              <div className="text-sm text-gray-400">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-semibold text-white mb-2">
                24/7
              </div>
              <div className="text-sm text-gray-400">Live Matches</div>
            </div>
            <div className="text-center">
              <div className="text-3xl sm:text-4xl font-semibold text-white mb-2">
                100+
              </div>
              <div className="text-sm text-gray-400">Tournaments</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-2xl p-12 text-center">
          <h2 className="text-3xl sm:text-4xl font-semibold text-white mb-4">
            Ready to Compete?
          </h2>
          <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
            Join thousands of players worldwide. Create your account and start
            your journey to Legend rank today.
          </p>
          <a
            href="/account/signup"
            className="inline-flex items-center justify-center bg-white hover:bg-gray-100 text-[var(--accent-primary)] font-semibold px-8 py-4 rounded-xl transition-colors text-base"
          >
            Create Free Account
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-sm text-gray-400">
            <p>© 2026 TicTac Arena. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
