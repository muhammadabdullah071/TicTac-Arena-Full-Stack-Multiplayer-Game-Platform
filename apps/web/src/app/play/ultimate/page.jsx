"use client";

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";

// Ultimate Tic-Tac-Toe: 9 boards, each with 9 cells
// activeBoard: null (play anywhere) or index 0-8 (must play on that board)
// The board you play on determines where opponent must play next

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

function checkWinner(cells) {
  for (const [a, b, c] of WIN_PATTERNS) {
    if (cells[a] && cells[a] === cells[b] && cells[a] === cells[c]) {
      return { winner: cells[a], line: [a, b, c] };
    }
  }
  if (cells.every((c) => c !== null)) return { winner: "draw", line: [] };
  return { winner: null, line: [] };
}

function MiniBoard({
  cells,
  winner,
  isActive,
  winLine,
  onCellClick,
  disabled,
}) {
  const bgClass =
    isActive && !winner
      ? "ring-2 ring-[#6D28D9] ring-offset-2 ring-offset-[#0B1120]"
      : "";

  return (
    <div
      className={`relative rounded-lg overflow-hidden p-1 transition-all ${bgClass} ${
        winner === "X"
          ? "bg-[#6D28D9]/20"
          : winner === "O"
            ? "bg-[#22D3EE]/20"
            : winner === "draw"
              ? "bg-gray-800"
              : "bg-[#1F2937]"
      }`}
    >
      {winner && (
        <div className="absolute inset-0 flex items-center justify-center z-10 backdrop-blur-sm">
          <span
            className={`text-4xl font-black ${winner === "X" ? "text-[#6D28D9]" : winner === "O" ? "text-[#22D3EE]" : "text-gray-500"}`}
          >
            {winner === "draw" ? "=" : winner}
          </span>
        </div>
      )}
      <div className="grid grid-cols-3 gap-0.5">
        {cells.map((cell, i) => (
          <button
            key={i}
            onClick={() => onCellClick(i)}
            disabled={disabled || !!winner || !!cell}
            className={`w-full aspect-square flex items-center justify-center text-sm font-bold rounded transition-all ${
              cell === "X"
                ? "text-[#6D28D9] bg-[#6D28D9]/10"
                : cell === "O"
                  ? "text-[#22D3EE] bg-[#22D3EE]/10"
                  : !disabled && !winner && isActive
                    ? "hover:bg-[#6D28D9]/20 cursor-pointer"
                    : "cursor-not-allowed opacity-50"
            } ${winLine?.includes(i) ? "bg-[#22C55E]/20 text-[#22C55E]" : ""}`}
          >
            {cell}
          </button>
        ))}
      </div>
    </div>
  );
}

const initialBoards = () =>
  Array(9)
    .fill(null)
    .map(() => Array(9).fill(null));
const initialMetaBoard = () => Array(9).fill(null);

