import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const achievements = [
    { name: "First Victory", description: "Win your first match", iconKey: "trophy", xpReward: 100, coinReward: 50 },
    { name: "10 Wins", description: "Win 10 matches", iconKey: "trophy_x10", xpReward: 500, coinReward: 200 },
    { name: "100 Wins", description: "Win 100 matches", iconKey: "trophy_x100", xpReward: 2000, coinReward: 1000 },
    { name: "500 Wins", description: "Win 500 matches", iconKey: "trophy_x500", xpReward: 5000, coinReward: 2500 },
    { name: "1000 Wins", description: "Win 1000 matches", iconKey: "trophy_legendary", xpReward: 10000, coinReward: 5000 },
    { name: "Win Streak 5", description: "Win 5 matches in a row", iconKey: "streak_5", xpReward: 200, coinReward: 100 },
    { name: "Win Streak 10", description: "Win 10 matches in a row", iconKey: "streak_10", xpReward: 500, coinReward: 250 },
    { name: "Win Streak 20", description: "Win 20 matches in a row", iconKey: "streak_20", xpReward: 2000, coinReward: 1000 },
    { name: "Ranked Warrior", description: "Play 50 ranked matches", iconKey: "ranked", xpReward: 1000, coinReward: 500 },
    { name: "Level 10", description: "Reach level 10", iconKey: "level_10", xpReward: 500, coinReward: 200 },
    { name: "Level 25", description: "Reach level 25", iconKey: "level_25", xpReward: 2000, coinReward: 1000 },
    { name: "Level 50", description: "Reach level 50", iconKey: "level_50", xpReward: 5000, coinReward: 2500 },
    { name: "AI Slayer", description: "Beat the AI on impossible difficulty", iconKey: "ai_slayer", xpReward: 300, coinReward: 150 },
    { name: "Legendary Status", description: "Reach Legend rank", iconKey: "legend", xpReward: 10000, coinReward: 5000 },
    { name: "Tournament Champion", description: "Win a tournament", iconKey: "tournament_champ", xpReward: 2000, coinReward: 1000 },
    { name: "Ultimate Master", description: "Win an Ultimate TicTacToe match", iconKey: "ultimate", xpReward: 300, coinReward: 150 },
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: {},
      create: achievement,
    });
  }

  const cosmetics = [
    { name: "Classic Dark", type: "theme" as const, price: 0, config: { bg: "#0B1120", cell: "#1F2937", x_color: "#6D28D9", o_color: "#22D3EE" } },
    { name: "Forest Green", type: "theme" as const, price: 500, config: { bg: "#064E3B", cell: "#065F46", x_color: "#A7F3D0", o_color: "#6EE7B7" } },
    { name: "Ocean Blue", type: "theme" as const, price: 500, config: { bg: "#0C4A6E", cell: "#0E5D8A", x_color: "#7DD3FC", o_color: "#38BDF8" } },
    { name: "Sunset Red", type: "theme" as const, price: 800, config: { bg: "#451A03", cell: "#5C2104", x_color: "#FDBA74", o_color: "#FB923C" } },
    { name: "Midnight Purple", type: "theme" as const, price: 1000, config: { bg: "#1E1B4B", cell: "#2E1065", x_color: "#C4B5FD", o_color: "#A78BFA" } },
    { name: "Gold Frame", type: "frame" as const, price: 300, config: { color: "#FFD700" } },
    { name: "Ruby Frame", type: "frame" as const, price: 300, config: { color: "#EF4444" } },
    { name: "Sapphire Frame", type: "frame" as const, price: 300, config: { color: "#3B82F6" } },
    { name: "Emerald Frame", type: "frame" as const, price: 300, config: { color: "#22C55E" } },
    { name: "Diamond Frame", type: "frame" as const, price: 1000, config: { color: "#B9F2FF" } },
    { name: "Victory Explosion", type: "animation" as const, price: 500, config: { effect: "explosion" } },
    { name: "Galaxy Swirl", type: "animation" as const, price: 800, config: { effect: "galaxy" } },
    { name: "Rainbow Wave", type: "animation" as const, price: 1000, config: { effect: "rainbow" } },
  ];

  for (const cosmetic of cosmetics) {
    await prisma.cosmetic.create({ data: cosmetic });
  }

  const missions = [
    { title: "Play 3 Games", description: "Play 3 matches in any mode", type: "daily" as const, requirementType: "play_games" as const, requirementValue: 3, xpReward: 50, coinReward: 25 },
    { title: "Win 2 Games", description: "Win 2 matches in any mode", type: "daily" as const, requirementType: "win_games" as const, requirementValue: 2, xpReward: 80, coinReward: 40 },
    { title: "Win a Ranked Match", description: "Win 1 ranked match", type: "daily" as const, requirementType: "win_ranked" as const, requirementValue: 1, xpReward: 100, coinReward: 50 },
    { title: "Win 10 Games", description: "Win 10 matches in any mode", type: "weekly" as const, requirementType: "win_games" as const, requirementValue: 10, xpReward: 300, coinReward: 150 },
    { title: "Play 20 Games", description: "Play 20 matches in any mode", type: "weekly" as const, requirementType: "play_games" as const, requirementValue: 20, xpReward: 200, coinReward: 100 },
    { title: "Win 5 Ranked", description: "Win 5 ranked matches", type: "weekly" as const, requirementType: "win_ranked" as const, requirementValue: 5, xpReward: 400, coinReward: 200 },
    { title: "Beat Hard AI", description: "Beat the AI on hard or impossible", type: "weekly" as const, requirementType: "beat_hard_ai" as const, requirementValue: 1, xpReward: 250, coinReward: 125 },
  ];

  for (const mission of missions) {
    await prisma.mission.create({ data: mission });
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
