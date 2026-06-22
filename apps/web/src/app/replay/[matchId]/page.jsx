"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";
import GameBoard from "@/components/GameBoard";

const WIN_PATTERNS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board) {
  for (const [a, b, c] of WIN_PATTERNS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] };
    }
  }
  if (board.every((c) => c !== null)) return { winner: "draw", line: [] };
  return { winner: null, line: [] };
}

export default function ReplayPage() {
  const { matchId } = useParams();
  const { data: user } = useUser();

  const [match, setMatch] = useState(null);
  const [moves, setMoves] = useState([]);
  const [currentMoveIdx, setCurrentMoveIdx] = useState(-1);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [winningLine, setWinningLine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1000); // ms per move
  const playRef = useRef(null);

  useEffect(() => {
    if (matchId) fetchReplay();
  }, [matchId]);

  useEffect(() => {
    if (isPlaying) {
      playRef.current = setInterval(() => {
        setCurrentMoveIdx((prev) => {
          if (prev >= moves.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, speed);
    } else {
      clearInterval(playRef.current);
    }
    return () => clearInterval(playRef.current);
  }, [isPlaying, moves.length, speed]);

  useEffect(() => {
    // Reconstruct board from moves up to currentMoveIdx
    const newBoard = Array(9).fill(null);
    for (let i = 0; i <= currentMoveIdx; i++) {
      if (moves[i]) {
        newBoard[moves[i].position] =
          moves[i].symbol || (i % 2 === 0 ? "X" : "O");
      }
    }
    setBoard(newBoard);

    // Check for winner
    const { winner, line } = checkWinner(newBoard);
    setWinningLine(winner && winner !== "draw" ? line : null);
  }, [currentMoveIdx, moves]);

  const fetchReplay = async () => {
    try {
      const res = await fetch(`/api/matches/${matchId}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      setMatch(data.match);

      // Get moves from board_state or fetch separately
      const boardState = data.match?.board_state;
      if (boardState?.moves && boardState.moves.length > 0) {
        // Reconstruct moves with symbols
        const reconstructed = boardState.moves.map((m, i) => ({
          ...m,
          symbol: m.symbol || (i % 2 === 0 ? "X" : "O"),
        }));
        setMoves(reconstructed);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const goToMove = (idx) => {
    setIsPlaying(false);
    setCurrentMoveIdx(idx);
  };

  const togglePlay = () => setIsPlaying((p) => !p);
  const reset = () => {
    setIsPlaying(false);
    setCurrentMoveIdx(-1);
  };
  const goForward = () =>
    setCurrentMoveIdx((p) => Math.min(p + 1, moves.length - 1));
  const goBackward = () => setCurrentMoveIdx((p) => Math.max(p - 1, -1));

  const copyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href).catch(() => {});
    }
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

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎮</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Replay Not Found
          </h2>
          <a
            href="/dashboard"
            className="text-[#6D28D9] hover:text-[#8B5CF6] text-sm"
          >
            ← Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const playerXName = match.player_x_username || "Player X";
  const playerOName = match.player_o_username || "AI";
  const currentSymbol =
    currentMoveIdx >= 0 && moves[currentMoveIdx]
      ? moves[currentMoveIdx].symbol
      : null;

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <a
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-white transition-colors mb-4 inline-block"
          >
            ← Back
          </a>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Match Replay</h1>
              <p className="text-sm text-gray-400 capitalize">
                {match.mode} match ·{" "}
                {new Date(match.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                  match.status === "finished"
                    ? "bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20"
                    : "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
                }`}
              >
                {match.status}
              </span>
              <button
                onClick={copyLink}
                className="text-xs px-3 py-1.5 bg-[#111827] border border-[#E5E7EB]/10 hover:border-[#6D28D9]/30 text-gray-400 hover:text-white rounded-lg transition-colors"
              >
                🔗 Share
              </button>
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="flex items-center justify-between bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {playerXName[0].toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold text-white">{playerXName}</div>
              <div className="text-xs text-[#6D28D9] font-bold">X</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">vs</div>
            {match.is_draw && (
              <div className="text-xs text-[#F59E0B] mt-1">Draw</div>
            )}
            {!match.is_draw && match.winner_id && (
              <div className="text-xs text-[#22C55E] mt-1">
                {match.winner_id === match.player_x_id
                  ? `${playerXName} Wins!`
                  : `${playerOName} Wins!`}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-semibold text-white">{playerOName}</div>
              <div className="text-xs text-[#22D3EE] font-bold text-right">
                O
              </div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-[#22D3EE] to-[#0891B2] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {playerOName[0].toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {moves.length === 0 ? (
          <div className="text-center py-16 bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl">
            <div className="text-5xl mb-3">🎞️</div>
            <p className="text-gray-400">
              No move data available for this match
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Only real-time multiplayer matches have replay data
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr,280px] gap-6">
            {/* Board */}
            <div>
              <div className="mb-4 text-center">
                {currentMoveIdx >= 0 && currentSymbol ? (
                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
                      currentSymbol === "X"
                        ? "bg-[#6D28D9]/10 text-[#6D28D9] border-[#6D28D9]/20"
                        : "bg-[#22D3EE]/10 text-[#22D3EE] border-[#22D3EE]/20"
                    }`}
                  >
                    Move {currentMoveIdx + 1}/{moves.length}:{" "}
                    <strong>{currentSymbol}</strong> at position{" "}
                    {moves[currentMoveIdx]?.position + 1}
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm text-gray-400 border border-[#E5E7EB]/10">
                    Press play to watch the replay
                  </div>
                )}
              </div>

              <GameBoard
                board={board}
                onCellClick={() => {}}
                winningLine={winningLine}
                currentPlayer="X"
                disabled={true}
              />

              {/* Controls */}
              <div className="mt-6 flex flex-col gap-4">
                {/* Timeline */}
                <div>
                  <input
                    type="range"
                    min={-1}
                    max={moves.length - 1}
                    value={currentMoveIdx}
                    onChange={(e) => goToMove(parseInt(e.target.value))}
                    className="w-full accent-[#6D28D9]"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Start</span>
                    <span>
                      Move {currentMoveIdx + 1} / {moves.length}
                    </span>
                    <span>End</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={reset}
                    className="p-2.5 bg-[#111827] hover:bg-[#1F2937] border border-[#E5E7EB]/10 text-gray-400 rounded-xl transition-colors"
                  >
                    ⏮
                  </button>
                  <button
                    onClick={goBackward}
                    className="p-2.5 bg-[#111827] hover:bg-[#1F2937] border border-[#E5E7EB]/10 text-gray-400 rounded-xl transition-colors"
                  >
                    ⏪
                  </button>
                  <button
                    onClick={togglePlay}
                    className="px-8 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-semibold rounded-xl transition-colors"
                  >
                    {isPlaying ? "⏸ Pause" : "▶ Play"}
                  </button>
                  <button
                    onClick={goForward}
                    className="p-2.5 bg-[#111827] hover:bg-[#1F2937] border border-[#E5E7EB]/10 text-gray-400 rounded-xl transition-colors"
                  >
                    ⏩
                  </button>
                  <button
                    onClick={() => goToMove(moves.length - 1)}
                    className="p-2.5 bg-[#111827] hover:bg-[#1F2937] border border-[#E5E7EB]/10 text-gray-400 rounded-xl transition-colors"
                  >
                    ⏭
                  </button>
                </div>

                {/* Speed */}
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xs text-gray-400">Speed:</span>
                  {[
                    { label: "0.5x", val: 2000 },
                    { label: "1x", val: 1000 },
                    { label: "2x", val: 500 },
                    { label: "3x", val: 300 },
                  ].map((s) => (
                    <button
                      key={s.label}
                      onClick={() => setSpeed(s.val)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${speed === s.val ? "bg-[#6D28D9] text-white" : "bg-[#111827] border border-[#E5E7EB]/10 text-gray-400 hover:text-white"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Move List */}
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E5E7EB]/10">
                <h3 className="text-sm font-semibold text-white">
                  Move History
                </h3>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
                {moves.map((move, i) => (
                  <button
                    key={i}
                    onClick={() => goToMove(i)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors ${currentMoveIdx === i ? "bg-[#6D28D9]/10 border-l-2 border-[#6D28D9]" : ""}`}
                  >
                    <div className="text-xs text-gray-500 w-4">{i + 1}</div>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                        move.symbol === "X"
                          ? "bg-[#6D28D9]/20 text-[#6D28D9]"
                          : "bg-[#22D3EE]/20 text-[#22D3EE]"
                      }`}
                    >
                      {move.symbol || (i % 2 === 0 ? "X" : "O")}
                    </div>
                    <div className="text-xs text-gray-300">
                      Position {move.position + 1}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
