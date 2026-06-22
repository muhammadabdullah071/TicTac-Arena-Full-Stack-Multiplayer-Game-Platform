import { useState, useEffect } from "react";
import { THEMES, getTheme, setTheme } from "@/lib/theme";

const THEME_LIST = Object.entries(THEMES);

export default function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("purple");

  useEffect(() => {
    setCurrent(getTheme());
  }, []);

  const select = (key) => {
    setTheme(key);
    setCurrent(key);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-[#111827] border border-[var(--accent-glow)] rounded-lg px-2 py-1.5 hover:border-[var(--accent-primary)]/30 transition-colors"
        title="Change theme"
      >
        <div
          className="w-3.5 h-3.5 rounded-full border border-white/20"
          style={{ backgroundColor: THEMES[current]?.accent }}
        />
        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-[#111827] border border-[#E5E7EB]/10 rounded-lg p-1.5 shadow-xl min-w-[130px]">
            {THEME_LIST.map(([key, t]) => (
              <button
                key={key}
                onClick={() => select(key)}
                className={`flex items-center gap-2 w-full px-3 py-1.5 rounded-md text-xs transition-colors ${
                  current === key
                    ? "text-white bg-white/10"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: t.accent }}
                />
                {t.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
