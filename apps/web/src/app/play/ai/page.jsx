"use client";

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useUser from "@/utils/useUser";
import GameBoard from "@/components/GameBoard";
import { TicTacToeAI, checkGameState, calculateXP } from "@/lib/gameAI";
import TicTacLogo from "@/components/TicTacLogo";

const DIFFICULTIES = [
  { id: 'easy',       label: 'Easy',       desc: 'Perfect for beginners',  xpNote: '+15 XP on win', color: '#10B981', glow: 'rgba(16,185,129,0.35)',  border: 'rgba(16,185,129,0.4)',  bg: 'rgba(16,185,129,0.08)' },
  { id: 'medium',     label: 'Medium',     desc: 'Balanced challenge',      xpNote: '+25 XP on win', color: '#F59E0B', glow: 'rgba(245,158,11,0.35)', border: 'rgba(245,158,11,0.4)', bg: 'rgba(245,158,11,0.08)' },
  { id: 'hard',       label: 'Hard',       desc: 'Tough opponent',          xpNote: '+40 XP on win', color: '#EF4444', glow: 'rgba(239,68,68,0.35)',  border: 'rgba(239,68,68,0.4)',  bg: 'rgba(239,68,68,0.08)' },
  { id: 'impossible', label: 'Impossible', desc: 'Unbeatable AI',           xpNote: '+60 XP on win', color: '#A78BFA', glow: 'rgba(124,58,237,0.5)',  border: 'rgba(124,58,237,0.5)', bg: 'linear-gradient(135deg, rgba(124,58,237,0.18), rgba(109,40,217,0.12))', special: true },
];

