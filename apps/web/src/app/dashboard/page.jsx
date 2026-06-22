"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";

export default function DashboardPage() {
  const { data: user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [matchHistory, setMatchHistory] = useState([]);
  const [dailyReward, setDailyReward] = useState(null);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/account/signin");
    } else if (user) {
      fetchAll();
    }
  }, [user, userLoading, navigate]);

  const fetchAll = async () => {
    try {
      const [profileRes, historyRes, dailyRes] = await Promise.all([
        fetch(`/api/profiles/${user.id}`),
        fetch("/api/matches/history?limit=5"),
        fetch("/api/economy/daily"),
      ]);
      if (profileRes.ok) {
        const d = await profileRes.json();
        setProfile(d.profile);
      }
      if (historyRes.ok) {
        const d = await historyRes.json();
        setMatchHistory(d.matches || []);
      }
      if (dailyRes.ok) {
        const d = await dailyRes.json();
        setDailyReward(d);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const claimDaily = async () => {
    setClaimingDaily(true);
    try {
      const res = await fetch("/api/economy/daily", { method: "POST" });
      const d = await res.json();
      if (res.ok) {
        setClaimSuccess(`+${d.coinsEarned} coins, +${d.xpEarned} XP`);
        fetchAll();
        setTimeout(() => setClaimSuccess(null), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setClaimingDaily(false);
    }
  };

  const getRankColor = (rank) => {
    const colors = {
      Bronze: "from-[#CD7F32] to-[#8B4513]",
      Silver: "from-[#C0C0C0] to-[#808080]",
      Gold: "from-[#FFD700] to-[#FFA500]",
      Platinum: "from-[#E5E4E2] to-[#A0B2C6]",
      Diamond: "from-[#B9F2FF] to-[#00CED1]",
      Master: "from-[#9370DB] to-[#6A0DAD]",
      Legend: "from-[#FF6B6B] to-[#C92A2A]",
    };
    return colors[rank] || "from-[#6D28D9] to-[#8B5CF6]";
  };

  const getResultBadge = (result) => {
    if (result === "win")
      return { label: "W", cls: "bg-[#22C55E]/20 text-[#22C55E]" };
    if (result === "loss")
      return { label: "L", cls: "bg-[#EF4444]/20 text-[#EF4444]" };
    return { label: "D", cls: "bg-[#F59E0B]/20 text-[#F59E0B]" };
  };

  const spinStyle = { animation: "spin 1s linear infinite" };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div
          className="inline-block w-12 h-12 border-4 border-[#6D28D9] border-t-transparent rounded-full"
          style={spinStyle}
        ></div>
        <style
          jsx
          global
        >{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Profile not found</p>
          <a href="/" className="text-[#6D28D9] hover:text-[#8B5CF6]">
            Return home
          </a>
        </div>
      </div>
    );
  }

  const winRate =
    profile.total_matches > 0
      ? ((profile.total_wins / profile.total_matches) * 100).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar active="dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {claimSuccess && (
          <div className="mb-4 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl text-sm text-[#22C55E]">
            🎁 Daily reward claimed! {claimSuccess}
          </div>
        )}

        {/* Welcome Header */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Welcome back,{" "}
              <span className="text-[#8B5CF6]">{profile.username}</span>!
            </h1>
            <p className="text-gray-400">Ready to dominate the arena?</p>
          </div>

          {/* Daily Reward */}
          {dailyReward && (
            <button
              onClick={dailyReward.canClaim ? claimDaily : undefined}
              disabled={!dailyReward.canClaim || claimingDaily}
              className={`flex items-center gap-3 px-5 py-3 rounded-xl border transition-all ${
                dailyReward.canClaim
                  ? "bg-gradient-to-r from-[#F59E0B]/20 to-[#D97706]/10 border-[#F59E0B]/30 hover:border-[#F59E0B]/50 cursor-pointer"
                  : "bg-[#111827] border-[#E5E7EB]/10 cursor-default"
              }`}
            >
              <span className="text-2xl">
                {dailyReward.canClaim ? "🎁" : "✅"}
              </span>
              <div className="text-left">
                <div className="text-sm font-semibold text-white">
                  {claimingDaily
                    ? "Claiming..."
                    : dailyReward.canClaim
                      ? "Claim Daily Reward"
                      : "Daily Claimed"}
                </div>
                <div className="text-xs text-gray-400">
                  {dailyReward.canClaim
                    ? `Day ${dailyReward.currentStreak} · 🪙${dailyReward.nextReward?.coins} + ⚡${dailyReward.nextReward?.xp}`
                    : `Resets in ${Math.floor((dailyReward.msUntilReset || 0) / 3600000)}h`}
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Profile Stats Card */}
        <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Rank */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-5">
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getRankColor(profile.rank)} flex items-center justify-center shrink-0`}
                >
                  <span className="text-3xl">⚔️</span>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-400 mb-1">
                    Current Rank
                  </div>
                  <div className="text-2xl font-bold text-white">
                    {profile.rank}
                  </div>
                  <div className="text-sm text-gray-400 mt-0.5">
                    {profile.elo} ELO
                  </div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs text-gray-400">
                    Level {profile.level}
                  </span>
                  <span className="text-xs text-gray-500">
                    {profile.xp % 1000} / 1000 XP
                  </span>
                </div>
                <div className="w-full bg-[#1F2937] rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] h-2 rounded-full transition-all"
                    style={{ width: `${(profile.xp % 1000) / 10}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Win Rate",
                  value: `${winRate}%`,
                  color: "text-[#22C55E]",
                },
                {
                  label: "Total Matches",
                  value: profile.total_matches,
                  color: "text-white",
                },
                {
                  label: "Win Streak",
                  value: profile.win_streak,
                  color: "text-[#F59E0B]",
                },
                {
                  label: "Best Streak",
                  value: profile.highest_streak,
                  color: "text-[#8B5CF6]",
                },
                {
                  label: "Wins",
                  value: profile.total_wins,
                  color: "text-[#22C55E]",
                },
                {
                  label: "Losses",
                  value: profile.total_losses,
                  color: "text-[#EF4444]",
                },
                {
                  label: "Draws",
                  value: profile.total_draws,
                  color: "text-[#F59E0B]",
                },
                {
                  label: "Coins",
                  value: profile.coins.toLocaleString(),
                  color: "text-[#F59E0B]",
                },
              ].map((s) => (
                <div key={s.label} className="bg-[#1F2937] rounded-xl p-3.5">
                  <div className="text-xs text-gray-400 mb-1">{s.label}</div>
                  <div className={`text-xl font-bold ${s.color}`}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-white">Quick Play</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <a
                href="/play/multiplayer"
                className="bg-gradient-to-br from-[#6D28D9] to-[#5B21B6] rounded-2xl p-5 hover:opacity-90 transition-opacity group"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl">
                    ⚡
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">
                      Real Multiplayer
                    </div>
                    <div className="text-xs text-white/60">
                      Play live vs real players
                    </div>
                  </div>
                </div>
                <div className="text-xs text-white/50">
                  Real-time · ELO ranked
                </div>
              </a>

              <a
                href="/play/ranked"
                className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-5 hover:border-[#6D28D9]/30 transition-colors"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-[#F59E0B]/10 rounded-xl flex items-center justify-center text-2xl">
                    🏆
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">
                      Quick Ranked
                    </div>
                    <div className="text-xs text-gray-400">Fast ELO match</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Ranked · ELO changes
                </div>
              </a>

              <a
                href="/play/ai"
                className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-5 hover:border-[#22C55E]/30 transition-colors"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-[#22C55E]/10 rounded-xl flex items-center justify-center text-2xl">
                    🤖
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">vs AI</div>
                    <div className="text-xs text-gray-400">
                      4 difficulty levels
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">Practice · Earn XP</div>
              </a>

              <a
                href="/play/ultimate"
                className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-5 hover:border-[#8B5CF6]/30 transition-colors"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-[#8B5CF6]/10 rounded-xl flex items-center justify-center text-2xl">
                    🎯
                  </div>
                  <div>
                    <div className="text-base font-bold text-white">
                      Ultimate Mode
                    </div>
                    <div className="text-xs text-gray-400">
                      9-board challenge
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  Strategic · Advanced
                </div>
              </a>
            </div>

            {/* Match History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">
                  Recent Matches
                </h2>
                <a
                  href={`/profile/${user.id}`}
                  className="text-xs text-[#6D28D9] hover:text-[#8B5CF6]"
                >
                  View all →
                </a>
              </div>

              {matchHistory.length === 0 ? (
                <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-10 text-center">
                  <div className="text-4xl mb-3">🎮</div>
                  <p className="text-gray-400 mb-3">No matches yet</p>
                  <a
                    href="/play/multiplayer"
                    className="inline-flex items-center bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Play First Match
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {matchHistory.map((m) => {
                    const badge = getResultBadge(m.result);
                    return (
                      <div
                        key={m.id}
                        className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-4 flex items-center gap-4 hover:border-[#6D28D9]/20 transition-colors"
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${badge.cls}`}
                        >
                          {badge.label}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white">
                            vs {m.opponent || "AI"}
                          </div>
                          <div className="text-xs text-gray-500 capitalize">
                            {m.mode} ·{" "}
                            {new Date(m.playedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {m.xpEarned > 0 && (
                            <div className="text-xs text-[#8B5CF6]">
                              +{m.xpEarned} XP
                            </div>
                          )}
                          {m.eloChange !== 0 && (
                            <div
                              className={`text-xs font-medium ${m.eloChange > 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}
                            >
                              {m.eloChange > 0 ? "+" : ""}
                              {m.eloChange} ELO
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Profile Quick Link */}
            <a
              href={`/profile/${user.id}`}
              className="block bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-5 hover:border-[#6D28D9]/30 transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {profile.username[0].toUpperCase()}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-white">
                    {profile.username}
                  </div>
                  <div className="text-xs text-gray-400">
                    {profile.rank} · Level {profile.level}
                  </div>
                </div>
              </div>
              <div className="text-xs text-[#6D28D9] font-medium">
                View & Edit Profile →
              </div>
            </a>

            {/* Quick Links */}
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">
                Quick Links
              </h3>
              <div className="space-y-2">
                {[
                  { href: "/missions", icon: "📋", label: "Daily Missions" },
                  { href: "/achievements", icon: "🏅", label: "Achievements" },
                  { href: "/shop", icon: "🛍️", label: "Shop" },
                  { href: "/leaderboard", icon: "📊", label: "Leaderboard" },
                  { href: "/tournaments", icon: "🏆", label: "Tournaments" },
                  { href: "/friends", icon: "👥", label: "Friends" },
                  { href: "/chat", icon: "💬", label: "Global Chat" },
                ].map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm text-gray-300 hover:text-white"
                  >
                    <span>{l.icon}</span>
                    <span>{l.label}</span>
                    <span className="ml-auto text-gray-600">→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
