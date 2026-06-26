"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import GameBoard from "@/components/GameBoard";
import { checkGameState, calculateXP } from "@/lib/gameAI";

export default function CasualPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [playerSymbol, setPlayerSymbol] = useState("X");
  const [gameState, setGameState] = useState({
    winner: null,
    winningLine: null,
  });
  const [showResult, setShowResult] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const gameOverRef = useRef(false);
  const opponentThinkingRef = useRef(false);

  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/account/signin");
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
    } else if (currentPlayer !== playerSymbol && !opponentThinkingRef.current) {
      // Simulate opponent move - capture board snapshot for closure
      const boardSnapshot = [...board];
      opponentThinkingRef.current = true;
      const timer = setTimeout(() => {
        makeOpponentMove(boardSnapshot);
        opponentThinkingRef.current = false;
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [board, currentPlayer, playerSymbol]);

  const handleCellClick = (index) => {
    if (board[index] || gameState.winner || currentPlayer !== playerSymbol) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = playerSymbol;
    setBoard(newBoard);

    const nextPlayer = playerSymbol === "X" ? "O" : "X";
    setCurrentPlayer(nextPlayer);
  };

  const makeOpponentMove = (currentBoard) => {
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
    const xp = calculateXP(result, "casual");

    setXpEarned(xp);
    setShowResult(true);

    // Update profile
    if (!user?.id) return;
    try {
      await fetch("/api/matches/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          mode: "casual",
          result,
          xpEarned: xp,
        }),
      });
    } catch (error) {
      console.error("Error updating match:", error);
    }
  };

  const playAgain = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setGameState({ winner: null, winningLine: null });
    setShowResult(false);
    setXpEarned(0);
    gameOverRef.current = false;
    opponentThinkingRef.current = false;

    // Randomly assign X or O for variety
    const symbol = Math.random() < 0.5 ? "X" : "O";
    setPlayerSymbol(symbol);
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Casual Match
          </h1>
          <p className="text-gray-400">Play for fun, no ELO on the line</p>
        </div>

        <GameBoard
          board={board}
          onCellClick={handleCellClick}
          winningLine={gameState.winningLine}
          currentPlayer={currentPlayer}
          disabled={gameState.winner !== null}
        />

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
                    <p className="text-gray-400 mb-6">Nice game!</p>
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
                    <p className="text-gray-400 mb-6">Try again!</p>
                  </>
                )}

                <div className="bg-[#1F2937] rounded-lg p-4 mb-6">
                  <div className="text-sm text-gray-400 mb-1">XP Earned</div>
                  <div className="text-2xl font-semibold text-[#6D28D9]">
                    +{xpEarned}
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
