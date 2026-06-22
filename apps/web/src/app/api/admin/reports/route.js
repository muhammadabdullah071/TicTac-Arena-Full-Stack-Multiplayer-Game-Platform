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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;

    const reports = await sql`
      SELECT r.*,
        rep.username as reporter_username,
        rep.email as reporter_email,
        tar.username as reported_username,
        tar.is_banned as reported_is_banned
      FROM reports r
      LEFT JOIN profiles rep ON rep.id = r.reporter_id
      LEFT JOIN profiles tar ON tar.id = r.reported_id
      WHERE r.status = ${status}
      ORDER BY r.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const total =
      await sql`SELECT COUNT(*) as count FROM reports WHERE status = ${status}`;

    return Response.json({
      reports,
      total: parseInt(total[0].count),
      page,
      limit,
    });
  } catch (error) {
    if (error.message === "Unauthorized")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    console.error("Admin reports GET error:", error);
    return Response.json({ error: "Failed to get reports" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    await requireAdmin(session);
    const adminId = session.user.id;

    const body = await request.json();
    const { reportId, action, userId, reason } = body;

    if (action === "resolve") {
      await sql`
        UPDATE reports SET status = 'resolved', resolved_by = ${adminId}
        WHERE id = ${reportId}
      `;
      return Response.json({ success: true, message: "Report resolved" });
    }

    if (action === "dismiss") {
      await sql`
        UPDATE reports SET status = 'dismissed', resolved_by = ${adminId}
        WHERE id = ${reportId}
      `;
      return Response.json({ success: true, message: "Report dismissed" });
    }

    if (action === "ban_and_resolve") {
      await sql`
        UPDATE profiles SET is_banned = true, ban_reason = ${reason || "Banned after review"}
        WHERE id = ${userId}
      `;
      await sql`
        UPDATE reports SET status = 'resolved', resolved_by = ${adminId}
        WHERE reported_id = ${userId} AND status = 'pending'
      `;
      await sql`
        INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
        VALUES (${adminId}, 'ban_user', 'user', ${userId}, ${JSON.stringify({ reason, via: "report" })})
      `;
      return Response.json({
        success: true,
        message: "User banned and reports resolved",
      });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error.message === "Unauthorized")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    console.error("Admin reports POST error:", error);
    return Response.json(
      { error: "Failed to process action" },
      { status: 500 },
    );
  }
}
