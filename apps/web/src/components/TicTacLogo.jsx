export default function TicTacLogo({ size = 8, showText = true }) {
  return (
    <a href="/" className="flex items-center gap-2 shrink-0">
      <div
        className={`w-${size} h-${size} bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-lg flex items-center justify-center`}
      >
        <svg
          viewBox="0 0 100 100"
          className={`text-white ${size >= 8 ? 'w-4 h-4' : 'w-3 h-3'}`}
          fill="none"
        >
          <line x1="25" y1="35" x2="75" y2="35" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <line x1="25" y1="65" x2="75" y2="65" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <line x1="35" y1="25" x2="35" y2="75" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <line x1="65" y1="25" x2="65" y2="75" stroke="white" strokeWidth="8" strokeLinecap="round" />
          <circle cx="50" cy="50" r="8" fill="white" />
        </svg>
      </div>
      {showText && (
        <span className="text-xl font-semibold text-white hidden sm:block">
          TicTac Arena
        </span>
      )}
    </a>
  );
}
