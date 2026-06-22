"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";

const ICON_MAP = {
  trophy: "🏆",
  trophy_x10: "🥇",
  trophy_x100: "💫",
  trophy_x500: "⭐",
  trophy_legendary: "👑",
  streak_5: "🔥",
  streak_10: "🔥🔥",
  streak_20: "💥",
  ai_slayer: "🤖",
  legend: "👑",
  tournament_champ: "🎖️",
  tournament_first: "🎪",
  ultimate: "🎯",
  perfect_day: "⚡",
  friends: "👥",
  ranked: "⚔️",
  level_10: "📈",
  level_25: "🚀",
  level_50: "💎",
};

export default function AchievementsPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [achievements, setAchievements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | unlocked | locked

  useEffect(() => {
    if (!userLoading && !user) navigate("/account/signin");
    else if (user) fetchAchievements();
  }, [user, userLoading]);

  const fetchAchievements = async () => {
    try {
      const res = await fetch("/api/achievements");
      if (res.ok) {
        const d = await res.json();
        setAchievements(d.achievements || []);
        setStats(d.stats);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = achievements.filter((a) => {
    if (filter === "unlocked") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    return true;
  });

  const formatDate = (ts) => (ts ? new Date(ts).toLocaleDateString() : "");

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6D28D9] border-t-transparent rounded-full animate-spin"></div>
        <style
          jsx
          global
        >{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar active="achievements" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">
            Achievements
          </h1>
          <p className="text-gray-400">
            Complete challenges to earn XP and coins
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-white">
                {stats.unlocked}
              </div>
              <div className="text-xs text-gray-400 mt-1">Unlocked</div>
            </div>
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-white">{stats.total}</div>
              <div className="text-xs text-gray-400 mt-1">Total</div>
            </div>
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-[#8B5CF6]">
                {stats.totalXP.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">XP Earned</div>
            </div>
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-5 text-center">
              <div className="text-3xl font-bold text-[#F59E0B]">
                {stats.totalCoins.toLocaleString()}
              </div>
              <div className="text-xs text-gray-400 mt-1">Coins Earned</div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        {stats && (
          <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-5 mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-white">
                Overall Progress
              </span>
              <span className="text-sm text-gray-400">
                {stats.unlocked} / {stats.total}
              </span>
            </div>
            <div className="w-full bg-[#1F2937] rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] rounded-full transition-all"
                style={{
                  width: `${stats.total > 0 ? (stats.unlocked / stats.total) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "all", label: "All" },
            { id: "unlocked", label: `Unlocked (${stats?.unlocked || 0})` },
            {
              id: "locked",
              label: `Locked (${(stats?.total || 0) - (stats?.unlocked || 0)})`,
            },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f.id
                  ? "bg-[#6D28D9] text-white"
                  : "bg-[#111827] border border-[#E5E7EB]/10 text-gray-400 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Achievements Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((achievement) => (
            <div
              key={achievement.id}
              className={`bg-[#111827] border rounded-xl p-5 transition-all ${
                achievement.unlocked
                  ? "border-[#6D28D9]/40 hover:border-[#6D28D9]/60"
                  : "border-[#E5E7EB]/10 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                    achievement.unlocked ? "bg-[#6D28D9]/20" : "bg-[#1F2937]"
                  }`}
                >
                  {achievement.unlocked
                    ? ICON_MAP[achievement.icon_key] || "🏅"
                    : "🔒"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm mb-1">
                    {achievement.name}
                  </div>
                  <div className="text-xs text-gray-400 mb-3">
                    {achievement.description}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {achievement.xp_reward > 0 && (
                      <span className="flex items-center gap-1 text-[#8B5CF6]">
                        <span>⚡</span> {achievement.xp_reward} XP
                      </span>
                    )}
                    {achievement.coin_reward > 0 && (
                      <span className="flex items-center gap-1 text-[#F59E0B]">
                        <span>🪙</span> {achievement.coin_reward}
                      </span>
                    )}
                  </div>

                  {achievement.unlocked && achievement.unlocked_at && (
                    <div className="mt-2 text-[10px] text-[#22C55E]">
                      ✓ Unlocked {formatDate(achievement.unlocked_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🔍</div>
            <p className="text-gray-400">No achievements in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
