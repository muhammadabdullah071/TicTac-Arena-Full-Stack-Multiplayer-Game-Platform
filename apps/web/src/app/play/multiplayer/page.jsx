"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";
import GameBoard from "@/components/GameBoard";
import { useSocket } from "@/lib/useSocket";

export default function MultiplayerPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();
  const [authToken, setAuthToken] = useState(null);

  const [mode, setMode] = useState("ranked");
  const [phase, setPhase] = useState("lobby"); // lobby | searching | matched | playing | finished
  const [matchId, setMatchId] = useState(null);
  const [playerSymbol, setPlayerSymbol] = useState(null);
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentTurnId, setCurrentTurnId] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [xpEarned, setXpEarned] = useState(0);
  const [eloChange, setEloChange] = useState(0);
  const [profile, setProfile] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [error, setError] = useState(null);
  const [winningLine, setWinningLine] = useState(null);
  const [sendingMove, setSendingMove] = useState(false);
  const [opponentTyping, setOpponentTyping] = useState(false);

  const fetchingRef = useRef(false);
  const chatBottomRef = useRef(null);

  const { connected, reconnecting, emit, emitWithAck, on } = useSocket(authToken);

  // Fetch auth token and profile on mount
  useEffect(() => {
    if (!userLoading && !user) {
      navigate("/account/signin");
      return;
    }
    if (!user) return;
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    (async () => {
      try {
        const [tokenRes, profileRes] = await Promise.all([
          fetch("/api/auth/token"),
          fetch(`/api/profiles/${user.id}`),
        ]);
        if (tokenRes.ok) {
          const { jwt } = await tokenRes.json();
          setAuthToken(jwt);
        }
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data.profile);
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user, userLoading, navigate]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Socket event listeners
  useEffect(() => {
    if (!connected) return;

    const unsubMatchFound = on("match:found", (data) => {
      setError(null);
      setMatchId(data.matchId);
      setPlayerSymbol(data.playerSymbol);
      if (data.opponent) setOpponent(data.opponent);
      setPhase("matched");
      setTimeout(() => setPhase("playing"), 2000);
    });

    const unsubMatchStart = on("match:start", (data) => {
      setBoard(data.boardState?.board || Array(9).fill(null));
      setCurrentTurnId(data.currentTurnId);
      setPhase("playing");
    });

    const unsubMoveAccepted = on("move:accepted", (data) => {
      setBoard(data.boardState.board);
      setCurrentTurnId(data.nextTurnId);
      if (data.boardState.winningLine) setWinningLine(data.boardState.winningLine);
      setSendingMove(false);
    });

    const unsubMoveRejected = on("move:rejected", (data) => {
      setError(data.error);
      setSendingMove(false);
    });

    const unsubMatchUpdate = on("match:update", (data) => {
      setBoard(data.boardState.board);
      setCurrentTurnId(data.nextTurnId);
      if (data.boardState.winningLine) setWinningLine(data.boardState.winningLine);
    });

    const unsubMatchEnd = on("match:end", (data) => {
      setBoard(data.boardState.board);
      setCurrentTurnId(null);

      const result = data.isDraw ? "draw" : data.winnerId === user.id ? "win" : "loss";
      setGameResult({ result, winningLine: data.boardState?.winningLine || null, isDraw: data.isDraw });
      setXpEarned(data.xpAwarded || 0);
      setEloChange(data.eloChange || 0);
      setPhase("finished");
    });

    const unsubChatMessage = on("chat:message", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    const unsubTyping = on("typing:start", () => {
      setOpponentTyping(true);
      setTimeout(() => setOpponentTyping(false), 3000);
    });

    return () => {
      unsubMatchFound();
      unsubMatchStart();
      unsubMoveAccepted();
      unsubMoveRejected();
      unsubMatchUpdate();
      unsubMatchEnd();
      unsubChatMessage();
      unsubTyping();
    };
  }, [connected, user?.id]);

  const joinQueue = () => {
    setError(null);
    setPhase("searching");
    emit("queue:join", { mode });
  };

  const leaveQueue = () => {
    emit("queue:leave");
    setPhase("lobby");
  };

  const handleCellClick = async (index) => {
    if (!matchId || sendingMove) return;
    if (currentTurnId !== user.id) return;
    if (board[index] !== null) return;
    if (phase !== "playing") return;

    setSendingMove(true);
    const newBoard = [...board];
    newBoard[index] = playerSymbol;
    setBoard(newBoard);
    setCurrentTurnId(null);

    try {
      await emitWithAck("move:submit", { matchId, position: index });
    } catch (e) {
      setError(e.message || "Failed to submit move");
      setSendingMove(false);
    }
  };

  const sendChatMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !matchId) return;

    emit("chat:message", { matchId, content: chatInput, isGlobal: false });

    const optimisticMsg = {
      id: Date.now(),
      content: chatInput,
      sender_id: user.id,
      username: profile?.username || "You",
      created_at: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);
    setChatInput("");
  };

  const isMyTurn = currentTurnId === user?.id;

  const getRankColor = (rank) => {
    const colors = {
      Bronze: "text-[#CD7F32]",
      Silver: "text-[#C0C0C0]",
      Gold: "text-[#FFD700]",
      Platinum: "text-[#A0B2C6]",
      Diamond: "text-[#B9F2FF]",
      Master: "text-[#9370DB]",
      Legend: "text-[#FF6B6B]",
    };
    return colors[rank] || "text-gray-400";
  };

  if (userLoading || !profile) {
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Lobby */}
        {phase === "lobby" && (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-semibold text-white mb-2">
                Multiplayer
              </h1>
              <p className="text-gray-400">
                Play against real opponents in real time
              </p>
            </div>

            {!connected && (
              <div className="mb-4 p-3 bg-[#F59E0B]/10 border border-[#F59E0B]/20 rounded-lg">
                <p className="text-sm text-[#F59E0B] flex items-center gap-2">
                  {reconnecting ? "⟳ Reconnecting..." : "⏳ Connecting to server..."}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg">
                <p className="text-sm text-[#EF4444]">{error}</p>
              </div>
            )}

            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Select Game Mode
              </h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  {
                    id: "ranked",
                    label: "Ranked",
                    desc: "ELO rating changes",
                    color: "from-[#6D28D9] to-[#5B21B6]",
                    icon: "⚡",
                  },
                  {
                    id: "casual",
                    label: "Casual",
                    desc: "Just for fun",
                    color: "from-[#0891B2] to-[#0E7490]",
                    icon: "🎮",
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      mode === m.id
                        ? "border-[#6D28D9] bg-[#6D28D9]/10"
                        : "border-[#E5E7EB]/10 hover:border-[#6D28D9]/30"
                    }`}
                  >
                    <div className="text-2xl mb-2">{m.icon}</div>
                    <div className="text-sm font-semibold text-white">
                      {m.label}
                    </div>
                    <div className="text-xs text-gray-400">{m.desc}</div>
                  </button>
                ))}
              </div>

              <div className="bg-[#1F2937] rounded-lg p-4 mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-400">Your ELO</span>
                  <span className="text-white font-medium">{profile.elo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Rank</span>
                  <span className={`font-medium ${getRankColor(profile.rank)}`}>
                    {profile.rank}
                  </span>
                </div>
              </div>

              <button
                onClick={joinQueue}
                className="w-full py-3.5 bg-gradient-to-r from-[#6D28D9] to-[#5B21B6] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
              >
                Find {mode === "ranked" ? "Ranked" : "Casual"} Match
              </button>
            </div>

            <div className="text-center">
              <a
                href="/play/ranked"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                ← Play vs AI instead
              </a>
            </div>
          </div>
        )}

        {/* Searching */}
        {phase === "searching" && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-12">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-[#6D28D9]/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#6D28D9] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                Finding Opponent
              </h2>
              <p className="text-gray-400 mb-2">
                Searching for a {mode} match...
              </p>
              <p className="text-sm text-gray-500 mb-8">
                Matching near ELO {profile.elo}
              </p>
              <button
                onClick={leaveQueue}
                className="px-6 py-2.5 bg-[#1F2937] hover:bg-[#374151] text-gray-300 rounded-lg text-sm transition-colors"
              >
                Cancel Search
              </button>
            </div>
            <style
              jsx
              global
            >{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Match Found */}
        {phase === "matched" && (
          <div className="max-w-md mx-auto text-center">
            <div className="bg-[#111827] border border-[#22C55E]/20 rounded-xl p-12">
              <div className="text-6xl mb-4">⚔️</div>
              <h2 className="text-2xl font-semibold text-[#22C55E] mb-2">
                Match Found!
              </h2>
              <p className="text-gray-400 mb-4">
                vs{" "}
                <span className="text-white font-semibold">
                  {opponent?.username || "Opponent"}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                You are playing as{" "}
                <strong className="text-[#6D28D9]">{playerSymbol}</strong>
              </p>
              <p className="text-sm text-gray-400 mt-4">
                Starting in a moment...
              </p>
            </div>
          </div>
        )}

        {/* Playing */}
        {phase === "playing" && (
          <div className="grid lg:grid-cols-[280px,1fr,280px] gap-6">
            {/* Player Panel */}
            <div className="space-y-4">
              <div
                className={`bg-[#111827] border rounded-xl p-5 transition-colors ${isMyTurn ? "border-[#22C55E]/40" : "border-[#E5E7EB]/10"}`}
              >
                {isMyTurn && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-[#22C55E]">
                      Your Turn
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {profile.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">
                      {profile.username}
                    </div>
                    <div className={`text-xs ${getRankColor(profile.rank)}`}>
                      {profile.rank}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <div className="w-9 h-9 bg-[#6D28D9]/20 rounded-lg flex items-center justify-center">
                      <span className="text-[#6D28D9] font-bold text-lg">
                        {playerSymbol}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  ELO: <span className="text-white">{profile.elo}</span>
                </div>
              </div>

              {/* Match Chat */}
              <div
                className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl overflow-hidden flex flex-col"
                style={{ height: "280px" }}
              >
                <div className="px-4 py-3 border-b border-[#E5E7EB]/10">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Match Chat
                  </h3>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {chatMessages.length === 0 && (
                    <p className="text-xs text-gray-600 text-center mt-4">
                      No messages yet
                    </p>
                  )}
                  {chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`text-xs ${msg.sender_id === user.id ? "text-right" : "text-left"}`}
                    >
                      <span className="text-gray-500 mr-1">
                        {msg.username}:
                      </span>
                      <span className="text-gray-300">{msg.content}</span>
                    </div>
                  ))}
                  <div ref={chatBottomRef} />
                </div>
                <form
                  onSubmit={sendChatMessage}
                  className="border-t border-[#E5E7EB]/10 p-2 flex gap-2"
                >
                  <input
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value);
                      emit("typing:start", { matchId });
                    }}
                    onBlur={() => emit("typing:stop", { matchId })}
                    placeholder="Say something..."
                    maxLength={200}
                    className="flex-1 bg-[#1F2937] rounded px-3 py-1.5 text-xs text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-[#6D28D9]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#6D28D9] rounded text-white text-xs hover:bg-[#5B21B6]"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>

            {/* Game Board */}
            <div className="flex flex-col items-center">
              <div className="mb-4 text-center">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    isMyTurn
                      ? "bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/20"
                      : "bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20"
                  }`}
                >
                  {isMyTurn ? "✦ Your turn" : "⏳ Opponent's turn"}
                </div>
              </div>

              <GameBoard
                board={board}
                onCellClick={handleCellClick}
                winningLine={winningLine}
                currentPlayer={playerSymbol}
                disabled={!isMyTurn || sendingMove || phase !== "playing"}
              />

              {sendingMove && (
                <p className="text-xs text-gray-500 mt-3">Submitting move...</p>
              )}
            </div>

            {/* Opponent Panel */}
            <div className="space-y-4">
              <div
                className={`bg-[#111827] border rounded-xl p-5 transition-colors ${!isMyTurn ? "border-[#22C55E]/40" : "border-[#E5E7EB]/10"}`}
              >
                {opponentTyping && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-[#22D3EE] rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-[#22D3EE] rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-1.5 h-1.5 bg-[#22D3EE] rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                    <span className="text-xs font-medium text-[#22D3EE]">
                      Typing...
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#22D3EE] to-[#0891B2] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">
                      {(opponent?.username || "?")[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">
                      {opponent?.username || "Opponent"}
                    </div>
                    <div className={`text-xs ${getRankColor(opponent?.rank)}`}>
                      {opponent?.rank || "—"}
                    </div>
                  </div>
                  <div className="ml-auto">
                    <div className="w-9 h-9 bg-[#22D3EE]/10 rounded-lg flex items-center justify-center">
                      <span className="text-[#22D3EE] font-bold text-lg">
                        {playerSymbol === "X" ? "O" : "X"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  ELO:{" "}
                  <span className="text-white">{opponent?.elo || "—"}</span>
                </div>
              </div>

              {/* Match Info */}
              <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-4">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Match Info
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Mode</span>
                    <span className="text-white capitalize">{mode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Moves</span>
                    <span className="text-white">
                      {board.filter(Boolean).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Finished */}
        {phase === "finished" && gameResult && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-8 max-w-md w-full">
              <div className="text-center">
                {gameResult.result === "win" && (
                  <>
                    <div className="text-7xl mb-4">🏆</div>
                    <h2 className="text-3xl font-bold text-[#22C55E] mb-2">
                      Victory!
                    </h2>
                    <p className="text-gray-400">
                      You defeated {opponent?.username}
                    </p>
                  </>
                )}
                {gameResult.result === "loss" && (
                  <>
                    <div className="text-7xl mb-4">😤</div>
                    <h2 className="text-3xl font-bold text-[#EF4444] mb-2">
                      Defeat
                    </h2>
                    <p className="text-gray-400">
                      {opponent?.username} won this one
                    </p>
                  </>
                )}
                {gameResult.result === "draw" && (
                  <>
                    <div className="text-7xl mb-4">🤝</div>
                    <h2 className="text-3xl font-bold text-[#F59E0B] mb-2">
                      Draw!
                    </h2>
                    <p className="text-gray-400">A hard-fought battle</p>
                  </>
                )}

                <div className="grid grid-cols-2 gap-3 my-6">
                  <div className="bg-[#1F2937] rounded-xl p-4">
                    <div className="text-xs text-gray-400 mb-1">XP Earned</div>
                    <div className="text-2xl font-bold text-[#8B5CF6]">
                      +{xpEarned}
                    </div>
                  </div>
                  {mode === "ranked" && (
                    <div className="bg-[#1F2937] rounded-xl p-4">
                      <div className="text-xs text-gray-400 mb-1">
                        ELO Change
                      </div>
                      <div
                        className={`text-2xl font-bold ${eloChange >= 0 ? "text-[#22C55E]" : "text-[#EF4444]"}`}
                      >
                        {eloChange >= 0 ? "+" : ""}
                        {eloChange}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setPhase("lobby");
                      setBoard(Array(9).fill(null));
                      setGameResult(null);
                      setWinningLine(null);
                      setMatchId(null);
                    }}
                    className="flex-1 bg-[#6D28D9] hover:bg-[#5B21B6] text-white font-semibold py-3 rounded-xl transition-colors"
                  >
                    Play Again
                  </button>
                  <a
                    href="/dashboard"
                    className="flex-1 bg-[#1F2937] hover:bg-[#374151] text-white font-semibold py-3 rounded-xl transition-colors text-center"
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
