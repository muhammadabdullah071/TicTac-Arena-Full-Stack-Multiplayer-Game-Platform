import sql from "@/app/api/utils/sql";
import { getSession } from "@/app/api/utils/session";

export async function GET(request) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    const replays = await sql`
      SELECT
        r.share_code, r.match_id, r.views, r.created_at,
        m.mode, m.is_draw, m.winner_id,
        m.player_x_id, m.player_o_id,
        px.username as player_x_username,
        po.username as player_o_username
      FROM replays r
      JOIN matches m ON m.id = r.match_id
      LEFT JOIN profiles px ON px.id = m.player_x_id
      LEFT JOIN profiles po ON po.id = m.player_o_id
      WHERE m.player_x_id = ${session.user.id} OR m.player_o_id = ${session.user.id}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = await sql`
      SELECT COUNT(*) as count FROM replays r
      JOIN matches m ON m.id = r.match_id
      WHERE m.player_x_id = ${session.user.id} OR m.player_o_id = ${session.user.id}
    `;

    return Response.json({
      shares: replays.map((r) => ({
        shareCode: r.share_code,
        matchId: r.match_id,
        mode: r.mode,
        isDraw: r.is_draw,
        winnerId: r.winner_id,
        views: r.views,
        players: {
          x: r.player_x_username || "Player X",
          o: r.player_o_username || "Player O",
        },
        createdAt: r.created_at,
      })),
      total: parseInt(total[0].count),
      limit,
      offset,
    });
  } catch (error) {
    console.error("List replays error:", error);
    return Response.json({ error: "Failed to list replays" }, { status: 500 });
  }
}
