"use client";

import { useState } from "react";
import useUser from "@/utils/useUser";
import TicTacLogo from "@/components/TicTacLogo";
import ThemeToggle from "@/components/ThemeToggle";

export default function NavBar({ active = "" }) {
  const { data: user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/play", label: "Play" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/tournaments", label: "Tournaments" },
    { href: "/friends", label: "Friends" },
    { href: "/achievements", label: "Achievements" },
  ];

  return (
    <nav className="border-b border-[var(--border-subtle)] bg-[var(--bg-dark)]/95 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-6">
            <TicTacLogo />

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`text-sm px-3 py-2 rounded-md transition-colors ${
                    active === link.label.toLowerCase()
                      ? "text-white bg-[var(--accent-glow)] font-medium"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {user && (
              <>
                <a
                  href="/missions"
                  className="hidden sm:flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 hover:border-[var(--accent-glow)] transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5 text-[var(--warning)]"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-xs font-medium text-white">
                    Missions
                  </span>
                </a>
                <a
                  href="/shop"
                  className="hidden sm:flex items-center gap-1.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 hover:border-[var(--accent-glow)] transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5 text-[var(--info)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  <span className="text-xs font-medium text-white">Shop</span>
                </a>
                <a
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg px-3 py-1.5 hover:border-[var(--accent-glow)] transition-colors"
                >
                  <div className="w-5 h-5 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">
                      {(user.name || user.email || "U")[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white hidden sm:block max-w-[100px] truncate">
                    {user.name || user.email}
                  </span>
                </a>
                <a
                  href="/account/logout"
                  className="text-sm text-gray-400 hover:text-white transition-colors hidden sm:block"
                >
                  Logout
                </a>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-white"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-[var(--border-subtle)] py-4 space-y-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block text-sm px-3 py-2.5 rounded-md text-gray-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-[var(--border-subtle)] mt-3 pt-3 space-y-1">
              <a
                href="/missions"
                className="block text-sm px-3 py-2.5 rounded-md text-gray-300 hover:text-white hover:bg-white/5"
              >
                Missions
              </a>
              <a
                href="/shop"
                className="block text-sm px-3 py-2.5 rounded-md text-gray-300 hover:text-white hover:bg-white/5"
              >
                Shop
              </a>
              {user && (
                <a
                  href="/account/logout"
                  className="block text-sm px-3 py-2.5 rounded-md text-[var(--error)] hover:bg-white/5"
                >
                  Logout
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
