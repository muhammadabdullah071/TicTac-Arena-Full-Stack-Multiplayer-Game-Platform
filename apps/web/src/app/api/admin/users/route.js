import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

async function requireAdmin(session) {
  if (!session?.user?.id) throw new Error("Unauthorized");
  const profile =
    await sql`SELECT role FROM profiles WHERE id = ${session.user.id}`;
  if (!profile[0] || !["admin", "moderator"].includes(profile[0].role)) {
    throw new Error("Forbidden");
  }
  return profile[0].role;
}

export async function GET(request) {
  try {
    const session = await auth();
    await requireAdmin(session);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = 20;
    const offset = (page - 1) * limit;
    const filter = searchParams.get("filter") || "all";

    let conditions = ["1=1"];
    const values = [];
    let paramIdx = 1;

    if (search) {
      conditions.push(
        `(p.username ILIKE $${paramIdx} OR u.email ILIKE $${paramIdx})`,
      );
      values.push(`%${search}%`);
      paramIdx++;
    }

    if (filter === "banned") {
      conditions.push("p.is_banned = true");
    } else if (filter === "admin") {
      conditions.push(`p.role IN ('admin', 'moderator')`);
    }

    const whereClause = conditions.join(" AND ");

    values.push(limit, offset);
    const query = `
      SELECT p.id, p.username, p.rank, p.elo, p.level, p.total_matches,
        p.total_wins, p.is_banned, p.ban_reason, p.role, p.created_at,
        u.email, u.created_at as registered_at,
        (SELECT COUNT(*) FROM reports WHERE reported_id = p.id AND status = 'pending') as pending_reports
      FROM profiles p
      JOIN users u ON u.id = p.id
      WHERE ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramIdx++} OFFSET $${paramIdx++}
    `;

    const users = await sql(query, values);

    const countQuery = `
      SELECT COUNT(*) as count FROM profiles p JOIN users u ON u.id = p.id WHERE ${whereClause}
    `;
    const total = await sql(countQuery, values.slice(0, -2));

    return Response.json({
      users,
      total: parseInt(total[0].count),
      page,
      limit,
    });
  } catch (error) {
    if (error.message === "Unauthorized")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    console.error("Admin users GET error:", error);
    return Response.json({ error: "Failed to get users" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    const adminRole = await requireAdmin(session);
    const adminId = session.user.id;

    const body = await request.json();
    const { action, userId, reason, duration } = body;

    if (!userId) {
      return Response.json({ error: "Missing userId" }, { status: 400 });
    }

    if (action === "ban") {
      const banUntil = duration
        ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
        : null; // permanent

      await sql`
        UPDATE profiles SET
          is_banned = true,
          ban_reason = ${reason || "Violated terms of service"},
          banned_until = ${banUntil}
        WHERE id = ${userId}
      `;

      await sql`
        INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
        VALUES (${adminId}, 'ban_user', 'user', ${userId}, ${JSON.stringify({ reason, duration })})
      `;

      return Response.json({ success: true, message: "User banned" });
    }

    if (action === "unban") {
      await sql`
        UPDATE profiles SET is_banned = false, ban_reason = null, banned_until = null
        WHERE id = ${userId}
      `;

      await sql`
        INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
        VALUES (${adminId}, 'unban_user', 'user', ${userId}, '{}')
      `;

      return Response.json({ success: true, message: "User unbanned" });
    }

    if (action === "set_role" && adminRole === "admin") {
      const validRoles = ["player", "moderator", "admin"];
      if (!validRoles.includes(body.role)) {
        return Response.json({ error: "Invalid role" }, { status: 400 });
      }

      await sql`UPDATE profiles SET role = ${body.role} WHERE id = ${userId}`;

      await sql`
        INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
        VALUES (${adminId}, 'set_role', 'user', ${userId}, ${JSON.stringify({ role: body.role })})
      `;

      return Response.json({ success: true, message: "Role updated" });
    }

    if (action === "reset_elo") {
      await sql`UPDATE profiles SET elo = 1000, rank = 'Bronze' WHERE id = ${userId}`;

      await sql`
        INSERT INTO audit_logs (admin_id, action, target_type, target_id, details)
        VALUES (${adminId}, 'reset_elo', 'user', ${userId}, '{}')
      `;

      return Response.json({ success: true, message: "ELO reset" });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    if (error.message === "Unauthorized")
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (error.message === "Forbidden")
      return Response.json({ error: "Forbidden" }, { status: 403 });
    console.error("Admin users POST error:", error);
    return Response.json(
      { error: "Failed to process action" },
      { status: 500 },
    );
  }
}
