"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

const RANK_BADGES = {
  Bronze: "🟤",
  Silver: "⚪",
  Gold: "🟡",
  Platinum: "🔵",
  Diamond: "💎",
  Master: "🟣",
  Legend: "🔴",
};

const QUICK_EMOJIS = [
  "👋",
  "😄",
  "🎉",
  "🏆",
  "💪",
  "🤝",
  "😤",
  "🎮",
  "🔥",
  "❤️",
];

export default function ChatPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("global");
  const [globalMessages, setGlobalMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [privateMessages, setPrivateMessages] = useState([]);
  const [input, setInput] = useState("");
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);

  useEffect(() => {
    if (!userLoading && !user) navigate("/account/signin");
    else if (user) {
      fetchProfile();
      fetchGlobalChat();
      fetchFriends();
    }
  }, [user, userLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [globalMessages, privateMessages]);

  // Poll global chat every 3 seconds
  useEffect(() => {
    if (!user) return;
    pollRef.current = setInterval(() => {
      if (activeTab === "global") fetchGlobalChat();
      else if (activeTab === "private" && selectedFriend)
        fetchPrivateChat(selectedFriend.friend_id);
    }, 3000);

    return () => clearInterval(pollRef.current);
  }, [user, activeTab, selectedFriend]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/profiles/${user.id}`);
      if (res.ok) {
        const d = await res.json();
        setProfile(d.profile);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGlobalChat = async () => {
    try {
      const res = await fetch("/api/chat/global?limit=50");
      if (res.ok) {
        const d = await res.json();
        setGlobalMessages(d.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends?type=friends");
      if (res.ok) {
        const d = await res.json();
        setFriends(d.friends || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPrivateChat = async (friendId) => {
    try {
      const res = await fetch(`/api/chat/private/${friendId}`);
      if (res.ok) {
        const d = await res.json();
        setPrivateMessages(d.messages || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const selectFriend = (friend) => {
    setSelectedFriend(friend);
    setActiveTab("private");
    fetchPrivateChat(friend.friend_id);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    setSending(true);
    setError(null);

    try {
      if (activeTab === "global") {
        const res = await fetch("/api/chat/global", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: input.trim() }),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error);
        }
        const d = await res.json();
        setGlobalMessages((prev) => [...prev, d.message]);
      } else if (activeTab === "private" && selectedFriend) {
        const res = await fetch(
          `/api/chat/private/${selectedFriend.friend_id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: input.trim() }),
          },
        );
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.error);
        }
        const d = await res.json();
        setPrivateMessages((prev) => [...prev, d.message]);
      }
      setInput("");
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const currentMessages =
    activeTab === "global" ? globalMessages : privateMessages;

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6D28D9] border-t-transparent rounded-full animate-spin"></div>
        <style
          jsx
          global
        >{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <NavBar active="chat" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-[280px,1fr] gap-6 h-[calc(100vh-160px)] min-h-[500px]">
          {/* Sidebar */}
          <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="p-3 border-b border-[#E5E7EB]/10">
              <div className="flex gap-1 bg-[#1F2937] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("global")}
                  className={`flex-1 text-xs py-2 rounded-md transition-colors ${activeTab === "global" ? "bg-[#6D28D9] text-white" : "text-gray-400 hover:text-white"}`}
                >
                  🌍 Global
                </button>
                <button
                  onClick={() => setActiveTab("private")}
                  className={`flex-1 text-xs py-2 rounded-md transition-colors ${activeTab === "private" ? "bg-[#6D28D9] text-white" : "text-gray-400 hover:text-white"}`}
                >
                  💬 Direct
                </button>
              </div>
            </div>

            {/* Friends List */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === "global" ? (
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-[#22C55E] rounded-full"></div>
                    <span className="text-xs font-medium text-gray-400">
                      Global Chat
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Chat with all players worldwide
                  </p>
                </div>
              ) : (
                <div>
                  <div className="px-3 py-2 border-b border-[#E5E7EB]/10">
                    <p className="text-xs text-gray-500">
                      Select a friend to message
                    </p>
                  </div>
                  {friends.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs text-gray-500">No friends yet</p>
                      <a
                        href="/friends"
                        className="text-xs text-[#6D28D9] hover:underline mt-1 block"
                      >
                        Add Friends
                      </a>
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <button
                        key={friend.friend_id}
                        onClick={() => selectFriend(friend)}
                        className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition-colors ${selectedFriend?.friend_id === friend.friend_id ? "bg-[#6D28D9]/10 border-l-2 border-[#6D28D9]" : ""}`}
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">
                            {friend.username[0].toUpperCase()}
                          </span>
                        </div>
                        <div className="text-left min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {friend.username}
                          </div>
                          <div
                            className={`text-xs ${RANK_COLORS[friend.rank] || "text-gray-400"}`}
                          >
                            {friend.rank}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#E5E7EB]/10 flex items-center gap-3">
              {activeTab === "global" ? (
                <>
                  <div className="w-9 h-9 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm">🌍</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">
                      Global Chat
                    </div>
                    <div className="text-xs text-gray-400">
                      All players worldwide
                    </div>
                  </div>
                </>
              ) : selectedFriend ? (
                <>
                  <div className="w-9 h-9 bg-gradient-to-br from-[#22D3EE] to-[#0891B2] rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {selectedFriend.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm">
                      {selectedFriend.username}
                    </div>
                    <div
                      className={`text-xs ${RANK_COLORS[selectedFriend.rank]}`}
                    >
                      {selectedFriend.rank}
                    </div>
                  </div>
                </>
              ) : (
                <div className="font-semibold text-gray-400 text-sm">
                  Select a conversation
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {currentMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-5xl mb-3">💬</div>
                  <p className="text-gray-400 text-sm">No messages yet</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Be the first to say something!
                  </p>
                </div>
              )}

              {currentMessages.map((msg, idx) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <div
                    key={msg.id || idx}
                    className={`flex items-start gap-3 ${isMe ? "flex-row-reverse" : ""}`}
                  >
                    {!isMe && (
                      <div className="w-8 h-8 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-xs font-bold">
                          {(msg.username || "?")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}
                    >
                      {!isMe && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-300">
                            {msg.username}
                          </span>
                          <span
                            className={`text-[10px] ${RANK_COLORS[msg.rank] || "text-gray-500"}`}
                          >
                            {RANK_BADGES[msg.rank] || ""} {msg.rank}
                          </span>
                        </div>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm ${
                          isMe
                            ? "bg-[#6D28D9] text-white rounded-tr-sm"
                            : "bg-[#1F2937] text-gray-100 rounded-tl-sm"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-600">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Error */}
            {error && (
              <div className="px-4 py-2 bg-[#EF4444]/10 text-[#EF4444] text-xs">
                {error}
              </div>
            )}

            {/* Input */}
            {(activeTab === "global" ||
              (activeTab === "private" && selectedFriend)) && (
              <div className="border-t border-[#E5E7EB]/10 p-4">
                <div className="relative">
                  {showEmoji && (
                    <div className="absolute bottom-full mb-2 left-0 bg-[#1F2937] border border-[#E5E7EB]/10 rounded-xl p-3 flex gap-2 flex-wrap">
                      {QUICK_EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            setInput((prev) => prev + emoji);
                            setShowEmoji(false);
                          }}
                          className="text-xl hover:scale-125 transition-transform"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                  <form onSubmit={sendMessage} className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmoji(!showEmoji)}
                      className="p-2.5 bg-[#1F2937] hover:bg-[#374151] rounded-xl text-gray-400 transition-colors"
                    >
                      😊
                    </button>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={
                        activeTab === "global"
                          ? "Message global chat..."
                          : `Message ${selectedFriend?.username}...`
                      }
                      maxLength={500}
                      className="flex-1 bg-[#1F2937] border border-[#E5E7EB]/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6D28D9] focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || sending}
                      className="px-4 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] disabled:opacity-50 text-white rounded-xl transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
