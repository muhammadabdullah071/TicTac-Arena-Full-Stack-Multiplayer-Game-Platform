"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import GameBoard from "@/components/GameBoard";
import { TicTacToeAI, checkGameState, calculateXP } from "@/lib/gameAI";

export default function PlayAIPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const [difficulty, setDifficulty] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("X");
  const [gameState, setGameState] = useState({
    winner: null,
    winningLine: null,
  });
  const [isThinking, setIsThinking] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const gameOverRef = useRef(false);
  const aiMoveScheduledRef = useRef(false);

  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/account/signin");
    }
  }, [user, userLoading, navigate]);

  useEffect(() => {
    // Check game state after each move
    if (gameOverRef.current) return;

    const state = checkGameState(board);
    setGameState(state);

    if (state.winner) {
      if (!gameOverRef.current) {
        gameOverRef.current = true;
        handleGameEnd(state.winner);
      }
    } else if (currentPlayer === "O" && difficulty && !aiMoveScheduledRef.current) {
      // AI's turn
      aiMoveScheduledRef.current = true;
      const timer = setTimeout(() => {
        makeAIMove();
        aiMoveScheduledRef.current = false;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [board, currentPlayer, difficulty]);

  const selectDifficulty = (level) => {
    setDifficulty(level);
    resetGame();
  };

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setGameState({ winner: null, winningLine: null });
    setShowResult(false);
    setXpEarned(0);
    gameOverRef.current = false;
    aiMoveScheduledRef.current = false;
  };

  const handleCellClick = (index) => {
    if (
      board[index] ||
      gameState.winner ||
      currentPlayer !== "X" ||
      isThinking
    ) {
      return;
    }

    const newBoard = [...board];
    newBoard[index] = "X";
    setBoard(newBoard);
    setCurrentPlayer("O");
  };

  const makeAIMove = async () => {
    setIsThinking(true);

    const ai = new TicTacToeAI(difficulty);
    const aiMove = ai.getBestMove([...board], "O");

    if (aiMove !== null) {
      const newBoard = [...board];
      newBoard[aiMove] = "O";
      setBoard(newBoard);
      setCurrentPlayer("X");
    }

    setIsThinking(false);
  };

  const handleGameEnd = async (winner) => {
    const result = winner === "X" ? "win" : winner === "draw" ? "draw" : "loss";
    const xp = calculateXP(result, "ai", difficulty);
    setXpEarned(xp);
    setShowResult(true);

    // Update profile stats
    if (!user?.id) return;
    try {
      const response = await fetch("/api/matches/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          mode: "ai",
          result,
          xpEarned: xp,
          difficulty,
        }),
      });

      if (!response.ok) {
        console.error("Failed to update match stats");
      }
    } catch (error) {
      console.error("Error updating match:", error);
    }
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
        {/* Difficulty Selection */}
        {!difficulty && (
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-white mb-4">
              Play vs AI
            </h1>
            <p className="text-gray-400 mb-8">Select difficulty level</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl mx-auto">
              <button
                onClick={() => selectDifficulty("easy")}
                className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-6 hover:border-[#22C55E]/30 transition-colors"
              >
                <div className="text-lg font-semibold text-white mb-2">
                  Easy
                </div>
                <div className="text-sm text-gray-400">
                  Perfect for beginners
                </div>
              </button>

              <button
                onClick={() => selectDifficulty("medium")}
                className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-6 hover:border-[#F59E0B]/30 transition-colors"
              >
                <div className="text-lg font-semibold text-white mb-2">
                  Medium
                </div>
                <div className="text-sm text-gray-400">Balanced challenge</div>
              </button>

              <button
                onClick={() => selectDifficulty("hard")}
                className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-6 hover:border-[#EF4444]/30 transition-colors"
              >
                <div className="text-lg font-semibold text-white mb-2">
                  Hard
                </div>
                <div className="text-sm text-gray-400">Tough opponent</div>
              </button>

              <button
                onClick={() => selectDifficulty("impossible")}
                className="bg-gradient-to-br from-[#6D28D9] to-[#5B21B6] rounded-xl p-6"
              >
                <div className="text-lg font-semibold text-white mb-2">
                  Impossible
                </div>
                <div className="text-sm text-white/70">Unbeatable AI</div>
              </button>
            </div>
          </div>
        )}

        {/* Game Area */}
        {difficulty && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-white">
                  Playing vs AI
                </h1>
                <p className="text-gray-400">
                  Difficulty:{" "}
                  <span className="text-white capitalize">{difficulty}</span>
                </p>
              </div>
              <button
                onClick={() => setDifficulty(null)}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Change Difficulty
              </button>
            </div>

            <GameBoard
              board={board}
              onCellClick={handleCellClick}
              winningLine={gameState.winningLine}
              currentPlayer={currentPlayer}
              disabled={isThinking || gameState.winner !== null}
            />

            {isThinking && (
              <div className="text-center mt-6">
                <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                  <div
                    className="w-4 h-4 border-2 border-[#22D3EE] border-t-transparent rounded-full"
                    style={{ animation: "spin 1s linear infinite" }}
                  >
                    <style jsx global>{`
                      @keyframes spin {
                        to { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                  AI is thinking...
                </div>
              </div>
            )}

            {/* Result Modal */}
            {showResult && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-8 max-w-md w-full">
                  <div className="text-center">
                    {gameState.winner === "X" && (
                      <>
                        <div className="text-6xl mb-4">🎉</div>
                        <h2 className="text-3xl font-semibold text-[#22C55E] mb-2">
                          Victory!
                        </h2>
                        <p className="text-gray-400 mb-6">
                          You defeated the AI
                        </p>
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
                    {gameState.winner === "O" && (
                      <>
                        <div className="text-6xl mb-4">😔</div>
                        <h2 className="text-3xl font-semibold text-[#EF4444] mb-2">
                          Defeat
                        </h2>
                        <p className="text-gray-400 mb-6">
                          Better luck next time
                        </p>
                      </>
                    )}

                    <div className="bg-[#1F2937] rounded-lg p-4 mb-6">
                      <div className="text-sm text-gray-400 mb-1">
                        XP Earned
                      </div>
                      <div className="text-2xl font-semibold text-[#6D28D9]">
                        +{xpEarned}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={resetGame}
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
          </>
        )}
      </div>
    </div>
  );
}
