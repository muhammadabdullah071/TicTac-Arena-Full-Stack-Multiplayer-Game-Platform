"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import GameBoard from "@/components/GameBoard";
import { checkGameState, calculateXP, calculateELO } from "@/lib/gameAI";

export default function RankedPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const [searching, setSearching] = useState(false);
  const [matchFound, setMatchFound] = useState(false);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [playerSymbol, setPlayerSymbol] = useState("X");
  const [gameState, setGameState] = useState({
    winner: null,
    winningLine: null,
  });
  const [showResult, setShowResult] = useState(false);
  const [profile, setProfile] = useState(null);
  const [opponentProfile, setOpponentProfile] = useState(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [eloChange, setEloChange] = useState(0);

  const gameOverRef = useRef(false);

  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/account/signin");
    } else if (user) {
      fetchProfile();
    }
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (gameOverRef.current) return;

    const state = checkGameState(board);
    setGameState(state);

    if (state.winner) {
      if (!gameOverRef.current) {
        gameOverRef.current = true;
        handleGameEnd(state.winner);
      }
    }
  }, [board]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profiles/${user.id}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const startMatchmaking = () => {
    setSearching(true);

    // Simulate finding a match (in reality this would use WebSockets/polling)
    setTimeout(() => {
      setSearching(false);
      setMatchFound(true);

      // Simulate opponent with similar ELO
      const eloVariation = Math.floor(Math.random() * 200) - 100;
      setOpponentProfile({
        username: `Player${Math.floor(Math.random() * 10000)}`,
        elo: (profile?.elo || 1000) + eloVariation,
        rank: profile?.rank || "Bronze",
      });

      // Randomly assign X or O
      const symbol = Math.random() < 0.5 ? "X" : "O";
      setPlayerSymbol(symbol);
      setCurrentPlayer("X");
    }, 2000);
  };

  const handleCellClick = (index) => {
    if (board[index] || gameState.winner || currentPlayer !== playerSymbol) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = playerSymbol;
    setBoard(newBoard);

    const nextPlayer = playerSymbol === "X" ? "O" : "X";
    setCurrentPlayer(nextPlayer);

    // Simulate opponent move after a delay
    if (nextPlayer !== playerSymbol) {
      setTimeout(() => makeOpponentMove(newBoard), 800);
    }
  };

  const makeOpponentMove = (currentBoard) => {
    // Find available positions
    const availableMoves = currentBoard
      .map((cell, index) => (cell === null ? index : null))
      .filter((index) => index !== null);

    if (availableMoves.length > 0) {
      const opponentSymbol = playerSymbol === "X" ? "O" : "X";
      const randomIndex =
        availableMoves[Math.floor(Math.random() * availableMoves.length)];

      const newBoard = [...currentBoard];
      newBoard[randomIndex] = opponentSymbol;
      setBoard(newBoard);
      setCurrentPlayer(playerSymbol);
    }
  };

  const handleGameEnd = async (winner) => {
    const isPlayerWin =
      (winner === "X" && playerSymbol === "X") ||
      (winner === "O" && playerSymbol === "O");

    const result = isPlayerWin ? "win" : winner === "draw" ? "draw" : "loss";
    const xp = calculateXP(result, "ranked");
    const elo = calculateELO(
      profile?.elo || 1000,
      opponentProfile?.elo || 1000,
      result,
    );

    setXpEarned(xp);
    setEloChange(elo);
    setShowResult(true);

    // Update profile
    if (!user?.id) return;
    try {
      await fetch("/api/matches/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          mode: "ranked",
          result,
          xpEarned: xp,
          eloChange: elo,
        }),
      });
    } catch (error) {
      console.error("Error updating match:", error);
    }
  };

  const playAgain = () => {
    setMatchFound(false);
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setGameState({ winner: null, winningLine: null });
    setShowResult(false);
    setXpEarned(0);
    setEloChange(0);
    gameOverRef.current = false;
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div
          className="inline-block w-12 h-12 border-4 border-[#6D28D9] border-t-transparent rounded-full"
          style={{ animation: "spin 1s linear infinite" }}
        >
          <style jsx global>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* Navigation */}
      <nav className="border-b border-[#E5E7EB]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-lg"></div>
              <span className="text-xl font-semibold text-white">
                TicTac Arena
              </span>
            </a>
            <a
              href="/dashboard"
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!matchFound ? (
          <div className="text-center max-w-md mx-auto">
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-8 mb-6">
              <h1 className="text-2xl font-semibold text-white mb-2">
                Ranked Match
              </h1>
              <p className="text-gray-400 mb-6">
                Compete for ELO and climb the ranks
              </p>

              <div className="bg-[#1F2937] rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-400">Your Rank</span>
                  <span className="text-lg font-semibold text-white">
                    {profile.rank}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Your ELO</span>
                  <span className="text-lg font-semibold text-white">
                    {profile.elo}
                  </span>
                </div>
              </div>

              {searching ? (
                <div className="py-8">
                  <div
                    className="inline-block w-16 h-16 border-4 border-[#6D28D9] border-t-transparent rounded-full mb-4"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <style jsx global>{`
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                  <p className="text-white font-medium">Finding opponent...</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Matching by ELO rating
                  </p>
                </div>
              ) : (
                <button
                  onClick={startMatchmaking}
                  className="w-full bg-gradient-to-r from-[#6D28D9] to-[#5B21B6] hover:opacity-90 text-white font-semibold py-4 px-6 rounded-lg transition-opacity"
                >
                  Find Match
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr,2fr,1fr] gap-6">
            {/* Player Info */}
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-6 h-fit">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-white">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {profile.username}
                </div>
                <div className="text-sm text-gray-400">{profile.rank}</div>
              </div>
              <div className="bg-[#1F2937] rounded-lg p-3 mb-2">
                <div className="text-xs text-gray-400 mb-1">ELO</div>
                <div className="text-lg font-semibold text-white">
                  {profile.elo}
                </div>
              </div>
              <div className="bg-[#1F2937] rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Playing</div>
                <div className="text-lg font-semibold text-[#6D28D9]">
                  {playerSymbol}
                </div>
              </div>
            </div>

            {/* Game Board */}
            <div>
              <GameBoard
                board={board}
                onCellClick={handleCellClick}
                winningLine={gameState.winningLine}
                currentPlayer={currentPlayer}
                disabled={
                  gameState.winner !== null || currentPlayer !== playerSymbol
                }
              />
            </div>

            {/* Opponent Info */}
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-6 h-fit">
              <div className="text-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-[#22D3EE] to-[#0891B2] rounded-full mx-auto mb-3 flex items-center justify-center">
                  <span className="text-2xl font-semibold text-white">
                    {opponentProfile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="text-lg font-semibold text-white">
                  {opponentProfile.username}
                </div>
                <div className="text-sm text-gray-400">
                  {opponentProfile.rank}
                </div>
              </div>
              <div className="bg-[#1F2937] rounded-lg p-3 mb-2">
                <div className="text-xs text-gray-400 mb-1">ELO</div>
                <div className="text-lg font-semibold text-white">
                  {opponentProfile.elo}
                </div>
              </div>
              <div className="bg-[#1F2937] rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Playing</div>
                <div className="text-lg font-semibold text-[#22D3EE]">
                  {playerSymbol === "X" ? "O" : "X"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Result Modal */}
        {showResult && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-8 max-w-md w-full">
              <div className="text-center">
                {((gameState.winner === "X" && playerSymbol === "X") ||
                  (gameState.winner === "O" && playerSymbol === "O")) && (
                  <>
                    <div className="text-6xl mb-4">🎉</div>
                    <h2 className="text-3xl font-semibold text-[#22C55E] mb-2">
                      Victory!
                    </h2>
                    <p className="text-gray-400 mb-6">You won the match</p>
                  </>
                )}
                {gameState.winner === "draw" && (
                  <>
                    <div className="text-6xl mb-4">🤝</div>
                    <h2 className="text-3xl font-semibold text-[#F59E0B] mb-2">
                      Draw
                    </h2>
                    <p className="text-gray-400 mb-6">Well played!</p>
                  </>
                )}
                {((gameState.winner === "X" && playerSymbol === "O") ||
                  (gameState.winner === "O" && playerSymbol === "X")) && (
                  <>
                    <div className="text-6xl mb-4">😔</div>
                    <h2 className="text-3xl font-semibold text-[#EF4444] mb-2">
                      Defeat
                    </h2>
                    <p className="text-gray-400 mb-6">Better luck next time</p>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-[#1F2937] rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">XP Earned</div>
                    <div className="text-xl font-semibold text-[#6D28D9]">
                      +{xpEarned}
                    </div>
                  </div>
                  <div className="bg-[#1F2937] rounded-lg p-4">
                    <div className="text-xs text-gray-400 mb-1">ELO Change</div>
                    <div
                      className={`text-xl font-semibold ${eloChange >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}
                    >
                      {eloChange >= 0 ? "+" : ""}
                      {eloChange}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={playAgain}
                    className="flex-1 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Play Again
                  </button>
                  <a
                    href="/dashboard"
                    className="flex-1 bg-[#1F2937] hover:bg-[#374151] text-white font-medium py-3 px-4 rounded-lg transition-colors text-center"
                  >
                    Dashboard
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
