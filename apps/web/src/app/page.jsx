"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import TicTacLogo from "@/components/TicTacLogo";

/* ── Animated live demo board ── */
const DEMO_MOVES = [4, 0, 2, 6, 8];
const WIN_LINE = [2, 4, 6];

function DemoBoard() {
  const [board, setBoard] = useState(Array(9).fill(null));
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= DEMO_MOVES.length) {
      const t = setTimeout(() => {
        setBoard(Array(9).fill(null));
        setStep(0);
      }, 2400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      const nb = [...board];
      nb[DEMO_MOVES[step]] = step % 2 === 0 ? "X" : "O";
      setBoard(nb);
      setStep((s) => s + 1);
    }, 700);
    return () => clearTimeout(t);
  }, [step]);

  const isWin = step >= DEMO_MOVES.length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3,1fr)",
        gap: "8px",
        width: "216px",
        height: "216px",
      }}
    >
      {board.map((cell, i) => {
        const winning = isWin && WIN_LINE.includes(i);
        return (
          <div
            key={i}
            style={{
              background: winning ? "rgba(16,185,129,0.18)" : "rgba(13,21,38,0.9)",
              border: `2px solid ${winning ? "rgba(16,185,129,0.6)" : "rgba(124,58,237,0.25)"}`,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s",
              boxShadow: winning ? "0 0 12px rgba(16,185,129,0.4)" : "none",
            }}
          >
            {cell === "X" && (
              <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
                <line x1="8" y1="8" x2="32" y2="32" stroke={winning ? "#10B981" : "#A78BFA"} strokeWidth="5" strokeLinecap="round" />
                <line x1="32" y1="8" x2="8" y2="32" stroke={winning ? "#10B981" : "#A78BFA"} strokeWidth="5" strokeLinecap="round" />
              </svg>
            )}
            {cell === "O" && (
              <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
                <circle cx="20" cy="20" r="12" stroke="#06B6D4" strokeWidth="5" fill="none" />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

const FEATURES = [
  {
    title: "Ranked Competition",
    desc: "Climb from Bronze to Legend. ELO-based matchmaking ensures every game is balanced and competitive.",
    accent: "#7C3AED",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    title: "Real-time Multiplayer",
    desc: "Instant matchmaking, live spectating, and seamless reconnection. Play anyone, anywhere.",
    accent: "#06B6D4",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    ),
  },
  {
    title: "AI Training",
    desc: "Four difficulty levels from beginner to unbeatable. Practice against minimax AI and sharpen your strategy.",
    accent: "#10B981",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
        <path d="M9 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Tournaments",
    desc: "Join weekly competitive tournaments with automated brackets, seeding, and prize pools.",
    accent: "#F59E0B",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8M12 17v4M17 3H7l-2 9h14L17 3z" />
        <path d="M5 12a7 7 0 0 0 14 0" />
      </svg>
    ),
  },
  {
    title: "Achievements & XP",
    desc: "Unlock badges, earn experience points, level up your profile, and showcase your skills.",
    accent: "#A78BFA",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="6" />
        <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
      </svg>
    ),
  },
  {
    title: "Ultimate Mode",
    desc: "Master the 9-board variant — a complex strategic game where every move determines the next battlefield.",
    accent: "#EF4444",
    icon: (
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
  },
];

export default function HomePage() {
  const { data: user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) navigate("/dashboard");
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050B18" }}>
        <div
          className="w-12 h-12 border-4 rounded-full"
          style={{
            borderColor: "#7C3AED",
            borderTopColor: "transparent",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  if (user) return null;

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#050B18",
        backgroundImage:
          "linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }}
    >
      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "rgba(5,11,24,0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(124,58,237,0.18)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <TicTacLogo />
            <div className="flex items-center gap-3">
              <a
                href="/account/signin"
                className="text-sm font-medium px-4 py-2 rounded-lg transition-all"
                style={{ color: "#94A3B8" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#F8FAFC")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
              >
                Sign In
              </a>
              <a
                href="/account/signup"
                className="text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                  color: "#fff",
                  boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(124,58,237,0.6)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(124,58,237,0.4)";
                  e.currentTarget.style.transform = "none";
                }}
              >
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        {/* Glows */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "-10%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "600px",
            background: "radial-gradient(ellipse at center, rgba(124,58,237,0.16) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            bottom: 0,
            right: "-5%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(ellipse at center, rgba(6,182,212,0.08) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div className="text-center lg:text-left">
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-semibold"
                style={{
                  background: "rgba(124,58,237,0.15)",
                  border: "1px solid rgba(124,58,237,0.3)",
                  color: "#A78BFA",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "#10B981",
                    animation: "glow-pulse 2s ease-in-out infinite",
                  }}
                />
                Live — 2,400+ players online
              </div>

              <h1
                className="font-black tracking-tight mb-6 leading-none"
                style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
              >
                <span style={{ color: "#F8FAFC" }}>The Ultimate</span>
                <br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #A78BFA 0%, #F8FAFC 50%, #06B6D4 100%)",
                    backgroundSize: "200% auto",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    animation: "shimmer 3s linear infinite",
                  }}
                >
                  Tic-Tac-Toe
                </span>
                <br />
                <span
                  style={{
                    background: "linear-gradient(135deg, #A78BFA, #7C3AED, #06B6D4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Arena
                </span>
              </h1>

              <p
                className="text-lg leading-relaxed mb-10 max-w-xl mx-auto lg:mx-0"
                style={{ color: "#94A3B8" }}
              >
                Compete globally, climb the ranks, and prove you're the best.
                Real-time multiplayer, ranked matches, tournaments, and
                unbeatable AI challenges.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="/account/signup"
                  className="inline-flex items-center justify-center font-bold px-8 py-4 rounded-xl text-base transition-all"
                  style={{
                    background: "linear-gradient(135deg, #7C3AED, #6D28D9)",
                    color: "#fff",
                    boxShadow: "0 4px 20px rgba(124,58,237,0.5)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(124,58,237,0.7)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 4px 20px rgba(124,58,237,0.5)";
                  }}
                >
                  Start Playing Free
                </a>
                <a
                  href="/leaderboard"
                  className="inline-flex items-center justify-center font-bold px-8 py-4 rounded-xl text-base transition-all"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(124,58,237,0.3)",
                    color: "#F8FAFC",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                >
                  View Leaderboard
                </a>
              </div>
            </div>

            {/* Right — live demo board */}
            <div className="flex justify-center items-center">
              <div
                style={{ animation: "float 3s ease-in-out infinite" }}
              >
                <div
                  className="p-8 rounded-3xl"
                  style={{
                    background: "rgba(13,21,38,0.8)",
                    border: "1px solid rgba(124,58,237,0.35)",
                    boxShadow: "0 0 60px rgba(124,58,237,0.2)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <p
                    className="text-center text-xs font-semibold tracking-widest uppercase mb-4"
                    style={{ color: "#7C3AED" }}
                  >
                    Live Preview
                  </p>
                  <DemoBoard />
                  <p
                    className="text-center text-xs mt-4"
                    style={{ color: "#64748B" }}
                  >
                    Auto-playing demo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section
        style={{
          background: "rgba(13,21,38,0.6)",
          borderTop: "1px solid rgba(124,58,237,0.12)",
          borderBottom: "1px solid rgba(124,58,237,0.12)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "12K+", label: "Active Players", color: "#A78BFA" },
              { value: "540K+", label: "Games Played", color: "#06B6D4" },
              { value: "24/7", label: "Live Matches", color: "#10B981" },
              { value: "120+", label: "Tournaments", color: "#F59E0B" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div
                  className="text-4xl font-bold mb-1"
                  style={{ color: s.color }}
                >
                  {s.value}
                </div>
                <div className="text-sm" style={{ color: "#94A3B8" }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
            Everything you need to{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #A78BFA, #7C3AED, #06B6D4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              dominate
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#94A3B8" }}>
            From casual practice to championship tournaments — TicTac Arena has it all.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6 transition-all duration-300"
              style={{
                background: "#0D1526",
                border: "1px solid rgba(30,58,138,0.4)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.border = `1px solid ${f.accent}`;
                e.currentTarget.style.boxShadow = `0 4px 30px ${f.accent}30`;
                e.currentTarget.style.transform = "translateY(-4px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.border = "1px solid rgba(30,58,138,0.4)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                style={{
                  background: `${f.accent}18`,
                  color: f.accent,
                }}
              >
                {f.icon}
              </div>
              <h3 className="font-bold text-white text-lg mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it Works ── */}
      <section
        style={{
          background: "rgba(13,21,38,0.5)",
          borderTop: "1px solid rgba(124,58,237,0.1)",
          borderBottom: "1px solid rgba(124,58,237,0.1)",
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
              Get started in{" "}
              <span
                style={{
                  background: "linear-gradient(135deg, #67E8F9, #06B6D4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                3 steps
              </span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-10">
            {[
              { num: "1", title: "Create Account", desc: "Sign up for free in seconds. No credit card required — just pick a username and dive in.", color: "#7C3AED" },
              { num: "2", title: "Choose Your Mode", desc: "Warm up against AI, jump into ranked matches, or challenge a friend in casual mode.", color: "#06B6D4" },
              { num: "3", title: "Climb the Ranks", desc: "Win games, earn XP, unlock achievements, and rise through the global leaderboard.", color: "#10B981" },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mb-4"
                  style={{
                    background: `linear-gradient(135deg, ${step.color}, ${step.color}99)`,
                    boxShadow: `0 0 20px ${step.color}50`,
                  }}
                >
                  {step.num}
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-sm" style={{ color: "#94A3B8" }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div
          className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.28) 0%, rgba(109,40,217,0.18) 50%, rgba(6,182,212,0.18) 100%)",
            border: "1px solid rgba(124,58,237,0.4)",
            boxShadow: "0 0 60px rgba(124,58,237,0.2)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(rgba(124,58,237,0.1) 1px, transparent 1px)",
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl font-black text-white mb-4">
              Ready to Compete?
            </h2>
            <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "#CBD5E1" }}>
              Join thousands of players worldwide. Create your account and start
              your journey to Legend rank today.
            </p>
            <a
              href="/account/signup"
              className="inline-flex items-center font-bold text-lg px-10 py-4 rounded-2xl transition-all"
              style={{
                background: "linear-gradient(135deg, #fff, #E0D7FF)",
                color: "#6D28D9",
                boxShadow: "0 6px 30px rgba(255,255,255,0.25)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              Create Free Account
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid rgba(124,58,237,0.15)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <TicTacLogo />
            <div className="flex items-center gap-6">
              {[
                { href: "/leaderboard", label: "Leaderboard" },
                { href: "/tournaments", label: "Tournaments" },
                { href: "/account/signin", label: "Sign In" },
                { href: "/account/signup", label: "Sign Up" },
              ].map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  className="text-sm transition-colors"
                  style={{ color: "#64748B" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#F8FAFC")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#64748B")}
                >
                  {l.label}
                </a>
              ))}
            </div>
            <p className="text-sm" style={{ color: "#475569" }}>
              © 2026 TicTac Arena
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
