"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";

export default function AdminUsersPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("");
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) navigate("/account/signin");
    else if (user) fetchUsers();
  }, [user, userLoading, page, filter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, filter, search });
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.status === 403) {
        navigate("/dashboard");
        return;
      }
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users || []);
        setTotal(d.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const doSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const adminAction = async (action, userId, extra = {}) => {
    setActionLoading((prev) => ({ ...prev, [userId + action]: true }));
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userId, ...extra }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSuccess(d.message);
      setSelectedUser(null);
      setBanReason("");
      setBanDuration("");
      fetchUsers();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setActionLoading((prev) => ({ ...prev, [userId + action]: false }));
    }
  };

  const totalPages = Math.ceil(total / 20);

  if (userLoading) {
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

  return (
    <div className="min-h-screen bg-[#0B1120]">
      <nav className="border-b border-[#E5E7EB]/10 bg-[#0B1120]/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <a href="/admin" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">T</span>
                </div>
              </a>
              <span className="text-[#EF4444] text-xs font-bold px-2 py-1 bg-[#EF4444]/10 rounded-md">
                ADMIN
              </span>
              <span className="text-gray-400">/ Users</span>
            </div>
            <a href="/admin" className="text-sm text-gray-400 hover:text-white">
              ← Back to Admin
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">User Management</h1>
          <span className="text-sm text-gray-400">
            {total.toLocaleString()} users total
          </span>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-[#22C55E]/10 border border-[#22C55E]/20 rounded-lg text-sm text-[#22C55E]">
            ✓ {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-3 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg text-sm text-[#EF4444]">
            {error}
          </div>
        )}

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <form onSubmit={doSearch} className="flex gap-2 flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search username or email..."
              className="flex-1 bg-[#111827] border border-[#E5E7EB]/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
            />
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm rounded-lg"
            >
              Search
            </button>
          </form>

          <div className="flex gap-2">
            {["all", "banned", "admin"].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-[#6D28D9] text-white"
                    : "bg-[#111827] border border-[#E5E7EB]/10 text-gray-400 hover:text-white"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* User Table */}
        <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#E5E7EB]/10">
                <tr>
                  <th className="text-left py-3.5 px-4 text-xs font-medium text-gray-400">
                    Player
                  </th>
                  <th className="text-left py-3.5 px-4 text-xs font-medium text-gray-400">
                    Stats
                  </th>
                  <th className="text-left py-3.5 px-4 text-xs font-medium text-gray-400">
                    Role
                  </th>
                  <th className="text-left py-3.5 px-4 text-xs font-medium text-gray-400">
                    Status
                  </th>
                  <th className="text-left py-3.5 px-4 text-xs font-medium text-gray-400">
                    Reports
                  </th>
                  <th className="text-right py-3.5 px-4 text-xs font-medium text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className="hover:bg-white/2 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#6D28D9] to-[#8B5CF6] rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">
                              {u.username[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {u.username}
                            </div>
                            <div className="text-xs text-gray-500">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-gray-300">
                          {u.rank} · {u.elo} ELO
                        </div>
                        <div className="text-xs text-gray-500">
                          Lvl {u.level} · {u.total_wins}W/{u.total_matches}{" "}
                          matches
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.role === "admin"
                              ? "bg-[#EF4444]/20 text-[#EF4444]"
                              : u.role === "moderator"
                                ? "bg-[#6D28D9]/20 text-[#8B5CF6]"
                                : "bg-[#1F2937] text-gray-400"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {u.is_banned ? (
                          <span className="text-xs px-2 py-0.5 bg-[#EF4444]/20 text-[#EF4444] rounded-full">
                            Banned
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 bg-[#22C55E]/20 text-[#22C55E] rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {parseInt(u.pending_reports) > 0 ? (
                          <span className="text-xs px-2 py-0.5 bg-[#F59E0B]/20 text-[#F59E0B] rounded-full">
                            {u.pending_reports} pending
                          </span>
                        ) : (
                          <span className="text-xs text-gray-600">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-end gap-2">
                          {u.is_banned ? (
                            <button
                              onClick={() => adminAction("unban", u.id)}
                              disabled={actionLoading[u.id + "unban"]}
                              className="px-3 py-1.5 bg-[#22C55E]/20 hover:bg-[#22C55E]/30 text-[#22C55E] text-xs rounded-lg transition-colors"
                            >
                              Unban
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="px-3 py-1.5 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] text-xs rounded-lg transition-colors"
                            >
                              Ban
                            </button>
                          )}
                          <button
                            onClick={() => adminAction("reset_elo", u.id)}
                            disabled={actionLoading[u.id + "reset_elo"]}
                            className="px-3 py-1.5 bg-[#1F2937] hover:bg-[#374151] text-gray-400 text-xs rounded-lg transition-colors"
                          >
                            Reset ELO
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-[#E5E7EB]/10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-[#1F2937] disabled:opacity-50 text-gray-300 text-xs rounded-lg"
              >
                Previous
              </button>
              <span className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-[#1F2937] disabled:opacity-50 text-gray-300 text-xs rounded-lg"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Ban Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
            <div className="bg-[#111827] border border-[#E5E7EB]/10 rounded-2xl p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-white mb-1">
                Ban User
              </h3>
              <p className="text-sm text-gray-400 mb-5">
                Banning{" "}
                <strong className="text-white">{selectedUser.username}</strong>
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Ban Reason
                  </label>
                  <input
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    placeholder="Violated terms of service..."
                    className="w-full bg-[#1F2937] border border-[#E5E7EB]/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5">
                    Duration (days, leave empty for permanent)
                  </label>
                  <input
                    value={banDuration}
                    onChange={(e) => setBanDuration(e.target.value)}
                    type="number"
                    placeholder="e.g. 7"
                    min="1"
                    className="w-full bg-[#1F2937] border border-[#E5E7EB]/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() =>
                    adminAction("ban", selectedUser.id, {
                      reason: banReason,
                      duration: banDuration ? parseInt(banDuration) : null,
                    })
                  }
                  disabled={actionLoading[selectedUser.id + "ban"]}
                  className="flex-1 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
                >
                  {actionLoading[selectedUser.id + "ban"]
                    ? "Banning..."
                    : "Confirm Ban"}
                </button>
                <button
                  onClick={() => {
                    setSelectedUser(null);
                    setBanReason("");
                    setBanDuration("");
                  }}
                  className="flex-1 py-2.5 bg-[#1F2937] hover:bg-[#374151] text-gray-300 font-semibold text-sm rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
