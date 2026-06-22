import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { getRankFromELO } from "@/lib/gameAI";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId, mode, result, xpEarned, difficulty, eloChange = 0 } = body;

    if (userId !== session.user.id) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      const profileResult =
        await sql`SELECT * FROM profiles WHERE id = ${userId}`;

      // If no DB or profile not found, return mock response
      if (profileResult.length === 0) {
        const coinsEarned = result === "win" ? 25 : result === "draw" ? 10 : 5;
        const bonusCoins = mode === "ranked" && result === "win" ? 15 : 0;
        return Response.json({
          profile: {
            id: userId,
            xp: xpEarned,
            level: 1,
            elo: 1000 + (mode === "ranked" ? eloChange : 0),
            rank: "Bronze",
            coins: coinsEarned + bonusCoins,
            total_matches: 1,
            total_wins: result === "win" ? 1 : 0,
            total_losses: result === "loss" ? 1 : 0,
            total_draws: result === "draw" ? 1 : 0,
            win_streak: result === "win" ? 1 : 0,
            highest_streak: result === "win" ? 1 : 0,
          },
          xpEarned,
          coinsEarned: coinsEarned + bonusCoins,
          levelUp: false,
          rankUp: false,
        });
      }

      const profile = profileResult[0];
      const newXP = profile.xp + xpEarned;
      const newLevel = Math.floor(newXP / 1000) + 1;
      const newElo =
        mode === "ranked" ? Math.max(100, profile.elo + eloChange) : profile.elo;
      const newRank = getRankFromELO(newElo);

      let newWinStreak = profile.win_streak;
      let newHighestStreak = profile.highest_streak;
      let newTotalWins = profile.total_wins;
      let newTotalLosses = profile.total_losses;
      let newTotalDraws = profile.total_draws;

      if (result === "win") {
        newWinStreak += 1;
        newTotalWins += 1;
        if (newWinStreak > newHighestStreak) newHighestStreak = newWinStreak;
      } else if (result === "loss") {
        newWinStreak = 0;
        newTotalLosses += 1;
      } else if (result === "draw") {
        newWinStreak = 0;
        newTotalDraws += 1;
      }

      const newTotalMatches = profile.total_matches + 1;

      // Coin rewards
      const coinsEarned = result === "win" ? 25 : result === "draw" ? 10 : 5;
      const bonusCoins = mode === "ranked" && result === "win" ? 15 : 0;
      const totalCoins = coinsEarned + bonusCoins;

      const updatedProfile = await sql`
        UPDATE profiles SET
          xp = ${newXP},
          level = ${newLevel},
          elo = ${newElo},
          rank = ${newRank},
          win_streak = ${newWinStreak},
          highest_streak = ${newHighestStreak},
          total_matches = ${newTotalMatches},
          total_wins = ${newTotalWins},
          total_losses = ${newTotalLosses},
          total_draws = ${newTotalDraws},
          coins = coins + ${totalCoins},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${userId}
        RETURNING *
      `;

      // Create match record
      const matchMode = mode === "ai" ? "ai" : mode;
      await sql`
        INSERT INTO matches (mode, status, player_x_id, difficulty, board_state, xp_awarded, elo_change, finished_at)
        VALUES (${matchMode}, 'finished', ${userId}, ${difficulty || null}, ${JSON.stringify([])}, ${xpEarned}, ${eloChange}, CURRENT_TIMESTAMP)
      `;

      // Log transactions
      if (xpEarned > 0) {
        await sql`INSERT INTO transactions (user_id, type, amount, currency, description) VALUES (${userId}, 'earn', ${xpEarned}, 'xp', ${`Match ${result}: ${mode} mode`})`;
      }
      await sql`INSERT INTO transactions (user_id, type, amount, currency, description) VALUES (${userId}, 'earn', ${totalCoins}, 'coins', ${`Match ${result}: ${mode} mode`})`;

      // Update mission progress
      try {
        const now = new Date().toISOString();
        const userMissions = await sql`
          SELECT um.id, m.requirement_type, m.requirement_value
          FROM user_missions um
          JOIN missions m ON m.id = um.mission_id
          WHERE um.user_id = ${userId} AND um.completed = false AND um.expires_at > ${now}
        `;

        for (const um of userMissions) {
          let shouldIncrement = false;
          switch (um.requirement_type) {
            case "play_games":
              shouldIncrement = true;
              break;
            case "win_games":
              shouldIncrement = result === "win";
              break;
            case "win_ranked":
              shouldIncrement = result === "win" && mode === "ranked";
              break;
            case "beat_hard_ai":
              shouldIncrement =
                result === "win" &&
                mode === "ai" &&
                ["hard", "impossible"].includes(difficulty);
              break;
            case "beat_impossible_ai":
              shouldIncrement =
                result === "win" && mode === "ai" && difficulty === "impossible";
              break;
            default:
              break;
          }
          if (shouldIncrement) {
            const newProgress = (um.progress || 0) + 1;
            const completed = newProgress >= um.requirement_value;
            await sql`UPDATE user_missions SET progress = ${newProgress}, completed = ${completed}, completed_at = ${completed ? now : null} WHERE id = ${um.id}`;
          }
        }
      } catch (e) {
        console.error("Mission update error:", e);
      }

      // Check achievements
      try {
        const achievementChecks = [
          {
            name: "First Victory",
            condition: result === "win" && newTotalWins >= 1,
          },
          { name: "10 Wins", condition: newTotalWins >= 10 },
          { name: "100 Wins", condition: newTotalWins >= 100 },
          { name: "500 Wins", condition: newTotalWins >= 500 },
          { name: "1000 Wins", condition: newTotalWins >= 1000 },
          { name: "Win Streak 5", condition: newWinStreak >= 5 },
          { name: "Win Streak 10", condition: newWinStreak >= 10 },
          { name: "Win Streak 20", condition: newWinStreak >= 20 },
          {
            name: "Ranked Warrior",
            condition: newTotalMatches >= 50 && mode === "ranked",
          },
          { name: "Level 10", condition: newLevel >= 10 },
          { name: "Level 25", condition: newLevel >= 25 },
          { name: "Level 50", condition: newLevel >= 50 },
        ];

        for (const check of achievementChecks) {
          if (check.condition) {
            const achievement =
              await sql`SELECT id, xp_reward, coin_reward FROM achievements WHERE name = ${check.name}`;
            if (achievement.length > 0) {
              const exists =
                await sql`SELECT 1 FROM user_achievements WHERE user_id = ${userId} AND achievement_id = ${achievement[0].id}`;
              if (exists.length === 0) {
                await sql`INSERT INTO user_achievements (user_id, achievement_id) VALUES (${userId}, ${achievement[0].id}) ON CONFLICT DO NOTHING`;
                const xpR = achievement[0].xp_reward || 0;
                const coinR = achievement[0].coin_reward || 0;
                if (xpR > 0 || coinR > 0) {
                  await sql`UPDATE profiles SET xp = xp + ${xpR}, coins = coins + ${coinR} WHERE id = ${userId}`;
                }
              }
            }
          }
        }
      } catch (e) {
        console.error("Achievement check error:", e);
      }

      return Response.json({
        profile: updatedProfile[0],
        xpEarned,
        coinsEarned: totalCoins,
        levelUp: newLevel > profile.level,
        rankUp: newRank !== profile.rank,
      });
    } catch (dbError) {
      console.warn("DB unavailable, returning mock match complete:", dbError.message);
      const coinsEarned = result === "win" ? 25 : result === "draw" ? 10 : 5;
      const bonusCoins = mode === "ranked" && result === "win" ? 15 : 0;
      return Response.json({
        profile: {
          id: userId,
          xp: xpEarned,
          level: 1,
          elo: 1000 + (mode === "ranked" ? eloChange : 0),
          rank: "Bronze",
          coins: coinsEarned + bonusCoins,
          total_matches: 1,
          total_wins: result === "win" ? 1 : 0,
          total_losses: result === "loss" ? 1 : 0,
          total_draws: result === "draw" ? 1 : 0,
          win_streak: result === "win" ? 1 : 0,
          highest_streak: result === "win" ? 1 : 0,
        },
        xpEarned,
        coinsEarned: coinsEarned + bonusCoins,
        levelUp: false,
        rankUp: false,
      });
    }
  } catch (error) {
    console.error("Error completing match:", error);
    return Response.json(
      { error: "Failed to complete match" },
      { status: 500 },
    );
  }
}
