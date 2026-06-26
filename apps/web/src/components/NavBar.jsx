"use client";

import { useState } from "react";
import useUser from "@/utils/useUser";
import TicTacLogo from "@/components/TicTacLogo";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_LINKS = [
  { href: "/dashboard",    label: "Dashboard" },
  { href: "/play",         label: "Play" },
  { href: "/leaderboard",  label: "Leaderboard" },
  { href: "/tournaments",  label: "Tournaments" },
  { href: "/friends",      label: "Friends" },
  { href: "/achievements", label: "Achievements" },
];

export default function NavBar({ active = "" }) {
  const { data: user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (label) => active === label.toLowerCase();

  return (
    <nav
      className="sticky top-0 z-40"
      style={{
        background: "rgba(5,11,24,0.88)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(124,58,237,0.2)",
        boxShadow: "0 1px 30px rgba(124,58,237,0.07)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* Left */}
          <div className="flex items-center gap-6">
            <TicTacLogo />

            {/* Desktop links */}
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm px-3.5 py-2 rounded-lg transition-all font-medium"
                  style={{
                    color: isActive(link.label) ? "#F8FAFC" : "#94A3B8",
                    background: isActive(link.label) ? "rgba(124,58,237,0.18)" : "transparent",
                    borderBottom: isActive(link.label) ? "2px solid #7C3AED" : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive(link.label)) {
                      e.currentTarget.style.color = "#F8FAFC";
                      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive(link.label)) {
                      e.currentTarget.style.color = "#94A3B8";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <ThemeToggle />

            {user && (
              <>
                <a
                  href="/missions"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: "rgba(13,21,38,0.9)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    color: "#94A3B8",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#F8FAFC"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)"; }}
                >
                  Missions
                </a>

                <a
                  href="/shop"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: "rgba(13,21,38,0.9)",
                    border: "1px solid rgba(124,58,237,0.2)",
                    color: "#94A3B8",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#F8FAFC"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.4)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#94A3B8"; e.currentTarget.style.borderColor = "rgba(124,58,237,0.2)"; }}
                >
                  Shop
                </a>

                {/* Avatar */}
                <a
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    background: "rgba(13,21,38,0.9)",
                    border: "1px solid rgba(124,58,237,0.25)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(124,58,237,0.5)";
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(124,58,237,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(124,58,237,0.25)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #06B6D4)",
                      boxShadow: "0 0 8px rgba(124,58,237,0.5)",
                    }}
                  >
                    {(user.name || user.email || "U")[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white hidden sm:block max-w-[100px] truncate">
                    {user.name || user.email}
                  </span>
                </a>

                <a
                  href="/account/logout"
                  className="hidden sm:block text-xs transition-colors px-2"
                  style={{ color: "#475569" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
                >
                  Logout
                </a>
              </>
            )}

            {/* Mobile burger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="lg:hidden p-2 rounded-lg transition-colors"
              style={{ color: "#94A3B8", background: "rgba(124,58,237,0.08)" }}
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div
            className="lg:hidden py-4 space-y-1"
            style={{ borderTop: "1px solid rgba(124,58,237,0.15)" }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm px-3 py-2.5 rounded-xl transition-all"
                style={{
                  color: isActive(link.label) ? "#F8FAFC" : "#94A3B8",
                  background: isActive(link.label) ? "rgba(124,58,237,0.15)" : "transparent",
                }}
              >
                {link.label}
              </a>
            ))}
            <div style={{ borderTop: "1px solid rgba(124,58,237,0.1)", paddingTop: "8px", marginTop: "8px" }}>
              <a href="/missions" className="block text-sm px-3 py-2.5 rounded-xl" style={{ color: "#94A3B8" }}>Missions</a>
              <a href="/shop" className="block text-sm px-3 py-2.5 rounded-xl" style={{ color: "#94A3B8" }}>Shop</a>
              {user && (
                <a href="/account/logout" className="block text-sm px-3 py-2.5 rounded-xl" style={{ color: "#EF4444" }}>Logout</a>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
