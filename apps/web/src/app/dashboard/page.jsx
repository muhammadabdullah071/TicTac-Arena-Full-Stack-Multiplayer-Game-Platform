"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";

/* ── SVG Icons ── */
const IconTrophy = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
  </svg>
);
const IconBolt = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconBot = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);
const IconGrid = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
);
const IconStar = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const IconGift = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" />
    <line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const RANK_COLORS = {
  Bronze: "#CD7F32", Silver: "#C0C0C0", Gold: "#FFD700",
  Platinum: "#A0B2C6", Diamond: "#67E8F9", Master: "#9370DB", Legend: "#FF6B6B",
};
const RANK_GRADIENTS = {
  Bronze: "from-[#CD7F32] to-[#8B4513]", Silver: "from-[#C0C0C0] to-[#808080]",
  Gold: "from-[#FFD700] to-[#FFA500]", Platinum: "from-[#E5E4E2] to-[#A0B2C6]",
  Diamond: "from-[#B9F2FF] to-[#00CED1]", Master: "from-[#9370DB] to-[#6A0DAD]",
  Legend: "from-[#FF6B6B] to-[#C92A2A]",
};

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
    if (!userLoading && !user) navigate("/account/signin");
    else if (user) fetchAll();
  }, [user, userLoading, navigate]);

  const fetchAll = async () => {
    try {
      const [profileRes, historyRes, dailyRes] = await Promise.all([
        fetch(`/api/profiles/${user.id}`),
        fetch("/api/matches/history?limit=5"),
        fetch("/api/economy/daily"),
      ]);
      if (profileRes.ok) setProfile((await profileRes.json()).profile);
      if (historyRes.ok) setMatchHistory((await historyRes.json()).matches || []);
      if (dailyRes.ok) setDailyReward(await dailyRes.json());
    } catch (e) {
      console.error("Dashboard fetch error:", e);
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
        setClaimSuccess(`+${d.coinsEarned} coins · +${d.xpEarned} XP`);
        fetchAll();
        setTimeout(() => setClaimSuccess(null), 4000);
      }
    } catch (e) { console.error(e); }
    finally { setClaimingDaily(false); }
  };

  const resultBadge = (r) => {
    if (r === "win")  return { label: "W", color: "#10B981", bg: "rgba(16,185,129,0.15)" };
    if (r === "loss") return { label: "L", color: "#EF4444", bg: "rgba(239,68,68,0.15)" };
    return { label: "D", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" };
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050B18" }}>
        <div className="w-12 h-12 border-4 rounded-full"
          style={{ borderColor: "#7C3AED", borderTopColor: "transparent", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#050B18" }}>
        <div className="text-center">
          <p className="text-white text-lg mb-4">Profile not found</p>
          <a href="/" style={{ color: "#7C3AED" }}>Return home</a>
        </div>
      </div>
    );
  }

  const winRate = profile.total_matches > 0
    ? ((profile.total_wins / profile.total_matches) * 100).toFixed(1) : 0;
  const rankColor = RANK_COLORS[profile.rank] || "#7C3AED";
  const rankGradient = RANK_GRADIENTS[profile.rank] || "from-[#7C3AED] to-[#6D28D9]";

  return (
    <div className="min-h-screen" style={{ background: "#050B18" }}>
      <NavBar active="dashboard" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Success banner */}
        {claimSuccess && (
          <div className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#6EE7B7" }}>
            <IconCheck /> Daily reward claimed! {claimSuccess}
          </div>
        )}

        {/* Welcome + Daily Reward */}
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">
              Welcome back,{" "}
              <span style={{ color: "#A78BFA" }}>{profile.username}</span>
            </h1>
            <p style={{ color: "#64748B" }}>Ready to dominate the arena?</p>
          </div>

          {dailyReward && (
            <button
              onClick={dailyReward.canClaim ? claimDaily : undefined}
              disabled={!dailyReward.canClaim || claimingDaily}
              className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all"
              style={{
                background: dailyReward.canClaim ? "rgba(245,158,11,0.1)" : "rgba(13,21,38,0.9)",
                border: dailyReward.canClaim ? "1px solid rgba(245,158,11,0.35)" : "1px solid rgba(124,58,237,0.15)",
                cursor: dailyReward.canClaim ? "pointer" : "default",
              }}
              onMouseEnter={(e) => { if (dailyReward.canClaim) e.currentTarget.style.borderColor = "rgba(245,158,11,0.6)"; }}
              onMouseLeave={(e) => { if (dailyReward.canClaim) e.currentTarget.style.borderColor = "rgba(245,158,11,0.35)"; }}
            >
              <div style={{ color: dailyReward.canClaim ? "#F59E0B" : "#64748B" }}>
                {dailyReward.canClaim ? <IconGift /> : <IconCheck />}
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-white">
                  {claimingDaily ? "Claiming..." : dailyReward.canClaim ? "Claim Daily Reward" : "Daily Claimed"}
                </div>
                <div className="text-xs" style={{ color: "#64748B" }}>
                  {dailyReward.canClaim
                    ? `Day ${dailyReward.currentStreak} · ${dailyReward.nextReward?.coins} coins + ${dailyReward.nextReward?.xp} XP`
                    : `Resets in ${Math.floor((dailyReward.msUntilReset || 0) / 3600000)}h`}
                </div>
              </div>
            </button>
          )}
        </div>

        {/* Profile stats card */}
        <div className="rounded-2xl p-6 mb-6"
          style={{ background: "#0D1526", border: "1px solid rgba(30,58,138,0.4)" }}>
          <div className="flex flex-col md:flex-row gap-8">

            {/* Rank block */}
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-5">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${rankGradient} flex items-center justify-center shrink-0`}>
                  <IconTrophy />
                </div>
                <div>
                  <div className="text-xs font-medium mb-1" style={{ color: "#64748B" }}>Current Rank</div>
                  <div className="text-2xl font-bold" style={{ color: rankColor }}>{profile.rank}</div>
                  <div className="text-sm mt-0.5" style={{ color: "#94A3B8" }}>{profile.elo} ELO</div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1.5">
                  <span className="text-xs" style={{ color: "#64748B" }}>Level {profile.level}</span>
                  <span className="text-xs" style={{ color: "#475569" }}>{profile.xp % 1000} / 1000 XP</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="h-2 rounded-full transition-all"
                    style={{ width: `${(profile.xp % 1000) / 10}%`, background: "linear-gradient(90deg, #7C3AED, #A78BFA)" }} />
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Win Rate",      value: `${winRate}%`,                color: "#10B981" },
                { label: "Matches",       value: profile.total_matches,         color: "#F8FAFC" },
                { label: "Win Streak",    value: profile.win_streak,            color: "#F59E0B" },
                { label: "Best Streak",   value: profile.highest_streak,        color: "#A78BFA" },
                { label: "Wins",          value: profile.total_wins,            color: "#10B981" },
                { label: "Losses",        value: profile.total_losses,          color: "#EF4444" },
                { label: "Draws",         value: profile.total_draws,           color: "#F59E0B" },
                { label: "Coins",         value: profile.coins.toLocaleString(), color: "#F59E0B" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl p-3.5"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-xs mb-1" style={{ color: "#64748B" }}>{s.label}</div>
                  <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main grid */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left — Quick Play + History */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-white mb-3">Quick Play</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {/* Multiplayer — featured */}
                <a href="/play/multiplayer"
                  className="rounded-2xl p-5 transition-all"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #5B21B6)" }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.9"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
                      <IconBolt />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">Real Multiplayer</div>
                      <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Live vs real players</div>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>Real-time · ELO ranked</div>
                </a>

                {/* Ranked */}
                <a href="/play/ranked"
                  className="rounded-2xl p-5 transition-all"
                  style={{ background: "#0D1526", border: "1px solid rgba(30,58,138,0.4)" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(30,58,138,0.4)"}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(245,158,11,0.1)", color: "#F59E0B" }}>
                      <IconTrophy />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">Quick Ranked</div>
                      <div className="text-xs" style={{ color: "#64748B" }}>Fast ELO match</div>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: "#475569" }}>Ranked · ELO changes</div>
                </a>

                {/* vs AI */}
                <a href="/play/ai"
                  className="rounded-2xl p-5 transition-all"
                  style={{ background: "#0D1526", border: "1px solid rgba(30,58,138,0.4)" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(16,185,129,0.4)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(30,58,138,0.4)"}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(16,185,129,0.1)", color: "#10B981" }}>
                      <IconBot />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">vs AI</div>
                      <div className="text-xs" style={{ color: "#64748B" }}>4 difficulty levels</div>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: "#475569" }}>Practice · Earn XP</div>
                </a>

                {/* Ultimate */}
                <a href="/play/ultimate"
                  className="rounded-2xl p-5 transition-all"
                  style={{ background: "#0D1526", border: "1px solid rgba(30,58,138,0.4)" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(167,139,250,0.4)"}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(30,58,138,0.4)"}
                >
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "rgba(167,139,250,0.1)", color: "#A78BFA" }}>
                      <IconGrid />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white">Ultimate Mode</div>
                      <div className="text-xs" style={{ color: "#64748B" }}>9-board challenge</div>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: "#475569" }}>Strategic · Advanced</div>
                </a>
              </div>
            </div>

            {/* Match History */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Recent Matches</h2>
                <a href={`/profile/${user.id}`} className="text-xs transition-colors"
                  style={{ color: "#7C3AED" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#A78BFA"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#7C3AED"}
                >View all</a>
              </div>

              {matchHistory.length === 0 ? (
                <div className="rounded-2xl p-10 text-center"
                  style={{ background: "#0D1526", border: "1px solid rgba(30,58,138,0.4)" }}>
                  <p className="mb-3" style={{ color: "#64748B" }}>No matches yet</p>
                  <a href="/play/multiplayer"
                    className="inline-flex items-center text-white text-sm font-medium px-5 py-2.5 rounded-xl transition-all"
                    style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)", boxShadow: "0 4px 14px rgba(124,58,237,0.4)" }}>
                    Play First Match
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  {matchHistory.map((m) => {
                    const badge = resultBadge(m.result);
                    return (
                      <div key={m.id}
                        className="rounded-xl p-4 flex items-center gap-4 transition-all"
                        style={{ background: "#0D1526", border: "1px solid rgba(30,58,138,0.4)" }}
                        onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(124,58,237,0.3)"}
                        onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(30,58,138,0.4)"}
                      >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                          style={{ background: badge.bg, color: badge.color }}>
                          {badge.label}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white">vs {m.opponent || "AI"}</div>
                          <div className="text-xs capitalize" style={{ color: "#475569" }}>
                            {m.mode} · {new Date(m.playedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          {m.xpEarned > 0 && <div className="text-xs" style={{ color: "#A78BFA" }}>+{m.xpEarned} XP</div>}
                          {m.eloChange !== 0 && (
                            <div className="text-xs font-medium" style={{ color: m.eloChange > 0 ? "#10B981" : "#EF4444" }}>
                              {m.eloChange > 0 ? "+" : ""}{m.eloChange} ELO
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

          {/* Right sidebar */}
          <div className="space-y-4">
            {/* Profile card */}
            <a href={`/profile/${user.id}`}
              className="block rounded-2xl p-5 transition-all"
              style={{ background: "#0D1526", border: "1px solid rgba(30,58,138,0.4)" }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(30,58,138,0.4)"}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #06B6D4)", boxShadow: "0 0 12px rgba(124,58,237,0.4)" }}>
                  {profile.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-white">{profile.username}</div>
                  <div className="text-xs" style={{ color: rankColor }}>{profile.rank} · Level {profile.level}</div>
                </div>
              </div>
              <div className="text-xs font-medium" style={{ color: "#7C3AED" }}>View & Edit Profile</div>
            </a>

            {/* Quick links */}
            <div className="rounded-2xl p-5"
              style={{ background: "#0D1526", border: "1px solid rgba(30,58,138,0.4)" }}>
              <h3 className="text-sm font-semibold text-white mb-3">Quick Links</h3>
              <div className="space-y-1">
                {[
                  { href: "/missions",     label: "Daily Missions" },
                  { href: "/achievements", label: "Achievements" },
                  { href: "/shop",         label: "Shop" },
                  { href: "/leaderboard",  label: "Leaderboard" },
                  { href: "/tournaments",  label: "Tournaments" },
                  { href: "/friends",      label: "Friends" },
                  { href: "/chat",         label: "Global Chat" },
                ].map((l) => (
                  <a key={l.href} href={l.href}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-all text-sm"
                    style={{ color: "#94A3B8" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#F8FAFC"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <span>{l.label}</span>
                    <span style={{ color: "#475569" }}>›</span>
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
