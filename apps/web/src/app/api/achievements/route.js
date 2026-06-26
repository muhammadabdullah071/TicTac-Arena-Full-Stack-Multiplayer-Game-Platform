import sql from "@/app/api/utils/sql";
import { getSession } from "@/app/api/utils/session";

const BUILT_IN_ACHIEVEMENTS = [
  { id: '1', name: 'First Victory', description: 'Win your first game', xp_reward: 100, coin_reward: 50, unlocked: false, unlocked_at: null },
  { id: '2', name: '10 Wins', description: 'Win 10 games', xp_reward: 200, coin_reward: 100, unlocked: false, unlocked_at: null },
  { id: '3', name: '100 Wins', description: 'Win 100 games', xp_reward: 500, coin_reward: 250, unlocked: false, unlocked_at: null },
  { id: '4', name: '500 Wins', description: 'Win 500 games', xp_reward: 1000, coin_reward: 500, unlocked: false, unlocked_at: null },
  { id: '5', name: '1000 Wins', description: 'Win 1000 games', xp_reward: 2000, coin_reward: 1000, unlocked: false, unlocked_at: null },
  { id: '6', name: 'Win Streak 5', description: 'Win 5 games in a row', xp_reward: 150, coin_reward: 75, unlocked: false, unlocked_at: null },
  { id: '7', name: 'Win Streak 10', description: 'Win 10 games in a row', xp_reward: 300, coin_reward: 150, unlocked: false, unlocked_at: null },
  { id: '8', name: 'Win Streak 20', description: 'Win 20 games in a row', xp_reward: 600, coin_reward: 300, unlocked: false, unlocked_at: null },
  { id: '9', name: 'Ranked Warrior', description: 'Play 50 ranked games', xp_reward: 400, coin_reward: 200, unlocked: false, unlocked_at: null },
  { id: '10', name: 'Level 10', description: 'Reach level 10', xp_reward: 200, coin_reward: 100, unlocked: false, unlocked_at: null },
  { id: '11', name: 'Level 25', description: 'Reach level 25', xp_reward: 500, coin_reward: 250, unlocked: false, unlocked_at: null },
  { id: '12', name: 'Level 50', description: 'Reach level 50', xp_reward: 1000, coin_reward: 500, unlocked: false, unlocked_at: null },
];

export async function GET(request) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId") || userId;

    // Get all achievements with user unlock status
    const achievements = await sql`
      SELECT 
        a.*,
        ua.unlocked_at,
        CASE WHEN ua.achievement_id IS NOT NULL THEN true ELSE false END as unlocked
      FROM achievements a
      LEFT JOIN user_achievements ua ON ua.achievement_id = a.id AND ua.user_id = ${targetUserId}
      ORDER BY 
        CASE WHEN ua.achievement_id IS NOT NULL THEN 0 ELSE 1 END,
        ua.unlocked_at DESC NULLS LAST,
        a.xp_reward DESC
    `;

    // Use built-in list if DB returns nothing
    const achievementList = achievements.length > 0 ? achievements : BUILT_IN_ACHIEVEMENTS;

    const stats = {
      total: achievementList.length,
      unlocked: achievementList.filter((a) => a.unlocked).length,
      totalXP: achievementList
        .filter((a) => a.unlocked)
        .reduce((s, a) => s + (a.xp_reward || 0), 0),
      totalCoins: achievementList
        .filter((a) => a.unlocked)
        .reduce((s, a) => s + (a.coin_reward || 0), 0),
    };

    return Response.json({ achievements: achievementList, stats });
  } catch (error) {
    console.error("Achievements error:", error);
    // Return built-in achievements for demo mode
    const stats = {
      total: BUILT_IN_ACHIEVEMENTS.length,
      unlocked: 0,
      totalXP: 0,
      totalCoins: 0,
    };
    return Response.json({ achievements: BUILT_IN_ACHIEVEMENTS, stats });
  }
}