function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: '10px', height: '10px', borderRadius: '50%',
            background: '#06B6D4',
            animation: `bounce-dot 1.4s ease-in-out ${i * 0.16}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function PlayerPanel({ label, symbol, isActive, isUser, username }) {
  const color = symbol === 'X' ? '#A78BFA' : '#06B6D4';
  return (
    <div
      className="rounded-2xl p-4 text-center transition-all"
      style={{
        background: isActive ? `rgba(${symbol === 'X' ? '124,58,237' : '6,182,212'},0.12)` : 'rgba(13,21,38,0.7)',
        border: `2px solid ${isActive ? color : 'rgba(30,58,138,0.3)'}`,
        boxShadow: isActive ? `0 0 20px ${color}40` : 'none',
      }}
    >
      <div className="text-2xl mb-1">{isUser ? '🧑‍💻' : '🤖'}</div>
      <div className="text-xs font-semibold mb-1" style={{ color: '#94A3B8' }}>{label}</div>
      <div className="font-bold text-white truncate text-sm">{username}</div>
      <div className="mt-2">
        <svg viewBox="0 0 40 40" width="32" height="32" fill="none" style={{ margin: '0 auto' }}>
          {symbol === 'X' ? (
            <>
              <line x1="8" y1="8" x2="32" y2="32" stroke={color} strokeWidth="5" strokeLinecap="round"/>
              <line x1="32" y1="8" x2="8" y2="32" stroke={color} strokeWidth="5" strokeLinecap="round"/>
            </>
          ) : (
            <circle cx="20" cy="20" r="11" stroke={color} strokeWidth="5" fill="none"/>
          )}
        </svg>
      </div>
      {isActive && (
        <div className="mt-2">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-semibold"
            style={{ background: `${color}25`, color }}
          >
            {isUser ? 'Your turn' : 'Thinking…'}
          </span>
        </div>
      )}
    </div>
  );
}

function ResultModal({ gameState, xpEarned, difficulty, onPlayAgain }) {
  const winner = gameState.winner;
  const cfgMap = {
    X:    { title: 'Victory!',    subtitle: 'You defeated the AI!',    color: '#10B981' },
    O:    { title: 'Defeated',    subtitle: 'The AI wins this round.',  color: '#EF4444' },
    draw: { title: 'Draw!',       subtitle: 'Well played by both!',     color: '#F59E0B' },
  };
  const cfg = cfgMap[winner] || cfgMap.draw;
  const confettiColors = ['#A78BFA', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(5,11,24,0.85)', backdropFilter: 'blur(8px)' }}
    >
      {/* Confetti (win only) */}
      {winner === 'X' && confettiColors.map((c, i) => (
        <div
          key={i}
          style={{
            position: 'absolute', width: '8px', height: '8px', borderRadius: '50%', background: c,
            top: `${10 + i * 6}%`, left: `${10 + i * 18}%`,
            animation: `confetti-fall ${1.2 + i * 0.2}s ease-out ${i * 0.1}s both`,
            pointerEvents: 'none',
          }}
        />
      ))}

      <div
        className="w-full max-w-sm rounded-2xl p-8 text-center animate-scale-in"
        style={{
          background: 'rgba(13,21,38,0.97)',
          border: `1px solid ${cfg.color}50`,
          boxShadow: `0 0 60px ${cfg.color}25`,
        }}
      >
        <div className="text-6xl mb-4">{cfg.emoji}</div>
        <h2 className="text-3xl font-black mb-2" style={{ color: cfg.color }}>{cfg.title}</h2>
        <p className="text-sm mb-6" style={{ color: '#94A3B8' }}>{cfg.subtitle}</p>

        <div
          className="rounded-xl p-4 mb-3"
          style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)' }}
        >
          <div className="text-xs font-semibold mb-1 uppercase tracking-wider" style={{ color: '#94A3B8' }}>XP Earned</div>
          <div className="text-3xl font-black" style={{ color: '#A78BFA' }}>+{xpEarned}</div>
        </div>

        <div className="text-xs mb-6 capitalize" style={{ color: '#64748B' }}>
          Difficulty: <span style={{ color: '#94A3B8' }}>{difficulty}</span>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 font-bold py-3 rounded-xl text-sm text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.6)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(124,58,237,0.4)'; }}
          >
            ↩ Play Again
          </button>
          <a
            href="/dashboard"
            className="flex-1 font-bold py-3 rounded-xl text-sm text-white text-center transition-all"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
          >
            🏠 Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PlayAIPage() {
  const { data: user, loading: userLoading } = useUser();
  const navigate = useNavigate();

  const [difficulty, setDifficulty]         = useState(null);
  const [board, setBoard]                   = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer]   = useState("X");
  const [gameState, setGameState]           = useState({ winner: null, winningLine: null });
  const [isThinking, setIsThinking]         = useState(false);
  const [showResult, setShowResult]         = useState(false);
  const [xpEarned, setXpEarned]             = useState(0);

  const gameOverRef    = useRef(false);
  const aiScheduledRef = useRef(false);

  useEffect(() => {
    if (!userLoading && !user) navigate("/account/signin");
  }, [user, userLoading, navigate]);

  useEffect(() => {
    if (gameOverRef.current) return;
    const state = checkGameState(board);
    setGameState(state);

    if (state.winner) {
      if (!gameOverRef.current) {
        gameOverRef.current = true;
        handleGameEnd(state.winner);
      }
    } else if (currentPlayer === "O" && difficulty && !aiScheduledRef.current) {
      const snapshot = [...board];
      aiScheduledRef.current = true;
      const t = setTimeout(() => {
        makeAIMove(snapshot);
        aiScheduledRef.current = false;
      }, 600);
      return () => clearTimeout(t);
    }
  }, [board, currentPlayer, difficulty]);

  const selectDifficulty = (level) => {
    setDifficulty(level);
    resetGame(false);
  };

  const resetGame = (keepDifficulty = true) => {
    setBoard(Array(9).fill(null));
    setCurrentPlayer("X");
    setGameState({ winner: null, winningLine: null });
    setShowResult(false);
    setXpEarned(0);
    gameOverRef.current    = false;
    aiScheduledRef.current = false;
    if (!keepDifficulty) setDifficulty(null);
  };

  const handleCellClick = (index) => {
    if (board[index] || gameState.winner || currentPlayer !== "X" || isThinking) return;
    const nb = [...board];
    nb[index] = "X";
    setBoard(nb);
    setCurrentPlayer("O");
  };

  const makeAIMove = async (currentBoard) => {
    setIsThinking(true);
    const ai     = new TicTacToeAI(difficulty);
    const aiMove = ai.getBestMove([...currentBoard], "O");
    if (aiMove !== null) {
      const nb = [...currentBoard];
      nb[aiMove] = "O";
      setBoard(nb);
      setCurrentPlayer("X");
    }
    setIsThinking(false);
  };

  const handleGameEnd = async (winner) => {
    const result = winner === "X" ? "win" : winner === "draw" ? "draw" : "loss";
    const xp     = calculateXP(result, "ai", difficulty);
    setXpEarned(xp);
    setTimeout(() => setShowResult(true), 700);
    if (!user?.id) return;
    try {
      await fetch("/api/matches/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, mode: "ai", result, xpEarned: xp, difficulty }),
      });
    } catch (err) {
      console.error("Error updating match:", err);
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#050B18' }}>
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: '#7C3AED', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const diffCfg = DIFFICULTIES.find(d => d.id === difficulty);

  return (
    <div className="min-h-screen grid-bg" style={{ background: '#050B18' }}>
      {/* Ambient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'800px', height:'400px', background:'radial-gradient(ellipse, rgba(124,58,237,0.1) 0%, transparent 70%)', filter:'blur(40px)' }} />
      </div>

      {/* Nav */}
      <nav
        className="sticky top-0 z-40"
        style={{ background:'rgba(5,11,24,0.88)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(124,58,237,0.2)' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <TicTacLogo />
            <a
              href="/dashboard"
              className="text-sm font-medium transition-colors"
              style={{ color: '#94A3B8' }}
              onMouseEnter={e => e.currentTarget.style.color = '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.color = '#94A3B8'}
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">

        {/* ── DIFFICULTY SELECTION ── */}
        {!difficulty && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-10">
              <h1 className="text-4xl sm:text-5xl font-black text-white mb-3">
                Play vs <span className="text-gradient-primary">AI</span>
              </h1>
              <p style={{ color: '#94A3B8' }}>Choose your challenge level</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.id}
                  onClick={() => selectDifficulty(d.id)}
                  className="rounded-2xl p-6 text-left transition-all"
                  style={{
                    background: d.bg,
                    border: `1px solid ${d.special ? 'rgba(124,58,237,0.3)' : 'rgba(30,58,138,0.4)'}`,
                    cursor: 'pointer',
                    boxShadow: d.special ? '0 0 20px rgba(124,58,237,0.15)' : 'none',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.border = `1px solid ${d.border}`;
                    e.currentTarget.style.boxShadow = `0 0 25px ${d.glow}`;
                    e.currentTarget.style.transform = 'translateY(-3px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.border = `1px solid ${d.special ? 'rgba(124,58,237,0.3)' : 'rgba(30,58,138,0.4)'}`;
                    e.currentTarget.style.boxShadow = d.special ? '0 0 20px rgba(124,58,237,0.15)' : 'none';
                    e.currentTarget.style.transform = 'none';
                  }}
                >
                  <div className="w-3 h-3 rounded-full mb-3" style={{ background: d.color, boxShadow: `0 0 8px ${d.color}` }} />
                  <div className="font-bold text-white text-lg mb-1">{d.label}</div>
                  <div className="text-sm mb-3" style={{ color: '#94A3B8' }}>{d.desc}</div>
                  <div
                    className="text-xs font-semibold px-2 py-1 rounded-lg inline-block"
                    style={{ background: `${d.color}20`, color: d.color }}
                  >
                    {d.xpNote}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── GAME AREA ── */}
        {difficulty && (
          <div className="animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-black text-white">
                  vs AI — <span style={{ color: diffCfg?.color }}>{diffCfg?.label}</span>
                </h1>
                <p className="text-sm" style={{ color: '#64748B' }}>You are X · AI is O</p>
              </div>
              <button
                onClick={() => { setDifficulty(null); resetGame(false); }}
                className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', color: '#A78BFA' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(124,58,237,0.1)'}
              >
                ↩ Change Difficulty
              </button>
            </div>

            {/* Layout: panels + board */}
            <div className="grid lg:grid-cols-[1fr_2fr_1fr] gap-6 items-start">
              {/* Player */}
              <div className="hidden lg:block">
                <PlayerPanel
                  label="You" symbol="X"
                  isActive={currentPlayer === 'X' && !gameState.winner}
                  isUser username={user?.name || user?.email || 'You'}
                />
              </div>

              {/* Board */}
              <div>
                <GameBoard
                  board={board}
                  onCellClick={handleCellClick}
                  winningLine={gameState.winningLine}
                  currentPlayer={currentPlayer}
                  disabled={isThinking || gameState.winner !== null}
                />

                {isThinking && (
                  <div
                    className="mt-4 flex items-center justify-center gap-3 p-4 rounded-xl"
                    style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}
                  >
                    <ThinkingDots />
                    <span className="text-sm font-medium" style={{ color: '#67E8F9' }}>AI is thinking…</span>
                  </div>
                )}
              </div>

              {/* AI */}
              <div className="hidden lg:block">
                <PlayerPanel
                  label="AI" symbol="O"
                  isActive={currentPlayer === 'O' && !gameState.winner}
                  isUser={false}
                  username={`AI (${diffCfg?.label})`}
                />
              </div>
            </div>

            {/* Mobile panels */}
            <div className="lg:hidden flex gap-3 mt-4">
              <PlayerPanel label="You" symbol="X" isActive={currentPlayer === 'X' && !gameState.winner} isUser username={user?.name || 'You'} />
              <PlayerPanel label="AI" symbol="O" isActive={currentPlayer === 'O' && !gameState.winner} isUser={false} username={`AI (${diffCfg?.label})`} />
            </div>
          </div>
        )}
      </div>

      {/* Result modal */}
      {showResult && (
        <ResultModal
          gameState={gameState}
          xpEarned={xpEarned}
          difficulty={difficulty}
          onPlayAgain={() => resetGame()}
        />
      )}
    </div>
  );
}
