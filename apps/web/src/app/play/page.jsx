"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";

const MODES = [
  {
    id: "multiplayer",
    href: "/play/multiplayer",
    icon: "⚡",
    title: "Real Multiplayer",
    desc: "Live matches vs real players worldwide. ELO ranking system.",
    color: "from-[#6D28D9] to-[#5B21B6]",
    badge: "LIVE",
    badgeColor: "bg-[#22C55E] text-white",
    featured: true,
  },
  {
    id: "ranked",
    href: "/play/ranked",
    icon: "🏆",
    title: "Quick Ranked",
    desc: "Fast matchmaking. ELO rating changes based on results.",
    color: "bg-[#111827] border border-[#E5E7EB]/10",
    badge: null,
  },
  {
    id: "casual",
    href: "/play/casual",
    icon: "🎮",
    title: "Casual Play",
    desc: "Relaxed gameplay with no rating impact. Just for fun.",
    color: "bg-[#111827] border border-[#E5E7EB]/10",
    badge: null,
  },
  {
    id: "ai",
    href: "/play/ai",
    icon: "🤖",
    title: "vs AI",
    desc: "Train against our Minimax AI. 4 difficulty levels from Easy to Impossible.",
    color: "bg-[#111827] border border-[#E5E7EB]/10",
    badge: null,
  },
  {
    id: "ultimate",
    href: "/play/ultimate",
    icon: "🎯",
    title: "Ultimate Mode",
    desc: "9-board Ultimate Tic-Tac-Toe. Strategic depth meets classic gameplay.",
    color: "bg-[#111827] border border-[#E5E7EB]/10",
    badge: "NEW",
    badgeColor: "bg-[#8B5CF6] text-white",
  },
];

export default function PlayPage() {
  const { data: user, loading } = useUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/account/signin");
  }, [user, loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div
          className="w-10 h-10 border-4 border-[#6D28D9] border-t-transparent rounded-full"
          style={{ animation: "spin 1s linear infinite" }}
        ></div>
        <style
          jsx
          global
        >{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar active="play" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-white mb-3">
            Choose Your Battle
          </h1>
          <p className="text-gray-400">Select a game mode to start playing</p>
        </div>

        <div className="space-y-4">
          {MODES.map((mode) => (
            <a
              key={mode.id}
              href={mode.href}
              className={`flex items-center gap-5 p-5 rounded-2xl transition-all group ${
                mode.featured
                  ? `bg-gradient-to-r ${mode.color} hover:opacity-95`
                  : `${mode.color} hover:border-[#6D28D9]/30`
              }`}
            >
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shrink-0 ${
                  mode.featured ? "bg-white/10" : "bg-[#1F2937]"
                }`}
              >
                {mode.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-lg font-bold ${mode.featured ? "text-white" : "text-white"}`}
                  >
                    {mode.title}
                  </span>
                  {mode.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mode.badgeColor}`}
                    >
                      {mode.badge}
                    </span>
                  )}
                </div>
                <p
                  className={`text-sm ${mode.featured ? "text-white/70" : "text-gray-400"}`}
                >
                  {mode.desc}
                </p>
              </div>

              <div
                className={`shrink-0 text-xl transition-transform group-hover:translate-x-1 ${mode.featured ? "text-white/60" : "text-gray-600"}`}
              >
                →
              </div>
            </a>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          {[
            { icon: "⚡", label: "Real-time", desc: "Instant moves" },
            { icon: "🔒", label: "Secure", desc: "Fair matches" },
            { icon: "📊", label: "Tracked", desc: "Full history" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-4 text-center"
            >
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-sm font-semibold text-white">{s.label}</div>
              <div className="text-xs text-gray-400">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
