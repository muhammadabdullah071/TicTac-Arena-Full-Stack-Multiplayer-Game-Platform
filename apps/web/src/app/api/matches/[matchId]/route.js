import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId } = params;
    const userId = session.user.id;

    const matches = await sql`
      SELECT 
        m.*,
        px.username as player_x_username,
        po.username as player_o_username,
        px.elo as player_x_elo,
        po.elo as player_o_elo,
        px.rank as player_x_rank,
        po.rank as player_o_rank
      FROM matches m
      LEFT JOIN profiles px ON px.id = m.player_x_id
      LEFT JOIN profiles po ON po.id = m.player_o_id
      WHERE m.id = ${matchId}
    `;

    if (matches.length === 0) {
      return Response.json({ error: "Match not found" }, { status: 404 });
    }

    const match = matches[0];

    // Check if user is a participant or spectator
    const isParticipant =
      match.player_x_id === userId || match.player_o_id === userId;

    // Get chat messages for this match
    const messages = await sql`
      SELECT m.*, p.username
      FROM messages m
      LEFT JOIN profiles p ON p.id = m.sender_id::uuid
      WHERE m.match_id = ${matchId}
      ORDER BY m.created_at ASC
      LIMIT 50
    `;

    return Response.json({
      match: {
        ...match,
        isParticipant,
        playerSymbol: match.player_x_id === userId ? "X" : "O",
      },
      messages,
    });
  } catch (error) {
    console.error("Get match error:", error);
    return Response.json({ error: "Failed to get match" }, { status: 500 });
  }
}
