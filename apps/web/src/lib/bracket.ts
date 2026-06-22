export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  player1Id?: string;
  player1Username?: string;
  player2Id?: string;
  player2Username?: string;
  winnerId?: string;
  matchId?: string;
  completed: boolean;
  bye: boolean;
}

export interface Bracket {
  rounds: BracketMatch[][];
  maxRound: number;
  totalPlayers: number;
}

export function generateBracket(playerIds: string[], playerUsernames: string[]): Bracket {
  const total = playerIds.length;
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(total)));
  const rounds = Math.log2(nextPow2);
  const byes = nextPow2 - total;

  const bracket: Bracket = {
    rounds: [],
    maxRound: rounds,
    totalPlayers: total,
  };

  const firstRound: BracketMatch[] = [];
  let idx = 0;
  for (let i = 0; i < nextPow2 / 2; i++) {
    const p1 = idx < total ? idx : null;
    const p2 = idx + 1 < total ? idx + 1 : null;
    const isBye = p1 !== null && p2 === null;

    firstRound.push({
      id: `r1-m${i}`,
      round: 1,
      position: i,
      player1Id: p1 !== null ? playerIds[p1] : undefined,
      player1Username: p1 !== null ? playerUsernames[p1] : undefined,
      player2Id: p2 !== null ? playerIds[p2] : undefined,
      player2Username: p2 !== null ? playerUsernames[p2] : undefined,
      completed: isBye,
      winnerId: isBye ? playerIds[p1!] : undefined,
      matchId: isBye ? `bye-${i}` : undefined,
      bye: isBye,
    });
    idx += 2;
  }
  bracket.rounds.push(firstRound);

  for (let r = 2; r <= rounds; r++) {
    const matchesInRound = nextPow2 / Math.pow(2, r);
    const round: BracketMatch[] = [];
    for (let i = 0; i < matchesInRound; i++) {
      round.push({
        id: `r${r}-m${i}`,
        round: r,
        position: i,
        completed: false,
        bye: false,
      });
    }
    bracket.rounds.push(round);
  }

  return bracket;
}

export function advanceWinner(
  bracket: Bracket,
  round: number,
  position: number,
  winnerId: string,
  winnerUsername: string,
  matchId: string,
): Bracket {
  const updated = JSON.parse(JSON.stringify(bracket)) as Bracket;

  const currentMatch = updated.rounds[round - 1]?.[position];
  if (currentMatch) {
    currentMatch.completed = true;
    currentMatch.winnerId = winnerId;
    currentMatch.matchId = matchId;
  }

  const nextRound = round;
  const nextPosition = Math.floor(position / 2);
  const nextMatch = updated.rounds[nextRound]?.[nextPosition];

  if (nextMatch) {
    if (position % 2 === 0) {
      nextMatch.player1Id = winnerId;
      nextMatch.player1Username = winnerUsername;
    } else {
      nextMatch.player2Id = winnerId;
      nextMatch.player2Username = winnerUsername;
    }

    if (nextMatch.player1Id && nextMatch.player2Id && nextMatch.player1Id === "bye") {
      nextMatch.bye = true;
      const realWinner = nextMatch.player1Id === "bye" ? nextMatch.player2Id! : nextMatch.player1Id!;
      nextMatch.completed = true;
      nextMatch.winnerId = realWinner;
    }
  }

  return updated;
}

export function getTournamentWinner(bracket: Bracket): { userId: string; username: string } | null {
  const finalRound = bracket.rounds[bracket.rounds.length - 1];
  if (!finalRound || finalRound.length === 0) return null;
  const finalMatch = finalRound[0];
  if (!finalMatch.completed || !finalMatch.winnerId) return null;
  return {
    userId: finalMatch.winnerId,
    username: finalMatch.player1Username === finalMatch.winnerId
      ? finalMatch.player1Username!
      : finalMatch.player2Username!,
  };
}
