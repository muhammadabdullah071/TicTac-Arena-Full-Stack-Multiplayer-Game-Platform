import sql from "@/app/api/utils/sql";

export async function GET(request, { params }) {
  try {
    const { shareId } = params;

    const replays = await sql`
      SELECT match_id FROM replays WHERE share_code = ${shareId} LIMIT 1
    `;

    if (replays.length === 0) {
      return Response.json({ error: "Share not found" }, { status: 404 });
    }

    const matchId = replays[0].match_id;

    // Increment view counter
    await sql`
      UPDATE replays SET views = views + 1 WHERE share_code = ${shareId}
    `;

    const matches = await sql`
      SELECT
        m.id, m.mode, m.status, m.is_draw, m.winner_id,
        m.created_at, m.finished_at, m.board_state,
        m.player_x_id, m.player_o_id,
        px.username as player_x_username, px.rank as player_x_rank, px.elo as player_x_elo,
        po.username as player_o_username, po.rank as player_o_rank, po.elo as player_o_elo
      FROM matches m
      LEFT JOIN profiles px ON px.id = m.player_x_id
      LEFT JOIN profiles po ON po.id = m.player_o_id
      WHERE m.id = ${matchId}
      LIMIT 1
    `;

    if (matches.length === 0) {
      return Response.json({ error: "Match not found" }, { status: 404 });
    }

    const match = matches[0];

    return Response.json({
      match: {
        id: match.id,
        mode: match.mode,
        isDraw: match.is_draw,
        winnerId: match.winner_id,
        createdAt: match.created_at,
        finishedAt: match.finished_at,
        boardState: match.board_state,
        players: [
          {
            id: match.player_x_id,
            username: match.player_x_username || "Player X",
            rank: match.player_x_rank,
            elo: match.player_x_elo,
            symbol: "X",
          },
          {
            id: match.player_o_id,
            username: match.player_o_username || "Player O",
            rank: match.player_o_rank,
            elo: match.player_o_elo,
            symbol: "O",
          },
        ],
      },
    });
  } catch (error) {
    console.error("Get shared replay error:", error);
    return Response.json({ error: "Failed to get replay" }, { status: 500 });
  }
}
