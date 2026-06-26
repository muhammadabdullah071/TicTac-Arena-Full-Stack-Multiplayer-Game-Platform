import sql from "@/app/api/utils/sql";
import { getSession } from "@/app/api/utils/session";

export async function GET(request) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const matches = await sql`
      SELECT
        m.id, m.mode, m.status, m.is_draw, m.xp_awarded, m.elo_change,
        m.created_at, m.finished_at,
        m.player_x_id, m.player_o_id, m.winner_id,
        px.username as player_x_username, px.rank as player_x_rank,
        po.username as player_o_username, po.rank as player_o_rank,
        m.board_state
      FROM matches m
      LEFT JOIN profiles px ON px.id = m.player_x_id
      LEFT JOIN profiles po ON po.id = m.player_o_id
      WHERE (m.player_x_id = ${userId} OR m.player_o_id = ${userId})
        AND m.status = 'finished'
      ORDER BY m.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total = await sql`
      SELECT COUNT(*) as count FROM matches
      WHERE (player_x_id = ${userId} OR player_o_id = ${userId})
        AND status = 'finished'
    `;

    const formattedMatches = matches.map((m) => {
      const isPlayerX = m.player_x_id === userId;
      const opponentUsername = isPlayerX
        ? m.player_o_username
        : m.player_x_username;
      const opponentRank = isPlayerX ? m.player_o_rank : m.player_x_rank;

      let result = "draw";
      if (!m.is_draw) {
        result = m.winner_id === userId ? "win" : "loss";
      }

      return {
        id: m.id,
        mode: m.mode,
        result,
        opponent: opponentUsername || "AI",
        opponentRank,
        xpEarned: m.xp_awarded || 0,
        eloChange: m.elo_change || 0,
        playedAt: m.finished_at || m.created_at,
      };
    });

    return Response.json({
      matches: formattedMatches,
      total: parseInt(total[0]?.count || '0'),
      limit,
      offset,
    });
  } catch (error) {
    console.error("Match history error:", error);
    // Return empty history for demo mode
    return Response.json({
      matches: [],
      total: 0,
      limit: 20,
      offset: 0,
    });
  }
}
