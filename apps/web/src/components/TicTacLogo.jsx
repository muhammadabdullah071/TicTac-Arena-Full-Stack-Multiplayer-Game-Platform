export default function TicTacLogo({ size = 8, showText = true }) {
  const iconSize = size * 4;
  const iconStyle = {
    width: `${iconSize}px`,
    height: `${iconSize}px`,
    background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 50%, #06B6D4 100%)',
    boxShadow: '0 0 20px rgba(124, 58, 237, 0.5), 0 0 40px rgba(124, 58, 237, 0.2)',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  };

  return (
    <a href="/" className="flex items-center gap-2.5 shrink-0 group">
      <div style={iconStyle}>
        <svg viewBox="0 0 100 100" style={{ width: '65%', height: '65%' }} fill="none">
          {/* Grid lines */}
          <line x1="33" y1="8"  x2="33" y2="92" stroke="rgba(255,255,255,0.6)" strokeWidth="5" strokeLinecap="round"/>
          <line x1="67" y1="8"  x2="67" y2="92" stroke="rgba(255,255,255,0.6)" strokeWidth="5" strokeLinecap="round"/>
          <line x1="8"  y1="33" x2="92" y2="33" stroke="rgba(255,255,255,0.6)" strokeWidth="5" strokeLinecap="round"/>
          <line x1="8"  y1="67" x2="92" y2="67" stroke="rgba(255,255,255,0.6)" strokeWidth="5" strokeLinecap="round"/>
          {/* X in top-left cell */}
          <line x1="14" y1="14" x2="26" y2="26" stroke="white" strokeWidth="5" strokeLinecap="round"/>
          <line x1="26" y1="14" x2="14" y2="26" stroke="white" strokeWidth="5" strokeLinecap="round"/>
          {/* O in center cell */}
          <circle cx="50" cy="50" r="9" stroke="#06B6D4" strokeWidth="5" fill="none"/>
          {/* X in bottom-right cell */}
          <line x1="74" y1="74" x2="86" y2="86" stroke="white" strokeWidth="5" strokeLinecap="round"/>
          <line x1="86" y1="74" x2="74" y2="86" stroke="white" strokeWidth="5" strokeLinecap="round"/>
        </svg>
      </div>

      {showText && (
        <div className="hidden sm:block">
          <span
            className="font-bold text-lg tracking-wide transition-colors group-hover:opacity-90"
            style={{ color: '#F8FAFC' }}
          >
            TicTac<span style={{ color: '#06B6D4' }}>Arena</span>
          </span>
        </div>
      )}
    </a>
  );
}
