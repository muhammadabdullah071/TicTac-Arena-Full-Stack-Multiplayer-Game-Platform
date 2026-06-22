// Minimax AI for Tic-Tac-Toe with Alpha-Beta Pruning

export class TicTacToeAI {
  constructor(difficulty = "impossible") {
    this.difficulty = difficulty;
  }

  // Main function to get the best move
  getBestMove(board, player) {
    const opponent = player === "X" ? "O" : "X";

    // Difficulty-based randomness
    if (this.difficulty === "easy" && Math.random() < 0.7) {
      return this.getRandomMove(board);
    }

    if (this.difficulty === "medium" && Math.random() < 0.4) {
      return this.getRandomMove(board);
    }

    if (this.difficulty === "hard" && Math.random() < 0.15) {
      return this.getRandomMove(board);
    }

    // For impossible difficulty, always use minimax
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        board[i] = player;
        const score = this.minimax(
          board,
          0,
          false,
          player,
          opponent,
          -Infinity,
          Infinity,
        );
        board[i] = null;

        if (score > bestScore) {
          bestScore = score;
          bestMove = i;
        }
      }
    }

    return bestMove !== null ? bestMove : this.getRandomMove(board);
  }

  // Minimax algorithm with alpha-beta pruning
  minimax(board, depth, isMaximizing, player, opponent, alpha, beta) {
    const result = this.checkWinner(board);

    if (result === player) return 10 - depth;
    if (result === opponent) return depth - 10;
    if (this.isBoardFull(board)) return 0;

    if (isMaximizing) {
      let bestScore = -Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = player;
          const score = this.minimax(
            board,
            depth + 1,
            false,
            player,
            opponent,
            alpha,
            beta,
          );
          board[i] = null;
          bestScore = Math.max(score, bestScore);
          alpha = Math.max(alpha, score);
          if (beta <= alpha) break; // Alpha-beta pruning
        }
      }
      return bestScore;
    } else {
      let bestScore = Infinity;
      for (let i = 0; i < 9; i++) {
        if (board[i] === null) {
          board[i] = opponent;
          const score = this.minimax(
            board,
            depth + 1,
            true,
            player,
            opponent,
            alpha,
            beta,
          );
          board[i] = null;
          bestScore = Math.min(score, bestScore);
          beta = Math.min(beta, score);
          if (beta <= alpha) break; // Alpha-beta pruning
        }
      }
      return bestScore;
    }
  }

  // Check for a winner
  checkWinner(board) {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8], // Rows
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8], // Columns
      [0, 4, 8],
      [2, 4, 6], // Diagonals
    ];

    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
    }

    return null;
  }

  // Check if board is full
  isBoardFull(board) {
    return board.every((cell) => cell !== null);
  }

  // Get a random available move
  getRandomMove(board) {
    const availableMoves = [];
    for (let i = 0; i < 9; i++) {
      if (board[i] === null) {
        availableMoves.push(i);
      }
    }
    return availableMoves.length > 0
      ? availableMoves[Math.floor(Math.random() * availableMoves.length)]
      : null;
  }
}

// Utility function to check game state
export function checkGameState(board) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8], // Rows
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8], // Columns
    [0, 4, 8],
    [2, 4, 6], // Diagonals
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], winningLine: pattern };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: "draw", winningLine: null };
  }

  return { winner: null, winningLine: null };
}

// Calculate XP reward based on match outcome
export function calculateXP(result, mode, difficulty = null) {
  const baseXP = {
    ranked: 50,
    casual: 25,
    ai: 30,
    tournament: 100,
    ultimate: 75,
  };

  let xp = baseXP[mode] || 25;

  if (result === "win") {
    xp *= 2;
  } else if (result === "draw") {
    xp *= 0.5;
  } else {
    xp *= 0.2;
  }

  // AI difficulty multiplier
  if (mode === "ai" && difficulty) {
    const difficultyMultiplier = {
      easy: 0.5,
      medium: 1,
      hard: 1.5,
      impossible: 2,
    };
    xp *= difficultyMultiplier[difficulty] || 1;
  }

  return Math.floor(xp);
}

// Calculate ELO change
export function calculateELO(playerELO, opponentELO, result) {
  const K = 32; // K-factor
  const expectedScore = 1 / (1 + Math.pow(10, (opponentELO - playerELO) / 400));

  const actualScore = result === "win" ? 1 : result === "draw" ? 0.5 : 0;
  const eloChange = Math.round(K * (actualScore - expectedScore));

  return eloChange;
}

// Determine rank based on ELO
export function getRankFromELO(elo) {
  if (elo >= 2400) return "Legend";
  if (elo >= 2000) return "Master";
  if (elo >= 1700) return "Diamond";
  if (elo >= 1400) return "Platinum";
  if (elo >= 1100) return "Gold";
  if (elo >= 800) return "Silver";
  return "Bronze";
}
