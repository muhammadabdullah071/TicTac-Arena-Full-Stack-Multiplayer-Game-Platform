"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";

const RANK_COLORS = {
  Bronze: "from-[#CD7F32] to-[#8B4513]",
  Silver: "from-[#C0C0C0] to-[#808080]",
  Gold: "from-[#FFD700] to-[#FFA500]",
  Platinum: "from-[#E5E4E2] to-[#A0B2C6]",
  Diamond: "from-[#B9F2FF] to-[#00CED1]",
  Master: "from-[#9370DB] to-[#6A0DAD]",
  Legend: "from-[#FF6B6B] to-[#C92A2A]",
};

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

export default function ProfilePage() {
  const { userId } = useParams();
  const { data: currentUser } = useUser();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ username: "", bio: "" });
  const [matchHistory, setMatchHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [friendAction, setFriendAction] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState("cheating");
  const [reportDesc, setReportDesc] = useState("");
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchAll();
  }, [userId]);

  const fetchAll = async () => {
    try {
      const [profileRes, historyRes, achieveRes] = await Promise.all([
        fetch(`/api/profiles/${userId}`),
        fetch(`/api/matches/history?limit=20`),
        fetch(`/api/achievements?userId=${userId}`),
      ]);

      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
        setEditData({
          username: data.profile.username,
          bio: data.profile.bio || "",
        });
      }
      if (historyRes.ok) {
        const data = await historyRes.json();
        setMatchHistory(data.matches || []);
      }
      if (achieveRes.ok) {
        const data = await achieveRes.json();
        setAchievements(data.achievements?.filter((a) => a.unlocked) || []);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/profiles/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setIsEditing(false);
        setSuccess("Profile updated!");
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const sendFriendRequest = async () => {
    setFriendAction("sending");
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send_request", targetUserId: userId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSuccess(d.message);
      setFriendAction("sent");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
      setFriendAction(null);
      setTimeout(() => setError(null), 3000);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportedUserId: userId,
          reason: reportReason,
          description: reportDesc,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSuccess(d.message);
      setShowReport(false);
      setReportDesc("");
      setTimeout(() => setSuccess(null), 4000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div
          className="inline-block w-12 h-12 border-4 border-[#6D28D9] border-t-transparent rounded-full"
          style={{ animation: "spin 1s linear infinite" }}
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

  const isOwnProfile = currentUser?.id === userId;
  const winRate =
    profile.total_matches > 0
      ? ((profile.total_wins / profile.total_matches) * 100).toFixed(1)
      : 0;

  const getResultBadge = (result) => {
    if (result === "win")
      return { label: "W", cls: "bg-[#22C55E]/20 text-[#22C55E]" };
    if (result === "loss")
      return { label: "L", cls: "bg-[#EF4444]/20 text-[#EF4444]" };
    return { label: "D", cls: "bg-[#F59E0B]/20 text-[#F59E0B]" };
  };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {success && (
          <div className="mb-4 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-xl text-sm text-[#22C55E]">
            ✓ {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-xl text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="w-28 h-28 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-2xl flex items-center justify-center mb-4">
                <span className="text-5xl font-bold text-white">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div
                className={`px-4 py-1.5 rounded-xl bg-gradient-to-br ${RANK_COLORS[profile.rank] || "from-[#6D28D9] to-[#8B5CF6]"} mb-3`}
              >
                <span className="text-white font-bold text-sm">
                  {profile.rank}
                </span>
              </div>
              <div className="text-xs text-gray-500">Level {profile.level}</div>
            </div>

            {/* Details */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editData.username}
                      onChange={(e) =>
                        setEditData({ ...editData, username: e.target.value })
                      }
                      className="w-full bg-[#1F2937] border border-[#E5E7EB]/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Bio
                    </label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) =>
                        setEditData({ ...editData, bio: e.target.value })
                      }
                      rows={3}
                      placeholder="Tell us about yourself..."
                      className="w-full bg-[#1F2937] border border-[#E5E7EB]/10 rounded-xl px-4 py-2.5 text-white text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSave}
                      className="bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-[#1F2937] hover:bg-[#374151] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-white mb-1">
                        {profile.username}
                      </h1>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>
                          <span className="text-white font-semibold">
                            {profile.elo}
                          </span>{" "}
                          ELO
                        </span>
                        <span>·</span>
                        <span>
                          <span className="text-white font-semibold">
                            {profile.total_matches}
                          </span>{" "}
                          matches
                        </span>
                        <span>·</span>
                        <span className="text-[#F59E0B]">
                          🪙 {profile.coins.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isOwnProfile && (
                        <button
                          onClick={() => setIsEditing(true)}
                          className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-gray-300 text-sm rounded-xl transition-colors"
                        >
                          ✏️ Edit Profile
                        </button>
                      )}
                      {!isOwnProfile && currentUser && (
                        <>
                          <button
                            onClick={
                              friendAction !== "sent"
                                ? sendFriendRequest
                                : undefined
                            }
                            disabled={
                              friendAction === "sending" ||
                              friendAction === "sent"
                            }
                            className="px-4 py-2 bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-50 text-white text-sm rounded-xl transition-colors"
                          >
                            {friendAction === "sent"
                              ? "✓ Requested"
                              : friendAction === "sending"
                                ? "Sending..."
                                : "+ Add Friend"}
                          </button>
                          <button
                            onClick={() => setShowReport(!showReport)}
                            className="px-4 py-2 bg-[#1F2937] hover:bg-[#EF4444]/20 text-gray-400 hover:text-[#EF4444] text-sm rounded-xl transition-colors"
                          >
                            🚨 Report
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {profile.bio && (
                    <p className="text-gray-400 text-sm mb-4">{profile.bio}</p>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      {
                        label: "Win Rate",
                        value: `${winRate}%`,
                        color: "text-[#22C55E]",
                      },
                      {
                        label: "Wins",
                        value: profile.total_wins,
                        color: "text-[#22C55E]",
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
                    ].map((s) => (
                      <div
                        key={s.label}
                        className="bg-[#1F2937] rounded-xl p-3.5"
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {s.label}
                        </div>
                        <div className={`text-xl font-bold ${s.color}`}>
                          {s.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Report Form */}
        {showReport && (
          <div className="bg-[#111827] border border-[#EF4444]/20 rounded-2xl p-5 mb-6">
            <h3 className="text-base font-semibold text-white mb-4">
              Report {profile.username}
            </h3>
            <form onSubmit={submitReport} className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Reason
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full bg-[#1F2937] border border-[#E5E7EB]/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                >
                  <option value="cheating">Cheating</option>
                  <option value="harassment">Harassment</option>
                  <option value="spam">Spam</option>
                  <option value="inappropriate_name">Inappropriate Name</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Description (optional)
                </label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  rows={2}
                  maxLength={500}
                  placeholder="Describe what happened..."
                  className="w-full bg-[#1F2937] border border-[#E5E7EB]/10 rounded-xl px-4 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-2 focus:ring-[#EF4444]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white text-sm font-medium rounded-xl transition-colors"
                >
                  Submit Report
                </button>
                <button
                  type="button"
                  onClick={() => setShowReport(false)}
                  className="px-4 py-2 bg-[#1F2937] text-gray-400 text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-1 mb-6">
          {["overview", "history", "achievements"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab ? "bg-[#6D28D9] text-white" : "text-gray-400 hover:text-white"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-white mb-4">
                Match Record
              </h2>
              <div className="space-y-3">
                {[
                  {
                    label: "Wins",
                    value: profile.total_wins,
                    color: "text-[#22C55E]",
                    bar:
                      profile.total_matches > 0
                        ? (profile.total_wins / profile.total_matches) * 100
                        : 0,
                  },
                  {
                    label: "Losses",
                    value: profile.total_losses,
                    color: "text-[#EF4444]",
                    bar:
                      profile.total_matches > 0
                        ? (profile.total_losses / profile.total_matches) * 100
                        : 0,
                  },
                  {
                    label: "Draws",
                    value: profile.total_draws,
                    color: "text-gray-400",
                    bar:
                      profile.total_matches > 0
                        ? (profile.total_draws / profile.total_matches) * 100
                        : 0,
                  },
                ].map((s) => (
                  <div key={s.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{s.label}</span>
                      <span className={`font-semibold ${s.color}`}>
                        {s.value}
                      </span>
                    </div>
                    <div className="w-full bg-[#1F2937] rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${s.label === "Wins" ? "bg-[#22C55E]" : s.label === "Losses" ? "bg-[#EF4444]" : "bg-gray-500"}`}
                        style={{ width: `${s.bar}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-5">
              <h2 className="text-base font-semibold text-white mb-4">
                Level Progress
              </h2>
              <div className="mb-5">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Level {profile.level}</span>
                  <span className="text-gray-400">
                    {profile.xp % 1000} / 1000 XP
                  </span>
                </div>
                <div className="w-full bg-[#1F2937] rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] h-3 rounded-full"
                    style={{ width: `${(profile.xp % 1000) / 10}%` }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total XP</span>
                  <span className="text-white font-semibold">
                    {profile.xp.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Coins</span>
                  <span className="text-[#F59E0B] font-semibold">
                    🪙 {profile.coins.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Match History Tab */}
        {activeTab === "history" && (
          <div>
            {matchHistory.length === 0 ? (
              <div className="text-center py-16 bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl">
                <div className="text-4xl mb-3">🎮</div>
                <p className="text-gray-400">No match history yet</p>
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
                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${badge.cls}`}
                      >
                        {badge.label}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">
                          vs {m.opponent || "AI"}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {m.mode} · {new Date(m.playedAt).toLocaleDateString()}
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
        )}

        {/* Achievements Tab */}
        {activeTab === "achievements" && (
          <div>
            {achievements.length === 0 ? (
              <div className="text-center py-16 bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl">
                <div className="text-4xl mb-3">🏅</div>
                <p className="text-gray-400">No achievements unlocked yet</p>
                <a
                  href="/achievements"
                  className="text-xs text-[#6D28D9] hover:underline mt-2 block"
                >
                  View all achievements →
                </a>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {achievements.map((a) => (
                  <div
                    key={a.id}
                    className="bg-[#111827] border border-[#6D28D9]/30 rounded-xl p-4 flex items-center gap-3"
                  >
                    <div className="w-12 h-12 bg-[#6D28D9]/20 rounded-xl flex items-center justify-center text-xl shrink-0">
                      {ICON_MAP[a.icon_key] || "🏅"}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate">
                        {a.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {a.description}
                      </div>
                      {a.unlocked_at && (
                        <div className="text-[10px] text-[#22C55E] mt-0.5">
                          ✓ {new Date(a.unlocked_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
