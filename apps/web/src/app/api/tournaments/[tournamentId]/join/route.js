import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId } = params;
    const userId = session.user.id;

    // Get tournament
    const tournaments = await sql`
      SELECT t.*,
        (SELECT COUNT(*) FROM tournament_participants WHERE tournament_id = t.id) as participant_count
      FROM tournaments t
      WHERE t.id = ${tournamentId}
    `;

    if (tournaments.length === 0) {
      return Response.json({ error: "Tournament not found" }, { status: 404 });
    }

    const tournament = tournaments[0];

    if (tournament.status !== "upcoming") {
      return Response.json(
        { error: "Tournament is not open for registration" },
        { status: 400 },
      );
    }

    if (
      parseInt(tournament.participant_count) >= (tournament.max_players || 8)
    ) {
      return Response.json({ error: "Tournament is full" }, { status: 400 });
    }

    // Check if already joined
    const existing = await sql`
      SELECT 1 FROM tournament_participants
      WHERE tournament_id = ${tournamentId} AND user_id = ${userId}
    `;

    if (existing.length > 0) {
      return Response.json({ error: "Already registered" }, { status: 400 });
    }

    // Join tournament
    await sql`
      INSERT INTO tournament_participants (tournament_id, user_id, score)
      VALUES (${tournamentId}, ${userId}, 0)
    `;

    // Update mission progress for joining tournament
    const now = new Date().toISOString();
    const missionRows = await sql`
      SELECT um.id FROM user_missions um
      JOIN missions m ON m.id = um.mission_id
      WHERE um.user_id = ${userId}
        AND m.requirement_type = 'join_tournament'
        AND um.completed = false
        AND um.expires_at > ${now}
    `;

    for (const um of missionRows) {
      await sql`
        UPDATE user_missions SET
          progress = 1,
          completed = true,
          completed_at = CURRENT_TIMESTAMP
        WHERE id = ${um.id}
      `;
    }

    return Response.json({
      success: true,
      message: "Successfully joined tournament",
    });
  } catch (error) {
    console.error("Tournament join error:", error);
    return Response.json(
      { error: "Failed to join tournament" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tournamentId } = params;
    const userId = session.user.id;

    const tournament =
      await sql`SELECT status FROM tournaments WHERE id = ${tournamentId}`;
    if (tournament[0]?.status !== "upcoming") {
      return Response.json(
        { error: "Cannot leave an active tournament" },
        { status: 400 },
      );
    }

    await sql`
      DELETE FROM tournament_participants
      WHERE tournament_id = ${tournamentId} AND user_id = ${userId}
    `;

    return Response.json({ success: true, message: "Left tournament" });
  } catch (error) {
    console.error("Tournament leave error:", error);
    return Response.json(
      { error: "Failed to leave tournament" },
      { status: 500 },
    );
  }
}
