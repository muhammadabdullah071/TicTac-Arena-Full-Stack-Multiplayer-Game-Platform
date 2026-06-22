"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import useUser from "@/utils/useUser";
import NavBar from "@/components/NavBar";
import GameBoard from "@/components/GameBoard";
import { useSocket } from "@/lib/useSocket";

export default function SpectatePage() {
  const { matchId } = useParams();
  const { data: user, loading: userLoading } = useUser();
  const [match, setMatch] = useState(null);
  const [spectatorCount, setSpectatorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const token = user ? "placeholder-token" : "";
  const socket = useSocket(token);

  // Fetch match data on mount
  useEffect(() => {
    if (!matchId) return;
    (async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          setMatch(data.match || data);
        }
      } catch (e) {
        console.error("Failed to fetch match:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [matchId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket.connected || !matchId) return;

    socket.emit("spectator:join", { matchId });

    const unsubs = [
      socket.on("match:update", (data) => {
        if (data.matchId === matchId) {
          setMatch(function (prev) {
            if (!prev) return prev;
            return Object.assign({}, prev, {
              board: (data.boardState && data.boardState.board) || prev.board,
              status: data.status,
              currentTurnId: data.nextTurnId,
            });
          });
        }
      }),
      socket.on("match:end", (data) => {
        if (data.matchId === matchId) {
          setMatch(function (prev) {
            if (!prev) return prev;
            return Object.assign({}, prev, {
              status: "finished",
              winnerId: data.winnerId,
              isDraw: data.isDraw,
              board: (data.boardState && data.boardState.board) || prev.board,
            });
          });
        }
      }),
      socket.on("move:accepted", (data) => {
        if (data.matchId === matchId) {
          setMatch(function (prev) {
            if (!prev) return prev;
            return Object.assign({}, prev, {
              board: (data.boardState && data.boardState.board) || prev.board,
              currentTurnId: data.nextTurnId,
            });
          });
        }
      }),
      socket.on("spectator:count", (data) => {
        if (data.matchId === matchId) setSpectatorCount(data.count);
      }),
      socket.on("chat:message", (msg) => {
        setChatMessages(function (prev) { return prev.concat([msg]); });
      }),
    ];

    return function () {
      unsubs.forEach(function (unsub) { unsub(); });
      socket.emit("spectator:leave", { matchId });
    };
  }, [socket.connected, matchId]);

  const sendChat = useCallback(function (e) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    socket.emit("chat:message", { matchId, content: chatInput.trim() });
    setChatInput("");
  }, [chatInput, matchId, socket]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#6D28D9] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🎮</div>
          <h2 className="text-xl font-semibold text-white mb-2">Match Not Found</h2>
          <a href="/dashboard" className="text-[#6D28D9] hover:text-[#8B5CF6] text-sm">
            &larr; Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  const board = (match.boardState && match.boardState.board) || Array(9).fill(null);
  const winningLine = (match.boardState && match.boardState.winningLine) || null;
  const playerX = match.playerX || match.player_x || {};
  const playerO = match.playerO || match.player_o || {};

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Spectating</h1>
            <p className="text-sm text-gray-400">
              Match {matchId}
              {spectatorCount > 0 && (
                <span className="ml-3 text-[#6D28D9]">
                  {spectatorCount} spectator{spectatorCount !== 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>
          {!socket.connected && (
            <div className="text-xs text-[#F59E0B] bg-[#F59E0B]/10 px-3 py-1.5 rounded-lg">
              Reconnecting...
            </div>
          )}
        </div>

        <div className="flex items-center justify-between bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {(playerX.username || "X")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <div className="font-semibold text-white">{playerX.username || "Player X"}</div>
              <div className="text-xs text-[#6D28D9] font-bold">X</div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold text-gray-400">vs</div>
            {match.status === "finished" && (
              <div className="text-xs text-[#22C55E] mt-1">
                {match.isDraw ? "Draw" : "Finished"}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-right">
            <div>
              <div className="font-semibold text-white">{playerO.username || "Player O"}</div>
              <div className="text-xs text-[#22D3EE] font-bold">O</div>
            </div>
            <div className="w-10 h-10 bg-gradient-to-br from-[#22D3EE] to-[#0891B2] rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {(playerO.username || "O")[0].toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1fr,300px] gap-6">
          <div className="flex flex-col items-center">
            <div className="mb-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border border-[#E5E7EB]/10 text-gray-400">
                {match.status === "finished" ? "Match ended" : "Live"}
              </div>
            </div>

            <GameBoard
              board={board}
              onCellClick={function () {}}
              winningLine={winningLine}
              currentPlayer="X"
              disabled={true}
            />
          </div>

          <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-[#E5E7EB]/10">
              <h3 className="text-sm font-semibold text-white">Live Chat</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: "400px" }}>
              {chatMessages.length === 0 && (
                <p className="text-xs text-gray-600 text-center mt-4">No messages yet</p>
              )}
              {chatMessages.map(function (msg, i) {
                return (
                  <div key={msg.id || i} className="text-xs">
                    <span className="text-gray-500 mr-1">
                      {msg.username || msg.sender_id || "Anonymous"}:
                    </span>
                    <span className="text-gray-300">{msg.content}</span>
                  </div>
                );
              })}
            </div>
            <form onSubmit={sendChat} className="border-t border-[#E5E7EB]/10 p-2 flex gap-2">
              <input
                value={chatInput}
                onChange={function (e) { setChatInput(e.target.value); }}
                placeholder="Send a message..."
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
      </div>
    </div>
  );
}
