"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";

export default function TournamentsPage() {
  const { data: user, loading: userLoading } = useUser();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    prizePool: 0,
    maxPlayers: 8,
    startTime: "",
  });
  const [creating, setCreating] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userLoading && !user) navigate("/account/signin");
    else if (user) fetchTournaments();
  }, [user, userLoading, navigate]);

  const fetchTournaments = async () => {
    try {
      const res = await fetch("/api/tournaments");
      if (res.ok) {
        const data = await res.json();
        setTournaments(data.tournaments || []);
      }
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournamentId) => {
    setJoiningId(tournamentId);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
      fetchTournaments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setJoiningId(null);
    }
  };

  const leaveTournament = async (tournamentId) => {
    setLeavingId(tournamentId);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
      fetchTournaments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLeavingId(null);
    }
  };

  const createTournament = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          startTime: createForm.startTime,
          prizePool: parseInt(createForm.prizePool) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create tournament");
      setSuccess("Tournament created!");
      setShowCreate(false);
      fetchTournaments();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setCreating(false);
    }
  };

  const getStatusColor = (status) => {
    if (status === "upcoming")
      return "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20";
    if (status === "ongoing")
      return "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20";
    return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  };

  const formatDate = (ts) => (ts ? new Date(ts).toLocaleString() : "");

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

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar active="tournaments" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-white">Tournaments</h1>
            <p className="text-gray-400 text-sm mt-1">
              Compete for glory, prizes, and champion status
            </p>
          </div>
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="flex items-center gap-2 bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <span>+</span> Create Tournament
          </button>
        </div>

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

        {/* Create Tournament Form */}
        {showCreate && (
          <div className="bg-[#111827] border border-[#6D28D9]/30 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              Create New Tournament
            </h2>
            <form
              onSubmit={createTournament}
              className="grid sm:grid-cols-2 gap-4"
            >
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Tournament Name
                </label>
                <input
                  required
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, name: e.target.value })
                  }
                  placeholder="e.g. Weekly Championship"
                  className="w-full bg-[#1F2937] border border-[#E5E7EB]/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Start Time
                </label>
                <input
                  required
                  type="datetime-local"
                  value={createForm.startTime}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, startTime: e.target.value })
                  }
                  className="w-full bg-[#1F2937] border border-[#E5E7EB]/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">
                  Prize Pool (coins)
                </label>
                <input
                  type="number"
                  min="0"
                  value={createForm.prizePool}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, prizePool: e.target.value })
                  }
                  placeholder="0"
                  className="w-full bg-[#1F2937] border border-[#E5E7EB]/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                />
              </div>
              <div className="flex items-end gap-3">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors"
                >
                  {creating ? "Creating..." : "Create Tournament"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="px-4 py-2.5 bg-[#1F2937] hover:bg-[#374151] text-gray-300 rounded-xl text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tournament Grid */}
        {tournaments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tournaments.map((t) => {
              const isJoined = false; // Would need user participant check
              return (
                <div
                  key={t.id}
                  className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-6 hover:border-[#6D28D9]/20 transition-colors flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-white">
                      {t.name}
                    </h3>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(t.status)}`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-5 flex-1">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>🕐</span>
                      <span>{formatDate(t.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>👥</span>
                      <span>
                        {t.participant_count || 0} / {t.max_players || 8}{" "}
                        players
                      </span>
                    </div>
                    {t.prize_pool > 0 && (
                      <div className="flex items-center gap-2 text-xs text-[#F59E0B]">
                        <span>🪙</span>
                        <span>
                          {parseInt(t.prize_pool).toLocaleString()} coins prize
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress bar for registration */}
                  <div className="mb-4">
                    <div className="w-full bg-[#1F2937] rounded-full h-1.5">
                      <div
                        className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(((t.participant_count || 0) / (t.max_players || 8)) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`/tournaments/${t.id}`}
                      className="flex-1 text-center bg-[#1F2937] hover:bg-[#374151] text-gray-300 font-medium py-2.5 px-3 rounded-xl text-xs transition-colors"
                    >
                      View Details
                    </a>
                    {t.status === "upcoming" && (
                      <button
                        onClick={() => joinTournament(t.id)}
                        disabled={
                          joiningId === t.id ||
                          (t.participant_count || 0) >= (t.max_players || 8)
                        }
                        className="flex-1 bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-50 text-white font-medium py-2.5 px-3 rounded-xl text-xs transition-colors"
                      >
                        {joiningId === t.id
                          ? "Joining..."
                          : (t.participant_count || 0) >= (t.max_players || 8)
                            ? "Full"
                            : "Join"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Hardcoded sample tournaments when DB is empty */
          <div>
            {/* Featured Banner */}
            <div className="bg-gradient-to-br from-[#6D28D9] via-[#7C3AED] to-[#5B21B6] rounded-2xl p-8 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-3">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    <span className="text-xs font-medium text-white">
                      Featured · Registration Open
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Weekly Grand Championship
                  </h2>
                  <p className="text-white/70 mb-4">
                    The biggest tournament of the week. Top 8 players advance to
                    finals.
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm text-white/70">
                    <span>🕐 Starts in 2 days</span>
                    <span>👥 64 players max</span>
                    <span>🪙 10,000 coins prize</span>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setError("Create a tournament first to register!")
                  }
                  className="bg-white hover:bg-gray-100 text-[#6D28D9] font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap"
                >
                  Register Now
                </button>
              </div>
            </div>

            {/* Sample cards */}
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  name: "Bronze League",
                  status: "upcoming",
                  time: "Tomorrow 6PM",
                  players: "24/32",
                  prize: 1000,
                },
                {
                  name: "Silver Cup",
                  status: "ongoing",
                  time: "Live Now",
                  players: "16/16",
                  prize: 2500,
                },
                {
                  name: "Gold Masters",
                  status: "upcoming",
                  time: "In 3 days",
                  players: "6/8",
                  prize: 5000,
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-6 flex flex-col hover:border-[#6D28D9]/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-semibold text-white">
                      {t.name}
                    </h3>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(t.status)}`}
                    >
                      {t.status}
                    </span>
                  </div>
                  <div className="space-y-2 mb-5 flex-1 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>🕐</span>
                      <span>{t.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>👥</span>
                      <span>{t.players} players</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#F59E0B]">
                      <span>🪙</span>
                      <span>{t.prize.toLocaleString()} coins prize</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="w-full bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-medium py-2.5 rounded-xl text-xs transition-colors"
                  >
                    {t.status === "ongoing" ? "View Bracket" : "Register"}
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-8 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <p className="text-white font-semibold mb-1">
                Create the First Real Tournament
              </p>
              <p className="text-sm text-gray-400 mb-4">
                Use the "Create Tournament" button to start one right now
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 bg-[#6D28D9] hover:bg-[#5B21B6] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                + Create Tournament
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
