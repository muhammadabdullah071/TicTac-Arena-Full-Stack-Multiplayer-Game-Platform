import { prisma } from "@tictac/database";

export interface SeasonConfig {
  daysPerSeason: number;
  softEloReset: number;
  rankDecayAfterDays: number;
  rankDecayAmount: number;
}

const DEFAULT_CONFIG: SeasonConfig = {
  daysPerSeason: 90,
  softEloReset: 300,
  rankDecayAfterDays: 14,
  rankDecayAmount: 25,
};

export async function getCurrentSeason() {
  const now = new Date();
  return prisma.season.findFirst({
    where: {
      status: "active",
      startDate: { lte: now },
      endDate: { gte: now },
    },
  });
}

export async function createNewSeason(name: string, number: number, startDate: Date, endDate: Date) {
  return prisma.season.create({
    data: { name, number, status: "active", startDate, endDate },
  });
}

export async function completeSeason(seasonId: string) {
  const season = await prisma.season.findUnique({
    where: { id: seasonId },
    include: { leaderboards: { orderBy: { elo: "desc" }, take: 100 } },
  });
  if (!season) return;

  await prisma.season.update({
    where: { id: seasonId },
    data: { status: "completed", rewards: { top100: true, top10: true, champion: true } },
  });

  const profiles = await prisma.profile.findMany({
    where: { id: { in: season.leaderboards.map((e) => e.userId) } },
  });

  for (const entry of season.leaderboards) {
    const profile = profiles.find((p) => p.id === entry.userId);
    if (!profile) continue;
    const newElo = Math.max(100, profile.elo - DEFAULT_CONFIG.softEloReset);
    await prisma.profile.update({
      where: { id: entry.userId },
      data: { elo: newElo, rank: getRankFromElo(newElo) },
    });
  }
}

export async function applyRankDecay() {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - DEFAULT_CONFIG.rankDecayAfterDays);

  const inactivePlayers = await prisma.profile.findMany({
    where: {
      updatedAt: { lt: cutoff },
      elo: { gt: 1000 },
      role: "player",
    },
  });

  for (const player of inactivePlayers) {
    const decayedElo = Math.max(100, player.elo - DEFAULT_CONFIG.rankDecayAmount);
    await prisma.profile.update({
      where: { id: player.id },
      data: { elo: decayedElo, rank: getRankFromElo(decayedElo) },
    });
  }
}

function getRankFromElo(elo: number): string {
  if (elo >= 2400) return "Legend";
  if (elo >= 2000) return "Master";
  if (elo >= 1700) return "Diamond";
  if (elo >= 1400) return "Platinum";
  if (elo >= 1100) return "Gold";
  if (elo >= 800) return "Silver";
  return "Bronze";
}
