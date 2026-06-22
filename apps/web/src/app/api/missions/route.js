import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Auto-assign missions if user doesn't have active ones
    await ensureUserMissions(userId);

    const now = new Date().toISOString();

    const missions = await sql`
      SELECT um.*, m.title, m.description, m.type, m.requirement_type,
        m.requirement_value, m.xp_reward, m.coin_reward
      FROM user_missions um
      JOIN missions m ON m.id = um.mission_id
      WHERE um.user_id = ${userId}
        AND um.expires_at > ${now}
      ORDER BY m.type ASC, um.completed ASC, m.xp_reward DESC
    `;

    return Response.json({ missions });
  } catch (error) {
    console.error("Missions error:", error);
    return Response.json({ error: "Failed to get missions" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action, missionId } = body;

    if (action === "claim") {
      const missions = await sql`
        SELECT um.*, m.xp_reward, m.coin_reward
        FROM user_missions um
        JOIN missions m ON m.id = um.mission_id
        WHERE um.id = ${missionId} AND um.user_id = ${userId}
          AND um.completed = true AND um.claimed = false
      `;

      if (missions.length === 0) {
        return Response.json(
          { error: "Mission not found or not claimable" },
          { status: 400 },
        );
      }

      const mission = missions[0];

      // Grant rewards
      await sql`
        UPDATE profiles SET
          xp = xp + ${mission.xp_reward},
          coins = coins + ${mission.coin_reward},
          level = GREATEST(level, FLOOR((xp + ${mission.xp_reward}) / 1000) + 1)
        WHERE id = ${userId}
      `;

      await sql`UPDATE user_missions SET claimed = true WHERE id = ${missionId}`;

      // Log transactions
      if (mission.xp_reward > 0) {
        await sql`
          INSERT INTO transactions (user_id, type, amount, currency, description)
          VALUES (${userId}, 'reward', ${mission.xp_reward}, 'xp', 'Mission reward')
        `;
      }
      if (mission.coin_reward > 0) {
        await sql`
          INSERT INTO transactions (user_id, type, amount, currency, description)
          VALUES (${userId}, 'reward', ${mission.coin_reward}, 'coins', 'Mission reward')
        `;
      }

      return Response.json({
        success: true,
        xpEarned: mission.xp_reward,
        coinsEarned: mission.coin_reward,
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Missions POST error:", error);
    return Response.json(
      { error: "Failed to process mission action" },
      { status: 500 },
    );
  }
}

async function ensureUserMissions(userId) {
  const now = new Date();
  const dailyExpiry = new Date(now);
  dailyExpiry.setHours(23, 59, 59, 999);

  const weeklyExpiry = new Date(now);
  const dayOfWeek = now.getDay();
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  weeklyExpiry.setDate(weeklyExpiry.getDate() + daysUntilSunday);
  weeklyExpiry.setHours(23, 59, 59, 999);

  // Check if user has active daily missions
  const existingDaily = await sql`
    SELECT COUNT(*) as count FROM user_missions um
    JOIN missions m ON m.id = um.mission_id
    WHERE um.user_id = ${userId} AND m.type = 'daily'
      AND um.expires_at > ${now.toISOString()}
  `;

  if (parseInt(existingDaily[0].count) === 0) {
    // Assign 3 random daily missions
    const dailyMissions = await sql`
      SELECT id FROM missions WHERE type = 'daily' AND is_active = true
      ORDER BY RANDOM() LIMIT 3
    `;

    for (const mission of dailyMissions) {
      await sql`
        INSERT INTO user_missions (user_id, mission_id, expires_at)
        VALUES (${userId}, ${mission.id}, ${dailyExpiry.toISOString()})
        ON CONFLICT DO NOTHING
      `;
    }
  }

  // Check if user has active weekly missions
  const existingWeekly = await sql`
    SELECT COUNT(*) as count FROM user_missions um
    JOIN missions m ON m.id = um.mission_id
    WHERE um.user_id = ${userId} AND m.type = 'weekly'
      AND um.expires_at > ${now.toISOString()}
  `;

  if (parseInt(existingWeekly[0].count) === 0) {
    // Assign 2 random weekly missions
    const weeklyMissions = await sql`
      SELECT id FROM missions WHERE type = 'weekly' AND is_active = true
      ORDER BY RANDOM() LIMIT 2
    `;

    for (const mission of weeklyMissions) {
      await sql`
        INSERT INTO user_missions (user_id, mission_id, expires_at)
        VALUES (${userId}, ${mission.id}, ${weeklyExpiry.toISOString()})
        ON CONFLICT DO NOTHING
      `;
    }
  }
}
