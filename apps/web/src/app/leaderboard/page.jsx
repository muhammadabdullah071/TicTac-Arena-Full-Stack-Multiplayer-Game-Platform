"use client";

import { useState, useEffect } from "react";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";

export default function LeaderboardPage() {
  const { data: user } = useUser();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("global");

  useEffect(() => {
    fetchLeaderboard();
  }, [activeTab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leaderboard?type=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank) => {
    const colors = {
      Bronze: "text-[#CD7F32]",
      Silver: "text-[#C0C0C0]",
      Gold: "text-[#FFD700]",
      Platinum: "text-[#E5E4E2]",
      Diamond: "text-[#B9F2FF]",
      Master: "text-[#9370DB]",
      Legend: "text-[#FF6B6B]",
    };
    return colors[rank] || "text-gray-400";
  };

  const getRankBadge = (rank) => {
    const badges = {
      Bronze: "🟤",
      Silver: "⚪",
      Gold: "🟡",
      Platinum: "🔵",
      Diamond: "💎",
      Master: "🟣",
      Legend: "🔴",
    };
    return badges[rank] || "";
  };

  const getRankIcon = (index) => {
    if (index === 0) return "🥇";
    if (index === 1) return "🥈";
    if (index === 2) return "🥉";
    return `#${index + 1}`;
  };

  const spinStyle = { animation: "spin 1s linear infinite" };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar active="leaderboard" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">
            Leaderboard
          </h1>
          <p className="text-gray-400">
            Top players worldwide ranked by ELO and performance
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-1 mb-6">
          {[
            { id: "global", label: "🌍 Global" },
            { id: "weekly", label: "📅 Weekly Streak" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[#6D28D9] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top 3 Podium */}
        {!loading && leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[leaderboard[1], leaderboard[0], leaderboard[2]].map(
              (player, i) => {
                const actualRank = i === 1 ? 1 : i === 0 ? 2 : 3;
                const podiumColors = [
                  "bg-[#C0C0C0]/10 border-[#C0C0C0]/20",
                  "bg-[#FFD700]/10 border-[#FFD700]/20",
                  "bg-[#CD7F32]/10 border-[#CD7F32]/20",
                ];
                const heights = ["h-24", "h-32", "h-24"];
                if (!player) return <div key={i}></div>;
                return (
                  <a
                    key={player.id}
                    href={`/profile/${player.id}`}
                    className={`${podiumColors[i]} border rounded-2xl p-4 text-center hover:scale-105 transition-transform ${heights[i]} flex flex-col items-center justify-center`}
                  >
                    <div className="text-2xl mb-1">
                      {i === 1 ? "🥇" : i === 0 ? "🥈" : "🥉"}
                    </div>
                    <div className="text-sm font-semibold text-white truncate max-w-full">
                      {player.username}
                    </div>
                    <div className={`text-xs ${getRankColor(player.rank)}`}>
                      {player.elo} ELO
                    </div>
                  </a>
                );
              },
            )}
          </div>
        )}

        {/* Full Leaderboard */}
        <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div
                className="inline-block w-8 h-8 border-4 border-[#6D28D9] border-t-transparent rounded-full mx-auto mb-4"
                style={spinStyle}
              ></div>
              <style
                jsx
                global
              >{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <p className="text-gray-400">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-gray-400">No players yet. Be the first!</p>
              <a
                href="/account/signup"
                className="inline-block mt-4 text-sm text-[#6D28D9] hover:underline"
              >
                Create an account →
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[#E5E7EB]/10">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-400 px-5 py-4">
                      #
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 px-5 py-4">
                      Player
                    </th>
                    <th className="text-left text-xs font-medium text-gray-400 px-5 py-4">
                      Rank
                    </th>
                    <th className="text-right text-xs font-medium text-gray-400 px-5 py-4">
                      ELO
                    </th>
                    <th className="text-right text-xs font-medium text-gray-400 px-5 py-4 hidden sm:table-cell">
                      Win Rate
                    </th>
                    <th className="text-right text-xs font-medium text-gray-400 px-5 py-4 hidden md:table-cell">
                      W/L
                    </th>
                    <th className="text-right text-xs font-medium text-gray-400 px-5 py-4 hidden sm:table-cell">
                      Streak
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]/5">
                  {leaderboard.map((player, index) => (
                    <tr
                      key={player.id}
                      className={`transition-colors hover:bg-white/2 ${
                        user?.id === player.id ? "bg-[#6D28D9]/10" : ""
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span className="text-base font-bold">
                          {getRankIcon(index)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <a
                          href={`/profile/${player.id}`}
                          className="flex items-center gap-3 group"
                        >
                          <div className="w-9 h-9 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white text-sm font-bold">
                              {player.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-white group-hover:text-[#8B5CF6] transition-colors">
                              {player.username}
                            </div>
                            {user?.id === player.id && (
                              <div className="text-[10px] text-[#6D28D9]">
                                You
                              </div>
                            )}
                          </div>
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-sm font-semibold ${getRankColor(player.rank)}`}
                        >
                          {getRankBadge(player.rank)} {player.rank}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-bold text-white">
                          {player.elo}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden sm:table-cell">
                        <span className="text-sm font-medium text-white">
                          {player.win_rate}%
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden md:table-cell">
                        <span className="text-xs">
                          <span className="text-[#22C55E]">
                            {player.total_wins}W
                          </span>
                          <span className="text-gray-500"> / </span>
                          <span className="text-[#EF4444]">
                            {player.total_losses}L
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right hidden sm:table-cell">
                        {player.win_streak > 0 ? (
                          <span className="text-sm font-medium text-[#F59E0B]">
                            🔥 {player.win_streak}
                          </span>
                        ) : (
                          <span className="text-gray-600 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
