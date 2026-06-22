"use client";

import { useState, useEffect } from "react";
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

export default function FriendsPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("friends");
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUsername, setSearchUsername] = useState("");
  const [actionLoading, setActionLoading] = useState({});
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) navigate("/account/signin");
    else if (user) {
      fetchFriends();
      fetchRequests();
      fetchSent();
    }
  }, [user, userLoading]);

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends?type=friends");
      if (res.ok) {
        const d = await res.json();
        setFriends(d.friends || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch("/api/friends?type=requests");
      if (res.ok) {
        const d = await res.json();
        setRequests(d.requests || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchSent = async () => {
    try {
      const res = await fetch("/api/friends?type=sent");
      if (res.ok) {
        const d = await res.json();
        setSent(d.sent || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const friendAction = async (action, targetId, key) => {
    setActionLoading((prev) => ({ ...prev, [key]: true }));
    setError(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, targetUserId: targetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
      fetchFriends();
      fetchRequests();
      fetchSent();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    if (!searchUsername.trim()) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send_request",
          username: searchUsername.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuccess(data.message);
      setSearchUsername("");
      fetchSent();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const winRate = (p) =>
    p.total_matches > 0
      ? ((p.total_wins / p.total_matches) * 100).toFixed(0)
      : 0;

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
      <NavBar active="friends" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-white">Friends</h1>
            <p className="text-gray-400 text-sm mt-1">
              {friends.length} friend{friends.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-sm text-[#EF4444]">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg text-sm text-[#22C55E]">
            {success}
          </div>
        )}

        {/* Add Friend */}
        <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3">
            Add Friend by Username
          </h2>
          <form onSubmit={sendFriendRequest} className="flex gap-3">
            <input
              value={searchUsername}
              onChange={(e) => setSearchUsername(e.target.value)}
              placeholder="Enter username..."
              className="flex-1 bg-[#1F2937] border border-[#E5E7EB]/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-medium rounded-lg transition-colors"
            >
              Send Request
            </button>
          </form>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-1 mb-6">
          {[
            { id: "friends", label: "Friends", count: friends.length },
            { id: "requests", label: "Requests", count: requests.length },
            { id: "sent", label: "Sent", count: sent.length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-[#6D28D9] text-white"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span
                  className={`text-xs rounded-full px-1.5 py-0.5 ${activeTab === tab.id ? "bg-white/20 text-white" : "bg-[#1F2937] text-gray-400"}`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Friends List */}
        {activeTab === "friends" && (
          <div className="space-y-3">
            {friends.length === 0 ? (
              <div className="text-center py-16 bg-[#111827] border border-[#E5E7EB]/10 rounded-xl">
                <div className="text-5xl mb-4">👥</div>
                <p className="text-gray-400 mb-2">No friends yet</p>
                <p className="text-sm text-gray-500">
                  Add players by username to see them here
                </p>
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.friend_id}
                  className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-4 flex items-center gap-4 hover:border-[#6D28D9]/20 transition-colors"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-bold">
                      {friend.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/profile/${friend.friend_id}`}
                      className="font-semibold text-white hover:text-[#8B5CF6] transition-colors"
                    >
                      {friend.username}
                    </a>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                      <span
                        className={RANK_COLORS[friend.rank] || "text-gray-400"}
                      >
                        {friend.rank}
                      </span>
                      <span>·</span>
                      <span>{friend.elo} ELO</span>
                      <span>·</span>
                      <span>{winRate(friend)}% WR</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href="/chat"
                      className="p-2 bg-[#1F2937] hover:bg-[#374151] rounded-lg transition-colors"
                      title="Message"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </a>
                    <button
                      onClick={() =>
                        friendAction(
                          "remove",
                          friend.friend_id,
                          `remove-${friend.friend_id}`,
                        )
                      }
                      disabled={actionLoading[`remove-${friend.friend_id}`]}
                      className="p-2 bg-[#1F2937] hover:bg-[#EF4444]/20 rounded-lg transition-colors"
                      title="Remove friend"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400 hover:text-[#EF4444]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Friend Requests */}
        {activeTab === "requests" && (
          <div className="space-y-3">
            {requests.length === 0 ? (
              <div className="text-center py-16 bg-[#111827] border border-[#E5E7EB]/10 rounded-xl">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-gray-400">No pending requests</p>
              </div>
            ) : (
              requests.map((req) => (
                <div
                  key={req.requester_id}
                  className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#22D3EE] to-[#0891B2] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-bold">
                      {req.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">
                      {req.username}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      <span
                        className={RANK_COLORS[req.rank] || "text-gray-400"}
                      >
                        {req.rank}
                      </span>
                      <span className="mx-1">·</span>
                      <span>{req.elo} ELO</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        friendAction(
                          "accept",
                          req.requester_id,
                          `accept-${req.requester_id}`,
                        )
                      }
                      disabled={actionLoading[`accept-${req.requester_id}`]}
                      className="px-4 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() =>
                        friendAction(
                          "reject",
                          req.requester_id,
                          `reject-${req.requester_id}`,
                        )
                      }
                      disabled={actionLoading[`reject-${req.requester_id}`]}
                      className="px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-gray-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Sent Requests */}
        {activeTab === "sent" && (
          <div className="space-y-3">
            {sent.length === 0 ? (
              <div className="text-center py-16 bg-[#111827] border border-[#E5E7EB]/10 rounded-xl">
                <div className="text-5xl mb-4">📤</div>
                <p className="text-gray-400">No sent requests</p>
              </div>
            ) : (
              sent.map((req) => (
                <div
                  key={req.friend_id}
                  className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-4 flex items-center gap-4"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white font-bold">
                      {req.username[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-white">
                      {req.username}
                    </div>
                    <div className="text-xs text-[#F59E0B] mt-0.5">
                      Pending...
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
