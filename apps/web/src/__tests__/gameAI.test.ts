import { describe, it, expect } from "vitest";
import { checkGameState, calculateELO, calculateXP, TicTacToeAI } from "@/lib/gameAI";

describe("checkGameState", () => {
  it("returns null winner for empty board", () => {
    const board = Array(9).fill(null);
    expect(checkGameState(board)).toEqual({ winner: null, winningLine: null });
  });

  it("detects X winning via top row", () => {
    const board = ["X", "X", "X", null, "O", null, "O", null, null];
    expect(checkGameState(board)).toEqual({ winner: "X", winningLine: [0, 1, 2] });
  });

  it("detects O winning via diagonal", () => {
    const board = ["O", "X", null, null, "O", "X", null, null, "O"];
    expect(checkGameState(board)).toEqual({ winner: "O", winningLine: [0, 4, 8] });
  });

  it("detects draw", () => {
    const board = ["X", "O", "X", "X", "O", "O", "O", "X", "X"];
    expect(checkGameState(board)).toEqual({ winner: "draw", winningLine: null });
  });

  it("returns null for in-progress game", () => {
    const board = ["X", null, "O", null, "X", null, null, null, null];
    expect(checkGameState(board)).toEqual({ winner: null, winningLine: null });
  });
});

describe("calculateELO", () => {
  it("returns positive change for win against equal opponent", () => {
    const change = calculateELO(1000, 1000, "win");
    expect(change).toBeGreaterThan(0);
    expect(change).toBe(16);
  });

  it("returns negative change for loss against equal opponent", () => {
    const change = calculateELO(1000, 1000, "loss");
    expect(change).toBeLessThan(0);
    expect(change).toBe(-16);
  });

  it("gains less ELO beating a lower-rated opponent", () => {
    const highVsLow = calculateELO(2000, 1000, "win");
    const equal = calculateELO(1000, 1000, "win");
    expect(highVsLow).toBeLessThan(equal);
  });

  it("gains more ELO beating a higher-rated opponent", () => {
    const lowVsHigh = calculateELO(1000, 2000, "win");
    const equal = calculateELO(1000, 1000, "win");
    expect(lowVsHigh).toBeGreaterThan(equal);
  });
});

describe("calculateXP", () => {
  it("awards more XP for ranked wins", () => {
    const casualXP = calculateXP("win", "casual");
    const rankedXP = calculateXP("win", "ranked");
    expect(rankedXP).toBeGreaterThan(casualXP);
  });

  it("awards less XP for losses", () => {
    const winXP = calculateXP("win", "casual");
    const lossXP = calculateXP("loss", "casual");
    expect(lossXP).toBeLessThan(winXP);
  });

  it("awards half XP for draws in casual", () => {
    const winXP = calculateXP("win", "casual");
    const drawXP = calculateXP("draw", "casual");
    expect(drawXP).toBe(Math.floor(winXP * 0.25));
  });
});

describe("TicTacToeAI", () => {
  it("returns a valid move on empty board", () => {
    const ai = new TicTacToeAI("impossible");
    const board = Array(9).fill(null);
    const move = ai.getBestMove(board, "X");
    expect(move).toBeGreaterThanOrEqual(0);
    expect(move).toBeLessThanOrEqual(8);
  });

  it("takes winning move when available", () => {
    const ai = new TicTacToeAI("impossible");
    const board = ["X", "X", null, "O", "O", null, null, null, null];
    const move = ai.getBestMove(board, "X");
    expect(move).toBe(2);
  });

  it("blocks opponent winning move", () => {
    const ai = new TicTacToeAI("impossible");
    const board = ["O", "O", null, "X", null, null, null, null, null];
    const move = ai.getBestMove(board, "X");
    expect(move).toBe(2);
  });
});