export default function UltimatePage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [boards, setBoards] = useState(initialBoards());
  const [metaBoard, setMetaBoard] = useState(initialMetaBoard());
  const [boardWinLines, setBoardWinLines] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState("X"); // Player always X, AI is O
  const [activeBoard, setActiveBoard] = useState(null); // null = any board
  const [gameWinner, setGameWinner] = useState(null);
  const [gameWinLine, setGameWinLine] = useState(null);
  const [gameStatus, setGameStatus] = useState("playing"); // playing | finished
  const [difficulty, setDifficulty] = useState("medium");
  const [isThinking, setIsThinking] = useState(false);
  const [profile, setProfile] = useState(null);
  const [moveCount, setMoveCount] = useState(0);
  const [playerXP, setPlayerXP] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [vsMode, setVsMode] = useState("ai"); // ai | local

  useEffect(() => {
    if (!userLoading && !user) navigate("/account/signin");
    else if (user) fetchProfile();
  }, [user, userLoading]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profiles/${user.id}`);
      if (res.ok) {
        const d = await res.json();
        setProfile(d.profile);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCellClick = useCallback(
    (boardIdx, cellIdx) => {
      if (gameStatus !== "playing") return;
      if (currentPlayer !== "X") return;
      if (activeBoard !== null && activeBoard !== boardIdx) return;
      if (metaBoard[boardIdx] !== null) return;
      if (boards[boardIdx][cellIdx] !== null) return;

      makeMove(boardIdx, cellIdx, "X");
    },
    [boards, metaBoard, activeBoard, currentPlayer, gameStatus],
  );

  const makeMove = useCallback(
    (boardIdx, cellIdx, player) => {
      const newBoards = boards.map((b, i) => (i === boardIdx ? [...b] : b));
      newBoards[boardIdx] = [...newBoards[boardIdx]];
      newBoards[boardIdx][cellIdx] = player;

      const newMetaBoard = [...metaBoard];
      const newWinLines = [...boardWinLines];

      // Check if this mini-board is now won
      const { winner, line } = checkWinner(newBoards[boardIdx]);
      if (winner) {
        newMetaBoard[boardIdx] = winner === "draw" ? "draw" : winner;
        newWinLines[boardIdx] = line.length > 0 ? line : null;
      }

      // Check meta-board winner
      const { winner: metaWinner, line: metaLine } = checkWinner(
        newMetaBoard.map((v) => (v === "draw" ? null : v)),
      );

      // Next active board: where this cell points, unless that board is done
      let nextActive = cellIdx;
      if (newMetaBoard[nextActive] !== null) nextActive = null; // Can play anywhere

      const newMoveCount = moveCount + 1;
      setBoards(newBoards);
      setMetaBoard(newMetaBoard);
      setBoardWinLines(newWinLines);
      setActiveBoard(nextActive);
      setMoveCount(newMoveCount);

      if (metaWinner && metaWinner !== "draw") {
        setGameWinner(metaWinner);
        setGameWinLine(metaLine);
        setGameStatus("finished");
        setShowResult(true);
        handleGameEnd(metaWinner === "X" ? "win" : "loss", newMoveCount);
        return;
      }

      if (metaWinner === "draw" || newMetaBoard.every((v) => v !== null)) {
        setGameWinner("draw");
        setGameStatus("finished");
        setShowResult(true);
        handleGameEnd("draw", newMoveCount);
        return;
      }

      const nextPlayer = player === "X" ? "O" : "X";
      setCurrentPlayer(nextPlayer);

      if (vsMode === "ai" && nextPlayer === "O") {
        setTimeout(
          () =>
            makeAIMove(
              newBoards,
              newMetaBoard,
              nextActive,
              newWinLines,
              newMoveCount,
            ),
          600 + Math.random() * 400,
        );
      }
    },
    [
      boards,
      metaBoard,
      boardWinLines,
      activeBoard,
      moveCount,
      vsMode,
      difficulty,
    ],
  );

  const makeAIMove = (
    curBoards,
    curMeta,
    curActiveBoard,
    curWinLines,
    curMoveCount,
  ) => {
    setIsThinking(true);

    // Find valid boards to play on
    const validBoards =
      curActiveBoard !== null && curMeta[curActiveBoard] === null
        ? [curActiveBoard]
        : curMeta
            .map((v, i) => (v === null ? i : null))
            .filter((i) => i !== null);

    if (validBoards.length === 0) {
      setIsThinking(false);
      return;
    }

    let bestBoardIdx, bestCellIdx;

    // Try to win a board, or block, or play strategically
    let found = false;

    for (const bi of validBoards) {
      const available = curBoards[bi]
        .map((c, i) => (c === null ? i : null))
        .filter((i) => i !== null);
      // Try to win
      for (const ci of available) {
        const temp = [...curBoards[bi]];
        temp[ci] = "O";
        const { winner } = checkWinner(temp);
        if (winner === "O") {
          bestBoardIdx = bi;
          bestCellIdx = ci;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (!found) {
      for (const bi of validBoards) {
        const available = curBoards[bi]
          .map((c, i) => (c === null ? i : null))
          .filter((i) => i !== null);
        for (const ci of available) {
          const temp = [...curBoards[bi]];
          temp[ci] = "X";
          const { winner } = checkWinner(temp);
          if (winner === "X") {
            bestBoardIdx = bi;
            bestCellIdx = ci;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    if (!found) {
      // Try center or random
      const priorities = [4, 0, 2, 6, 8, 1, 3, 5, 7];
      for (const bi of validBoards) {
        const available = curBoards[bi]
          .map((c, i) => (c === null ? i : null))
          .filter((i) => i !== null);
        for (const ci of priorities) {
          if (available.includes(ci)) {
            bestBoardIdx = bi;
            bestCellIdx = ci;
            found = true;
            break;
          }
        }
        if (found) break;
      }
    }

    if (!found || bestBoardIdx === undefined) {
      const bi = validBoards[Math.floor(Math.random() * validBoards.length)];
      const available = curBoards[bi]
        .map((c, i) => (c === null ? i : null))
        .filter((i) => i !== null);
      if (available.length > 0) {
        bestBoardIdx = bi;
        bestCellIdx = available[Math.floor(Math.random() * available.length)];
      }
    }

    setIsThinking(false);
    if (bestBoardIdx !== undefined && bestCellIdx !== undefined) {
      makeMove(bestBoardIdx, bestCellIdx, "O");
    }
  };

  const handleGameEnd = async (result, moves) => {
    try {
      const xp = result === "win" ? 75 : result === "draw" ? 30 : 15;
      setPlayerXP(xp);
      await fetch("/api/matches/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          mode: "ultimate",
          result,
          xpEarned: xp,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const resetGame = () => {
    setBoards(initialBoards());
    setMetaBoard(initialMetaBoard());
    setBoardWinLines(Array(9).fill(null));
    setCurrentPlayer("X");
    setActiveBoard(null);
    setGameWinner(null);
    setGameWinLine(null);
    setGameStatus("playing");
    setMoveCount(0);
    setShowResult(false);
    setIsThinking(false);
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6D28D9] border-t-transparent rounded-full animate-spin"></div>
        <style
          jsx
          global
        >{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar active="play" />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-white mb-2">
            Ultimate Tic-Tac-Toe
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Win 3 mini-boards in a row to win the game. Your move determines
            which board your opponent must play on next.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <div className="flex items-center gap-2 bg-[#111827] border border-[#E5E7EB]/10 rounded-lg px-4 py-2">
            <span className="text-xs text-gray-400">Mode:</span>
            {["ai", "local"].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setVsMode(m);
                  resetGame();
                }}
                className={`text-xs px-2 py-1 rounded ${vsMode === m ? "bg-[#6D28D9] text-white" : "text-gray-400 hover:text-white"}`}
              >
                {m === "ai" ? "vs AI" : "Local 2P"}
              </button>
            ))}
          </div>

          {vsMode === "ai" && (
            <div className="flex items-center gap-2 bg-[#111827] border border-[#E5E7EB]/10 rounded-lg px-4 py-2">
              <span className="text-xs text-gray-400">Difficulty:</span>
              {["easy", "medium", "hard"].map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDifficulty(d);
                    resetGame();
                  }}
                  className={`text-xs px-2 py-1 rounded capitalize ${difficulty === d ? "bg-[#6D28D9] text-white" : "text-gray-400 hover:text-white"}`}
                >
                  {d}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={resetGame}
            className="text-xs px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-gray-300 rounded-lg transition-colors"
          >
            Reset Game
          </button>
        </div>

        {/* Status Bar */}
        <div className="text-center mb-6">
          {gameStatus === "playing" && (
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border ${
                isThinking
                  ? "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/20"
                  : currentPlayer === "X"
                    ? "bg-[#6D28D9]/10 text-[#6D28D9] border-[#6D28D9]/20"
                    : "bg-[#22D3EE]/10 text-[#22D3EE] border-[#22D3EE]/20"
              }`}
            >
              {isThinking
                ? "🤔 AI is thinking..."
                : currentPlayer === "X"
                  ? `▶ Your turn (X)${activeBoard !== null ? ` — Board ${activeBoard + 1}` : " — Any board"}`
                  : `▶ ${vsMode === "ai" ? "AI" : "Player O"}\'s turn${activeBoard !== null ? ` — Board ${activeBoard + 1}` : " — Any board"}`}
            </div>
          )}
        </div>

        {/* Meta Board */}
        <div className="flex justify-center mb-8">
          <div
            className="grid grid-cols-3 gap-2 p-3 bg-[#0B1120] rounded-2xl border border-[#E5E7EB]/10"
            style={{ maxWidth: "540px", width: "100%" }}
          >
            {boards.map((boardCells, bi) => (
              <MiniBoard
                key={bi}
                cells={boardCells}
                winner={metaBoard[bi]}
                isActive={
                  gameStatus === "playing" &&
                  (activeBoard === null || activeBoard === bi) &&
                  metaBoard[bi] === null
                }
                winLine={boardWinLines[bi]}
                onCellClick={(ci) => handleCellClick(bi, ci)}
                disabled={
                  gameStatus !== "playing" ||
                  isThinking ||
                  (currentPlayer === "O" && vsMode === "ai") ||
                  (activeBoard !== null && activeBoard !== bi) ||
                  metaBoard[bi] !== null
                }
              />
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#6D28D9]/20 rounded ring-2 ring-[#6D28D9]"></div>
            <span>Active Board</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#6D28D9] font-bold">X</span> = You
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#22D3EE] font-bold">O</span> ={" "}
            {vsMode === "ai" ? "AI" : "Player 2"}
          </div>
        </div>

        {/* Result Modal */}
        {showResult && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-8 max-w-sm w-full text-center">
              {gameWinner === "X" && (
                <>
                  <div className="text-6xl mb-3">🏆</div>
                  <h2 className="text-2xl font-bold text-[#22C55E] mb-2">
                    You Win!
                  </h2>
                </>
              )}
              {gameWinner === "O" && (
                <>
                  <div className="text-6xl mb-3">😔</div>
                  <h2 className="text-2xl font-bold text-[#EF4444] mb-2">
                    You Lose
                  </h2>
                </>
              )}
              {gameWinner === "draw" && (
                <>
                  <div className="text-6xl mb-3">🤝</div>
                  <h2 className="text-2xl font-bold text-[#F59E0B] mb-2">
                    Draw!
                  </h2>
                </>
              )}

              <p className="text-gray-400 mb-4">Total moves: {moveCount}</p>

              {vsMode === "ai" && playerXP > 0 && (
                <div className="bg-[#1F2937] rounded-xl p-3 mb-6">
                  <div className="text-xs text-gray-400 mb-1">XP Earned</div>
                  <div className="text-xl font-bold text-[#8B5CF6]">
                    +{playerXP}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={resetGame}
                  className="flex-1 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-semibold py-3 rounded-xl"
                >
                  Play Again
                </button>
                <a
                  href="/dashboard"
                  className="flex-1 bg-[#1F2937] hover:bg-[#374151] text-white font-semibold py-3 rounded-xl text-center"
                >
                  Dashboard
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
