const THEMES = {
  purple: {
    name: "Purple",
    accent: "#6D28D9",
    accentSecondary: "#8B5CF6",
    accentLight: "#A78BFA",
    accentGlow: "rgba(109, 40, 217, 0.2)",
    hover: "#5B21B6",
    ring: "#6D28D9",
  },
  blue: {
    name: "Blue",
    accent: "#2563EB",
    accentSecondary: "#3B82F6",
    accentLight: "#60A5FA",
    accentGlow: "rgba(37, 99, 235, 0.2)",
    hover: "#1D4ED8",
    ring: "#2563EB",
  },
  emerald: {
    name: "Emerald",
    accent: "#059669",
    accentSecondary: "#10B981",
    accentLight: "#34D399",
    accentGlow: "rgba(5, 150, 105, 0.2)",
    hover: "#047857",
    ring: "#059669",
  },
  red: {
    name: "Red",
    accent: "#DC2626",
    accentSecondary: "#EF4444",
    accentLight: "#F87171",
    accentGlow: "rgba(220, 38, 38, 0.2)",
    hover: "#B91C1C",
    ring: "#DC2626",
  },
  orange: {
    name: "Orange",
    accent: "#EA580C",
    accentSecondary: "#F97316",
    accentLight: "#FB923C",
    accentGlow: "rgba(234, 88, 12, 0.2)",
    hover: "#C2410C",
    ring: "#EA580C",
  },
  pink: {
    name: "Pink",
    accent: "#DB2777",
    accentSecondary: "#EC4899",
    accentLight: "#F472B6",
    accentGlow: "rgba(219, 39, 119, 0.2)",
    hover: "#BE185D",
    ring: "#DB2777",
  },
  teal: {
    name: "Teal",
    accent: "#0D9488",
    accentSecondary: "#14B8A6",
    accentLight: "#2DD4BF",
    accentGlow: "rgba(13, 148, 136, 0.2)",
    hover: "#0F766E",
    ring: "#0D9488",
  },
};

function getTheme() {
  if (typeof window === "undefined") return "purple";
  return localStorage.getItem("tictac-theme") || "purple";
}

function setTheme(name) {
  if (typeof window === "undefined") return;
  localStorage.setItem("tictac-theme", name);
  const t = THEMES[name];
  if (!t) return;
  const root = document.documentElement;
  root.style.setProperty("--accent-primary", t.accent);
  root.style.setProperty("--accent-secondary", t.accentSecondary);
  root.style.setProperty("--accent-light", t.accentLight);
  root.style.setProperty("--accent-glow", t.accentGlow);
  root.style.setProperty("--accent-hover", t.hover);
  root.style.setProperty("--accent-ring", t.ring);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", t.accent);
}

function initTheme() {
  const saved = getTheme();
  setTheme(saved);
}

export { THEMES, getTheme, setTheme, initTheme };
