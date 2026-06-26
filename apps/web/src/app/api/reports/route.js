import sql from "@/app/api/utils/sql";
import { getSession } from "@/app/api/utils/session";

export async function POST(request) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { reportedUserId, matchId, reason, description } = body;

    if (!reportedUserId || !reason) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    if (reportedUserId === userId) {
      return Response.json(
        { error: "Cannot report yourself" },
        { status: 400 },
      );
    }

    const validReasons = [
      "cheating",
      "harassment",
      "spam",
      "inappropriate_name",
      "other",
    ];
    if (!validReasons.includes(reason)) {
      return Response.json({ error: "Invalid reason" }, { status: 400 });
    }

    // Check for duplicate report
    const existing = await sql`
      SELECT 1 FROM reports
      WHERE reporter_id = ${userId} AND reported_id = ${reportedUserId}
        AND created_at > NOW() - INTERVAL '24 hours'
    `;

    if (existing.length > 0) {
      return Response.json(
        { error: "You already reported this user recently" },
        { status: 400 },
      );
    }

    await sql`
      INSERT INTO reports (reporter_id, reported_id, match_id, reason, description, status)
      VALUES (
        ${userId},
        ${reportedUserId},
        ${matchId || null},
        ${reason},
        ${description?.substring(0, 500) || null},
        'pending'
      )
    `;

    // Log audit
    await sql`
      INSERT INTO audit_logs (action, target_type, target_id, details)
      VALUES ('report_submitted', 'user', ${reportedUserId}, ${JSON.stringify({ reporter: userId, reason })})
    `;

    return Response.json({
      success: true,
      message: "Report submitted. Thank you for keeping the community safe.",
    });
  } catch (error) {
    console.error("Report POST error:", error);
    return Response.json({ error: "Failed to submit report" }, { status: 500 });
  }
}
