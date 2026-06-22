import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

async function requireAdmin(session) {
  if (!session?.user?.id) throw new Error("Unauthorized");
  const profile =
    await sql`SELECT role FROM profiles WHERE id = ${session.user.id}`;
  if (!profile[0] || !["admin", "moderator"].includes(profile[0].role)) {
    throw new Error("Forbidden");
  }
}

export async function GET(request) {
  try {
    const session = await auth();
    await requireAdmin(session);

    const [
      totalUsers,
      totalMatches,
      activeToday,
      matchesToday,
      topPlayers,
      matchesByMode,
      recentSignups,
    ] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM profiles`,
      sql`SELECT COUNT(*) as count FROM matches WHERE status = 'finished'`,
      sql`SELECT COUNT(DISTINCT player_x_id) + COUNT(DISTINCT player_o_id) as count
          FROM matches WHERE created_at >= NOW() - INTERVAL '24 hours'`,
      sql`SELECT COUNT(*) as count FROM matches WHERE created_at >= NOW() - INTERVAL '24 hours'`,
      sql`SELECT username, elo, rank, total_wins, total_matches 
          FROM profiles ORDER BY elo DESC LIMIT 5`,
      sql`SELECT mode, COUNT(*) as count 
          FROM matches WHERE status = 'finished'
          GROUP BY mode ORDER BY count DESC`,
      sql`SELECT DATE(created_at) as date, COUNT(*) as count
          FROM profiles
          WHERE created_at >= NOW() - INTERVAL '7 days'
          GROUP BY DATE(created_at)
          ORDER BY date ASC`,
    ]);

    return Response.json({
      overview: {
        totalUsers: parseInt(totalUsers[0].count),
        totalMatches: parseInt(totalMatches[0].count),
        activeToday: parseInt(activeToday[0].count),
        matchesToday: parseInt(matchesToday[0].count),
      },
      topPlayers,
      matchesByMode,
      recentSignups,
    });
  } catch (error) {
    if (error.message === "Unauthorized")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    console.error("Admin analytics error:", error);
    return Response.json({ error: "Failed to get analytics" }, { status: 500 });
  }
}
