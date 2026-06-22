"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";

export default function AdminReportsPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState("pending");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) navigate("/account/signin");
    else if (user) fetchReports();
  }, [user, userLoading, status, page]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ status, page });
      const res = await fetch(`/api/admin/reports?${params}`);
      if (res.status === 403) {
        navigate("/dashboard");
        return;
      }
      if (res.ok) {
        const d = await res.json();
        setReports(d.reports || []);
        setTotal(d.total || 0);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, reportId, userId) => {
    setProcessing((prev) => ({ ...prev, [reportId]: true }));
    try {
      const res = await fetch("/api/admin/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reportId, userId }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSuccess(d.message);
      fetchReports();
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError(e.message);
      setTimeout(() => setError(null), 3000);
    } finally {
      setProcessing((prev) => ({ ...prev, [reportId]: false }));
    }
  };

  const REASON_LABELS = {
    cheating: "🎭 Cheating",
    harassment: "😡 Harassment",
    spam: "📢 Spam",
    inappropriate_name: "🚫 Name",
    other: "❓ Other",
  };

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
              <a href="/admin" className="text-white font-semibold">
                Admin
              </a>
              <span className="text-[#EF4444] text-xs font-bold px-2 py-1 bg-[#EF4444]/10 rounded-md">
                REPORTS
              </span>
            </div>
            <a href="/admin" className="text-sm text-gray-400 hover:text-white">
              ← Back to Admin
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Reports Queue</h1>
          <p className="text-sm text-gray-400 mt-1">
            {total} reports · {status}
          </p>
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

        {/* Status Filter */}
        <div className="flex gap-2 mb-6">
          {["pending", "resolved", "dismissed"].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                status === s
                  ? "bg-[#6D28D9] text-white"
                  : "bg-[#111827] border border-[#E5E7EB]/10 text-gray-400 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading...</div>
        ) : reports.length === 0 ? (
          <div className="text-center py-16 bg-[#111827] border border-[#E5E7EB]/10 rounded-xl">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-gray-400">No {status} reports</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-[#111827] border border-[#E5E7EB]/10 rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-semibold text-white">
                        {report.reported_username}
                      </span>
                      {report.reported_is_banned && (
                        <span className="text-xs bg-[#EF4444]/20 text-[#EF4444] px-2 py-0.5 rounded-full">
                          Banned
                        </span>
                      )}
                      <span className="text-xs bg-[#F59E0B]/20 text-[#F59E0B] px-2 py-0.5 rounded-full">
                        {REASON_LABELS[report.reason] || report.reason}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mb-1">
                      Reported by{" "}
                      <span className="text-gray-300">
                        {report.reporter_username}
                      </span>{" "}
                      · {new Date(report.created_at).toLocaleDateString()}
                    </p>
                    {report.description && (
                      <p className="text-xs text-gray-500 italic">
                        "{report.description}"
                      </p>
                    )}
                  </div>

                  {status === "pending" && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() =>
                          handleAction(
                            "ban_and_resolve",
                            report.id,
                            report.reported_id,
                          )
                        }
                        disabled={
                          processing[report.id] || report.reported_is_banned
                        }
                        className="px-3 py-1.5 bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] text-xs rounded-lg disabled:opacity-50"
                      >
                        Ban & Resolve
                      </button>
                      <button
                        onClick={() => handleAction("resolve", report.id)}
                        disabled={processing[report.id]}
                        className="px-3 py-1.5 bg-[#22C55E]/20 hover:bg-[#22C55E]/30 text-[#22C55E] text-xs rounded-lg disabled:opacity-50"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleAction("dismiss", report.id)}
                        disabled={processing[report.id]}
                        className="px-3 py-1.5 bg-[#1F2937] hover:bg-[#374151] text-gray-400 text-xs rounded-lg disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
