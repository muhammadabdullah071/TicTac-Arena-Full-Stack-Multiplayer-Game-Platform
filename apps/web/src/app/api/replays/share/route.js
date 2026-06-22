import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import crypto from "crypto";

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId } = await request.json();
    if (!matchId) {
      return Response.json({ error: "matchId is required" }, { status: 400 });
    }

    const match = await sql`
      SELECT id, player_x_id, player_o_id, mode, status
      FROM matches
      WHERE id = ${matchId}
        AND (player_x_id = ${session.user.id} OR player_o_id = ${session.user.id})
    `;

    if (match.length === 0) {
      return Response.json({ error: "Match not found" }, { status: 404 });
    }

    const existing = await sql`
      SELECT share_code FROM replays WHERE match_id = ${matchId} LIMIT 1
    `;

    if (existing.length > 0) {
      return Response.json({
        shareCode: existing[0].share_code,
        url: `/replay/${matchId}?share=${existing[0].share_code}`,
      });
    }

    const shareCode = crypto.randomBytes(4).toString("hex");

    await sql`
      INSERT INTO replays (match_id, share_code, is_public, views, created_at)
      VALUES (${matchId}, ${shareCode}, true, 0, NOW())
    `;

    return Response.json({
      shareCode,
      url: `/replay/${matchId}?share=${shareCode}`,
    });
  } catch (error) {
    console.error("Share replay error:", error);
    return Response.json({ error: "Failed to share replay" }, { status: 500 });
  }
}
