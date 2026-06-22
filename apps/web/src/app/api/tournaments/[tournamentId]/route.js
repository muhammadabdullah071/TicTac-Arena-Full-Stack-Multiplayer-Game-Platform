import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request, { params }) {
  try {
    const { tournamentId } = params;

    const tournaments = await sql`
      SELECT t.*,
        p.username as creator_username,
        (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
      FROM tournaments t
      LEFT JOIN profiles p ON p.id = t.creator_id
      WHERE t.id = ${tournamentId}
    `;

    if (tournaments.length === 0) {
      return Response.json({ error: "Tournament not found" }, { status: 404 });
    }

    const tournament = tournaments[0];

    // Get participants
    const participants = await sql`
      SELECT tp.*, p.username, p.rank, p.elo, p.avatar_url,
        p.total_wins, p.total_matches
      FROM tournament_participants tp
      JOIN profiles p ON p.id = tp.user_id
      WHERE tp.tournament_id = ${tournamentId}
      ORDER BY tp.score DESC, tp.matches_won DESC
    `;

    // Get tournament matches
    const matches = await sql`
      SELECT m.*, 
        px.username as player_x_username,
        po.username as player_o_username
      FROM matches m
      LEFT JOIN profiles px ON px.id = m.player_x_id
      LEFT JOIN profiles po ON po.id = m.player_o_id
      WHERE m.tournament_id = ${tournamentId}
      ORDER BY m.created_at ASC
    `;

    return Response.json({ tournament, participants, matches });
  } catch (error) {
    console.error("Tournament GET error:", error);
    return Response.json(
      { error: "Failed to get tournament" },
      { status: 500 },
    );
  }
}
