"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";

export default function AdminPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!userLoading && !user) navigate("/account/signin");
    else if (user) checkAdminAndFetch();
  }, [user, userLoading]);

  const checkAdminAndFetch = async () => {
    try {
      const res = await fetch("/api/admin/analytics");
      if (res.status === 403 || res.status === 401) {
        navigate("/dashboard");
        return;
      }
      if (res.ok) {
        const d = await res.json();
        setAnalytics(d);
        setIsAdmin(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading || loading) {
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

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* Admin Nav */}
      <nav className="border-b border-[#E5E7EB]/10 bg-[#0B1120]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
                <span className="text-white font-semibold">TicTac Arena</span>
              </a>
              <span className="text-[#EF4444] text-xs font-bold px-2 py-1 bg-[#EF4444]/10 rounded-md">
                ADMIN
              </span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/admin/users"
                className="text-sm text-gray-400 hover:text-white"
              >
                Users
              </a>
              <a
                href="/admin/reports"
                className="text-sm text-gray-400 hover:text-white"
              >
                Reports
              </a>
              <a
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-white"
              >
                ← Back
              </a>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Platform analytics and management
          </p>
        </div>

        {/* Overview Stats */}
        {analytics?.overview && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "Total Users",
                value: analytics.overview.totalUsers?.toLocaleString(),
                color: "text-[#6D28D9]",
                icon: "👥",
              },
              {
                label: "Total Matches",
                value: analytics.overview.totalMatches?.toLocaleString(),
                color: "text-[#22D3EE]",
                icon: "⚔️",
              },
              {
                label: "Active Today",
                value: analytics.overview.activeToday?.toLocaleString(),
                color: "text-[#22C55E]",
                icon: "🟢",
              },
              {
                label: "Matches Today",
                value: analytics.overview.matchesToday?.toLocaleString(),
                color: "text-[#F59E0B]",
                icon: "🎮",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-5"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{stat.icon}</span>
                  <span className="text-xs text-gray-400">{stat.label}</span>
                </div>
                <div className={`text-3xl font-bold ${stat.color}`}>
                  {stat.value || "0"}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Top Players */}
          <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Top Players
            </h2>
            <div className="space-y-3">
              {analytics?.topPlayers?.map((p, i) => (
                <div key={p.username} className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0
                        ? "bg-[#FFD700] text-black"
                        : i === 1
                          ? "bg-[#C0C0C0] text-black"
                          : i === 2
                            ? "bg-[#CD7F32] text-white"
                            : "bg-[#1F2937] text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">
                      {p.username}
                    </div>
                    <div className="text-xs text-gray-400">
                      {p.rank} · {p.total_wins}W / {p.total_matches} matches
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-[#6D28D9]">
                    {p.elo} ELO
                  </div>
                </div>
              )) || <p className="text-gray-500 text-sm">No data</p>}
            </div>
          </div>

          {/* Matches by Mode */}
          <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Matches by Mode
            </h2>
            <div className="space-y-3">
              {analytics?.matchesByMode?.map((mode) => {
                const total = analytics.matchesByMode.reduce(
                  (s, m) => s + parseInt(m.count),
                  0,
                );
                const pct =
                  total > 0
                    ? ((parseInt(mode.count) / total) * 100).toFixed(1)
                    : 0;
                return (
                  <div key={mode.mode}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300 capitalize">
                        {mode.mode}
                      </span>
                      <span className="text-white">
                        {parseInt(mode.count).toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#1F2937] rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              }) || <p className="text-gray-500 text-sm">No data</p>}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid sm:grid-cols-3 gap-4">
          <a
            href="/admin/users"
            className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-5 hover:border-[#6D28D9]/30 transition-colors"
          >
            <div className="text-2xl mb-3">👥</div>
            <h3 className="font-semibold text-white mb-1">Manage Users</h3>
            <p className="text-xs text-gray-400">Ban, mute, change roles</p>
          </a>
          <a
            href="/admin/reports"
            className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-5 hover:border-[#6D28D9]/30 transition-colors"
          >
            <div className="text-2xl mb-3">🚨</div>
            <h3 className="font-semibold text-white mb-1">Review Reports</h3>
            <p className="text-xs text-gray-400">Handle player reports</p>
          </a>
          <a
            href="/tournaments"
            className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-5 hover:border-[#6D28D9]/30 transition-colors"
          >
            <div className="text-2xl mb-3">🏆</div>
            <h3 className="font-semibold text-white mb-1">Tournaments</h3>
            <p className="text-xs text-gray-400">
              Create and manage tournaments
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
