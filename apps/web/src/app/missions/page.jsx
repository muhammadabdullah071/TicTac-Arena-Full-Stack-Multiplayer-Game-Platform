"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";

export default function MissionsPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [missions, setMissions] = useState([]);
  const [dailyReward, setDailyReward] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claimingMission, setClaimingMission] = useState({});
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!userLoading && !user) navigate("/account/signin");
    else if (user) {
      fetchMissions();
      fetchDailyReward();
    }
  }, [user, userLoading]);

  const fetchMissions = async () => {
    try {
      const res = await fetch("/api/missions");
      if (res.ok) {
        const d = await res.json();
        setMissions(d.missions || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyReward = async () => {
    try {
      const res = await fetch("/api/economy/daily");
      if (res.ok) {
        const d = await res.json();
        setDailyReward(d);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const claimMission = async (missionId) => {
    setClaimingMission((prev) => ({ ...prev, [missionId]: true }));
    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", missionId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSuccess(`Claimed! +${d.xpEarned} XP, +${d.coinsEarned} coins`);
      fetchMissions();
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setClaimingMission((prev) => ({ ...prev, [missionId]: false }));
    }
  };

  const claimDaily = async () => {
    setClaimingDaily(true);
    try {
      const res = await fetch("/api/economy/daily", { method: "POST" });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSuccess(
        `Daily reward claimed! +${d.coinsEarned} coins, +${d.xpEarned} XP (Day ${d.streak})`,
      );
      fetchDailyReward();
      setTimeout(() => setSuccess(null), 5000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setClaimingDaily(false);
    }
  };

  const dailyMissions = missions.filter((m) => m.type === "daily");
  const weeklyMissions = missions.filter((m) => m.type === "weekly");

  const filteredMissions =
    filter === "daily"
      ? dailyMissions
      : filter === "weekly"
        ? weeklyMissions
        : missions;

  const formatTimeLeft = (expiresAt) => {
    const ms = new Date(expiresAt) - new Date();
    if (ms <= 0) return "Expired";
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

  const formatDailyReset = (ms) => {
    if (!ms) return "";
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${mins}m`;
  };

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
      <NavBar active="missions" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">
            Daily Missions
          </h1>
          <p className="text-gray-400">
            Complete missions to earn XP and coins
          </p>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg text-sm text-[#22C55E]">
            🎉 {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        {/* Daily Login Reward */}
        {dailyReward && (
          <div
            className={`mb-8 rounded-2xl p-6 border ${
              dailyReward.canClaim
                ? "bg-gradient-to-r from-[#6D28D9]/20 to-[#8B5CF6]/10 border-[#6D28D9]/30"
                : "bg-[#111827] border-[#E5E7EB]/10"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🗓️</span>
                  <h2 className="text-lg font-semibold text-white">
                    Daily Login Reward
                  </h2>
                </div>
                <p className="text-sm text-gray-400">
                  {dailyReward.canClaim
                    ? `Day ${dailyReward.currentStreak} streak — Claim your reward!`
                    : `Next reward in ${formatDailyReset(dailyReward.msUntilReset)}`}
                </p>
                {dailyReward.nextReward && (
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs text-[#F59E0B]">
                      🪙 {dailyReward.nextReward.coins} coins
                    </span>
                    <span className="text-xs text-[#8B5CF6]">
                      ⚡ {dailyReward.nextReward.xp} XP
                    </span>
                    {dailyReward.currentStreak > 1 && (
                      <span className="text-xs text-[#22C55E]">
                        🔥 Day {dailyReward.currentStreak} streak bonus!
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={claimDaily}
                disabled={!dailyReward.canClaim || claimingDaily}
                className={`px-6 py-3 rounded-xl font-semibold text-sm transition-all ${
                  dailyReward.canClaim
                    ? "bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] text-white hover:opacity-90"
                    : "bg-[#1F2937] text-gray-500 cursor-not-allowed"
                }`}
              >
                {claimingDaily
                  ? "Claiming..."
                  : dailyReward.canClaim
                    ? "🎁 Claim"
                    : "✓ Claimed"}
              </button>
            </div>

            {/* Streak Calendar */}
            <div className="mt-4 flex gap-2">
              {Array.from({ length: 7 }, (_, i) => i + 1).map((day) => (
                <div
                  key={day}
                  className={`flex-1 aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                    day < dailyReward.currentStreak
                      ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30"
                      : day === dailyReward.currentStreak &&
                          !dailyReward.canClaim
                        ? "bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30"
                        : "bg-[#1F2937] text-gray-500 border border-[#E5E7EB]/5"
                  }`}
                >
                  {day <
                  (dailyReward.canClaim
                    ? dailyReward.currentStreak
                    : dailyReward.currentStreak + 1)
                    ? "✓"
                    : day}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "all", label: `All (${missions.length})` },
            { id: "daily", label: `Daily (${dailyMissions.length})` },
            { id: "weekly", label: `Weekly (${weeklyMissions.length})` },
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

        {/* Missions */}
        <div className="space-y-3">
          {filteredMissions.length === 0 ? (
            <div className="text-center py-16 bg-[#111827] border border-[#E5E7EB]/10 rounded-xl">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-gray-400">No missions available</p>
            </div>
          ) : (
            filteredMissions.map((mission) => {
              const progress = Math.min(
                mission.progress,
                mission.requirement_value,
              );
              const pct =
                mission.requirement_value > 0
                  ? (progress / mission.requirement_value) * 100
                  : 0;

              return (
                <div
                  key={mission.id}
                  className={`bg-[#111827] border rounded-xl p-5 transition-all ${
                    mission.completed && !mission.claimed
                      ? "border-[#22C55E]/40"
                      : mission.claimed
                        ? "border-[#E5E7EB]/5 opacity-60"
                        : "border-[#E5E7EB]/10"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        mission.claimed
                          ? "bg-[#22C55E]/10"
                          : mission.completed
                            ? "bg-[#22C55E]/20"
                            : "bg-[#1F2937]"
                      }`}
                    >
                      <span className="text-xl">
                        {mission.claimed
                          ? "✅"
                          : mission.completed
                            ? "🎁"
                            : mission.type === "daily"
                              ? "📅"
                              : "📆"}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <span
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full mr-2 ${
                              mission.type === "daily"
                                ? "bg-[#6D28D9]/20 text-[#8B5CF6]"
                                : "bg-[#F59E0B]/20 text-[#F59E0B]"
                            }`}
                          >
                            {mission.type.toUpperCase()}
                          </span>
                          <span className="text-sm font-semibold text-white">
                            {mission.title}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 shrink-0">
                          {!mission.claimed &&
                            `${formatTimeLeft(mission.expires_at)} left`}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">
                        {mission.description}
                      </p>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400">Progress</span>
                          <span className="text-white">
                            {progress} / {mission.requirement_value}
                          </span>
                        </div>
                        <div className="w-full bg-[#1F2937] rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${mission.completed ? "bg-[#22C55E]" : "bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6]"}`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-3 text-xs">
                          {mission.xp_reward > 0 && (
                            <span className="text-[#8B5CF6]">
                              ⚡ +{mission.xp_reward} XP
                            </span>
                          )}
                          {mission.coin_reward > 0 && (
                            <span className="text-[#F59E0B]">
                              🪙 +{mission.coin_reward}
                            </span>
                          )}
                        </div>
                        {mission.completed && !mission.claimed && (
                          <button
                            onClick={() => claimMission(mission.id)}
                            disabled={claimingMission[mission.id]}
                            className="px-4 py-1.5 bg-[#22C55E] hover:bg-[#16A34A] text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            {claimingMission[mission.id]
                              ? "Claiming..."
                              : "Claim Reward"}
                          </button>
                        )}
                        {mission.claimed && (
                          <span className="text-xs text-[#22C55E] font-medium">
                            ✓ Claimed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
