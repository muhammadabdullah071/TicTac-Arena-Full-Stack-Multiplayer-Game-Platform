import sql from "@/app/api/utils/sql";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "global";
    const limit = parseInt(searchParams.get("limit") || "100");

    let leaderboard;

    if (type === "global") {
      leaderboard = await sql`
        SELECT 
          p.id,
          p.username,
          p.rank,
          p.elo,
          p.level,
          p.avatar_url,
          p.total_matches,
          p.total_wins,
          p.total_losses,
          p.win_streak,
          CASE 
            WHEN p.total_matches > 0 
            THEN ROUND((p.total_wins::numeric / p.total_matches::numeric) * 100, 1)
            ELSE 0 
          END as win_rate
        FROM profiles p
        ORDER BY p.elo DESC
        LIMIT ${limit}
      `;
    } else if (type === "weekly") {
      // For weekly, we'll order by recent wins
      leaderboard = await sql`
        SELECT 
          p.id,
          p.username,
          p.rank,
          p.elo,
          p.level,
          p.avatar_url,
          p.total_matches,
          p.total_wins,
          p.total_losses,
          p.win_streak,
          CASE 
            WHEN p.total_matches > 0 
            THEN ROUND((p.total_wins::numeric / p.total_matches::numeric) * 100, 1)
            ELSE 0 
          END as win_rate
        FROM profiles p
        ORDER BY p.win_streak DESC, p.elo DESC
        LIMIT ${limit}
      `;
    } else {
      leaderboard = await sql`
        SELECT 
          p.id,
          p.username,
          p.rank,
          p.elo,
          p.level,
          p.avatar_url,
          p.total_matches,
          p.total_wins,
          p.total_losses,
          p.win_streak,
          CASE 
            WHEN p.total_matches > 0 
            THEN ROUND((p.total_wins::numeric / p.total_matches::numeric) * 100, 1)
            ELSE 0 
          END as win_rate
        FROM profiles p
        ORDER BY p.elo DESC
        LIMIT ${limit}
      `;
    }

    return Response.json({ leaderboard });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return Response.json({ leaderboard: [] });
  }
}
