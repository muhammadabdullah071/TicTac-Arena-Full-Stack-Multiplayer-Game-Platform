"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";

const RANK_COLORS = {
  Bronze: "text-[#CD7F32]",
  Silver: "text-[#C0C0C0]",
  Gold: "text-[#FFD700]",
  Platinum: "text-[#A0B2C6]",
  Diamond: "text-[#B9F2FF]",
  Master: "text-[#9370DB]",
  Legend: "text-[#FF6B6B]",
};

export default function TournamentDetailPage() {
  const { tournamentId } = useParams();
  const { data: user } = useUser();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    if (tournamentId) fetchTournament();
  }, [tournamentId]);

  useEffect(() => {
    if (user && participants.length > 0) {
      setIsParticipant(participants.some((p) => p.user_id === user.id));
    }
  }, [user, participants]);

  const fetchTournament = async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (!res.ok) {
        navigate("/tournaments");
        return;
      }
      const data = await res.json();
      setTournament(data.tournament);
      setParticipants(data.participants || []);
      setMatches(data.matches || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async () => {
    setJoining(true);
    setError(null);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: "POST",
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSuccess(d.message);
      fetchTournament();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setJoining(false);
    }
  };

  const leaveTournament = async () => {
    setLeaving(true);
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/join`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSuccess(d.message);
      fetchTournament();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setLeaving(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      upcoming: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20",
      ongoing: "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20",
      completed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };
    return map[status] || map.completed;
  };

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

  if (!tournament) return null;

  const isFull = participants.length >= (tournament.max_players || 8);

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar active="tournaments" />

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

        {/* Back */}
        <a
          href="/tournaments"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          ← All Tournaments
        </a>

        {/* Header */}
        <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-8 mb-6">
          <div className="flex flex-col md:flex-row items-start justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h1 className="text-2xl font-bold text-white">
                  {tournament.name}
                </h1>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${getStatusBadge(tournament.status)}`}
                >
                  {tournament.status}
                </span>
              </div>
              {tournament.description && (
                <p className="text-gray-400 text-sm mb-4">
                  {tournament.description}
                </p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#1F2937] rounded-xl p-3.5 text-center">
                  <div className="text-xs text-gray-400 mb-1">Players</div>
                  <div className="text-lg font-bold text-white">
                    {participants.length} / {tournament.max_players || 8}
                  </div>
                </div>
                <div className="bg-[#1F2937] rounded-xl p-3.5 text-center">
                  <div className="text-xs text-gray-400 mb-1">Prize Pool</div>
                  <div className="text-lg font-bold text-[#F59E0B]">
                    🪙 {(tournament.prize_pool || 0).toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#1F2937] rounded-xl p-3.5 text-center">
                  <div className="text-xs text-gray-400 mb-1">Start Time</div>
                  <div className="text-sm font-semibold text-white">
                    {tournament.start_time
                      ? new Date(tournament.start_time).toLocaleDateString()
                      : "TBD"}
                  </div>
                </div>
                <div className="bg-[#1F2937] rounded-xl p-3.5 text-center">
                  <div className="text-xs text-gray-400 mb-1">Round</div>
                  <div className="text-lg font-bold text-white">
                    {tournament.current_round || 0}
                  </div>
                </div>
              </div>
            </div>

            {user && tournament.status === "upcoming" && (
              <div className="shrink-0">
                {isParticipant ? (
                  <button
                    onClick={leaveTournament}
                    disabled={leaving}
                    className="px-6 py-3 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] font-semibold rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {leaving ? "Leaving..." : "Leave Tournament"}
                  </button>
                ) : (
                  <button
                    onClick={joinTournament}
                    disabled={joining || isFull}
                    className="px-6 py-3 bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
                  >
                    {joining
                      ? "Joining..."
                      : isFull
                        ? "Tournament Full"
                        : "Join Tournament"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Registration Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Registration</span>
              <span>
                {participants.length} / {tournament.max_players || 8} players
              </span>
            </div>
            <div className="w-full bg-[#1F2937] rounded-full h-2">
              <div
                className="bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((participants.length / (tournament.max_players || 8)) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Participants */}
          <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Participants ({participants.length})
            </h2>
            {participants.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-sm text-gray-400">No participants yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <div
                    key={p.user_id}
                    className={`flex items-center gap-3 p-3 rounded-xl ${user?.id === p.user_id ? "bg-[#6D28D9]/10 border border-[#6D28D9]/20" : "hover:bg-[#1F2937]"} transition-colors`}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center shrink-0">
                      <span className="text-white text-xs font-bold">
                        {p.username[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">
                        {p.username}
                        {user?.id === p.user_id && (
                          <span className="ml-1 text-[10px] text-[#6D28D9]">
                            (you)
                          </span>
                        )}
                      </div>
                      <div
                        className={`text-xs ${RANK_COLORS[p.rank] || "text-gray-400"}`}
                      >
                        {p.rank} · {p.elo} ELO
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-400">Score</div>
                      <div className="text-sm font-bold text-white">
                        {p.score || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Matches */}
          <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Matches ({matches.length})
            </h2>
            {matches.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">⚔️</div>
                <p className="text-sm text-gray-400">
                  {tournament.status === "upcoming"
                    ? "Matches will begin when tournament starts"
                    : "No matches yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {matches.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 bg-[#1F2937] rounded-xl text-xs"
                  >
                    <div className="flex-1 text-white">
                      {m.player_x_username || "TBD"}
                    </div>
                    <div
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${m.status === "finished" ? "bg-[#22C55E]/20 text-[#22C55E]" : "bg-[#F59E0B]/20 text-[#F59E0B]"}`}
                    >
                      vs
                    </div>
                    <div className="flex-1 text-right text-white">
                      {m.player_o_username || "TBD"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
