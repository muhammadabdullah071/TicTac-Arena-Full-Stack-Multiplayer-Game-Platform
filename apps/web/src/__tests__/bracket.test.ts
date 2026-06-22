import { describe, it, expect } from "vitest";
import { generateBracket, advanceWinner, getTournamentWinner } from "@/lib/bracket";

describe("generateBracket", () => {
  it("generates correct number of rounds for 8 players", () => {
    const players = Array.from({ length: 8 }, (_, i) => `player-${i}`);
    const bracket = generateBracket(players, players);
    expect(bracket.rounds.length).toBe(3);
    expect(bracket.maxRound).toBe(3);
    expect(bracket.rounds[0].length).toBe(4);
    expect(bracket.rounds[1].length).toBe(2);
    expect(bracket.rounds[2].length).toBe(1);
  });

  it("generates correct rounds for 16 players", () => {
    const players = Array.from({ length: 16 }, (_, i) => `player-${i}`);
    const bracket = generateBracket(players, players);
    expect(bracket.rounds.length).toBe(4);
    expect(bracket.rounds[0].length).toBe(8);
    expect(bracket.rounds[3].length).toBe(1);
  });

  it("handles non-power-of-2 player counts with byes", () => {
    const players = Array.from({ length: 5 }, (_, i) => `player-${i}`);
    const bracket = generateBracket(players, players);
    const byes = bracket.rounds[0].filter((m) => m.bye);
    expect(byes.length).toBeGreaterThan(0);
  });

  it("assigns player ids to first round", () => {
    const players = ["alice", "bob", "charlie", "dave"];
    const bracket = generateBracket(players, players);
    const firstRound = bracket.rounds[0];
    expect(firstRound[0].player1Id).toBe("alice");
    expect(firstRound[0].player2Id).toBe("bob");
    expect(firstRound[1].player1Id).toBe("charlie");
    expect(firstRound[1].player2Id).toBe("dave");
  });
});

describe("advanceWinner", () => {
  it("advances winner to next round match", () => {
    const players = ["alice", "bob", "charlie", "dave"];
    const bracket = generateBracket(players, players);

    const updated = advanceWinner(bracket, 1, 0, "alice", "alice", "match-1");
    expect(updated.rounds[0][0].completed).toBe(true);
    expect(updated.rounds[0][0].winnerId).toBe("alice");
    expect(updated.rounds[1][0].player1Id).toBe("alice");
  });

  it("tracks match ID on completed matches", () => {
    const players = ["alice", "bob", "charlie", "dave"];
    const bracket = generateBracket(players, players);

    const updated = advanceWinner(bracket, 1, 0, "alice", "alice", "match-abc");
    expect(updated.rounds[0][0].matchId).toBe("match-abc");
  });
});

describe("getTournamentWinner", () => {
  it("returns null when final match incomplete", () => {
    const players = ["alice", "bob"];
    const bracket = generateBracket(players, players);
    expect(getTournamentWinner(bracket)).toBeNull();
  });

  it("returns winner when final match is complete", () => {
    const players = ["alice", "bob"];
    const bracket = generateBracket(players, players);
    const updated = advanceWinner(bracket, 1, 0, "alice", "alice", "final");
    const winner = getTournamentWinner(updated);
    expect(winner?.userId).toBe("alice");
  });
});
