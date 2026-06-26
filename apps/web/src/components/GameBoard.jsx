/* GameBoard — stunning SVG X/O with glow, pop animation, winning pulse */

function XSymbol({ winning }) {
  const color = winning ? '#10B981' : '#A78BFA';
  const glow  = winning ? 'rgba(16,185,129,0.8)' : 'rgba(167,139,250,0.8)';
  return (
    <svg
      viewBox="0 0 60 60"
      width="52"
      height="52"
      fill="none"
      style={{
        filter: `drop-shadow(0 0 8px ${glow})`,
        animation: 'cell-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}
    >
      <line x1="12" y1="12" x2="48" y2="48" stroke={color} strokeWidth="6" strokeLinecap="round"/>
      <line x1="48" y1="12" x2="12" y2="48" stroke={color} strokeWidth="6" strokeLinecap="round"/>
    </svg>
  );
}

function OSymbol({ winning }) {
  const color = winning ? '#10B981' : '#06B6D4';
  const glow  = winning ? 'rgba(16,185,129,0.8)' : 'rgba(6,182,212,0.8)';
  return (
    <svg
      viewBox="0 0 60 60"
      width="52"
      height="52"
      fill="none"
      style={{
        filter: `drop-shadow(0 0 8px ${glow})`,
        animation: 'cell-pop 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
      }}
    >
      <circle cx="30" cy="30" r="17" stroke={color} strokeWidth="6" fill="none"/>
    </svg>
  );
}

function Cell({ index, value, isWinning, isDisabled, currentPlayer, onClick }) {
  const taken = Boolean(value);

  const baseStyle = {
    background: isWinning ? 'rgba(16,185,129,0.15)' : 'rgba(13,21,38,0.95)',
    border: `2px solid ${isWinning ? 'rgba(16,185,129,0.55)' : 'rgba(30,58,138,0.5)'}`,
    borderRadius: '14px',
    cursor: taken || isDisabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: '1 / 1',
    minHeight: '80px',
    transition: 'all 0.18s ease',
    boxShadow: isWinning ? '0 0 20px rgba(16,185,129,0.3)' : 'none',
    animation: isWinning ? 'pulse-glow-green 1.2s ease-in-out infinite' : 'none',
    position: 'relative',
    overflow: 'hidden',
  };

  const handleMouseEnter = (e) => {
    if (taken || isDisabled) return;
    e.currentTarget.style.background = currentPlayer === 'X'
      ? 'rgba(124,58,237,0.15)' : 'rgba(6,182,212,0.1)';
    e.currentTarget.style.borderColor = currentPlayer === 'X'
      ? 'rgba(124,58,237,0.5)' : 'rgba(6,182,212,0.4)';
    e.currentTarget.style.transform = 'scale(1.04)';
    e.currentTarget.style.boxShadow = currentPlayer === 'X'
      ? '0 0 18px rgba(124,58,237,0.25)' : '0 0 18px rgba(6,182,212,0.2)';
  };

  const handleMouseLeave = (e) => {
    if (taken || isDisabled) return;
    e.currentTarget.style.background = isWinning ? 'rgba(16,185,129,0.15)' : 'rgba(13,21,38,0.95)';
    e.currentTarget.style.borderColor = isWinning ? 'rgba(16,185,129,0.55)' : 'rgba(30,58,138,0.5)';
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = isWinning ? '0 0 20px rgba(16,185,129,0.3)' : 'none';
  };

  return (
    <div
      style={baseStyle}
      onClick={() => !taken && !isDisabled && onClick(index)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {value === 'X' && <XSymbol winning={isWinning} />}
      {value === 'O' && <OSymbol winning={isWinning} />}

      {/* Ghost preview on hover */}
      {!value && !isDisabled && (
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ opacity: 0, transition: 'opacity 0.15s' }}
        >
          {currentPlayer === 'X' ? (
            <svg viewBox="0 0 60 60" width="40" height="40" fill="none">
              <line x1="12" y1="12" x2="48" y2="48" stroke="#A78BFA" strokeWidth="6" strokeLinecap="round" opacity="0.3"/>
              <line x1="48" y1="12" x2="12" y2="48" stroke="#A78BFA" strokeWidth="6" strokeLinecap="round" opacity="0.3"/>
            </svg>
          ) : (
            <svg viewBox="0 0 60 60" width="40" height="40" fill="none">
              <circle cx="30" cy="30" r="17" stroke="#06B6D4" strokeWidth="6" fill="none" opacity="0.3"/>
            </svg>
          )}
        </div>
      )}
    </div>
  );
}

export default function GameBoard({ board, onCellClick, winningLine, currentPlayer, disabled }) {
  const xColor = '#A78BFA';
  const oColor = '#06B6D4';

  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: 'rgba(13,21,38,0.8)',
        border: '1px solid rgba(124,58,237,0.2)',
        boxShadow: '0 0 40px rgba(124,58,237,0.1)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Turn indicator */}
      {!disabled && (
        <div className="mb-5 flex justify-center">
          <div
            className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full text-sm font-semibold"
            style={{
              background: 'rgba(13,21,38,0.95)',
              border: `1px solid ${currentPlayer === 'X' ? 'rgba(167,139,250,0.4)' : 'rgba(6,182,212,0.4)'}`,
              boxShadow: currentPlayer === 'X'
                ? '0 0 14px rgba(167,139,250,0.2)'
                : '0 0 14px rgba(6,182,212,0.2)',
              color: '#F8FAFC',
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: currentPlayer === 'X' ? xColor : oColor,
                boxShadow: currentPlayer === 'X'
                  ? '0 0 8px rgba(167,139,250,0.9)'
                  : '0 0 8px rgba(6,182,212,0.9)',
                animation: 'glow-pulse 1.5s ease-in-out infinite',
              }}
            />
            {currentPlayer === 'X' ? (
              <span>Your turn — <span style={{ color: xColor, fontWeight: 700 }}>X</span></span>
            ) : (
              <span>Opponent&apos;s turn — <span style={{ color: oColor, fontWeight: 700 }}>O</span></span>
            )}
          </div>
        </div>
      )}

      {/* 3×3 grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '10px',
          maxWidth: '360px',
          margin: '0 auto',
        }}
      >
        {board.map((cell, index) => (
          <Cell
            key={index}
            index={index}
            value={cell}
            isWinning={winningLine?.includes(index) ?? false}
            isDisabled={disabled}
            currentPlayer={currentPlayer}
            onClick={onCellClick}
          />
        ))}
      </div>
    </div>
  );
}
