import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";

export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "friends"; // friends, requests, sent

    if (type === "friends") {
      const friends = await sql`
        SELECT 
          CASE WHEN f.user_id = ${userId} THEN f.friend_id ELSE f.user_id END as friend_id,
          p.username, p.rank, p.elo, p.level, p.avatar_url, p.total_wins, p.total_matches
        FROM friends f
        JOIN profiles p ON p.id = CASE WHEN f.user_id = ${userId} THEN f.friend_id ELSE f.user_id END
        WHERE (f.user_id = ${userId} OR f.friend_id = ${userId})
          AND f.status = 'accepted'
      `;

      return Response.json({ friends });
    }

    if (type === "requests") {
      const requests = await sql`
        SELECT f.user_id as requester_id, f.created_at,
          p.username, p.rank, p.elo, p.avatar_url
        FROM friends f
        JOIN profiles p ON p.id = f.user_id
        WHERE f.friend_id = ${userId} AND f.status = 'pending'
        ORDER BY f.created_at DESC
      `;

      return Response.json({ requests });
    }

    if (type === "sent") {
      const sent = await sql`
        SELECT f.friend_id, f.created_at, f.status,
          p.username, p.rank, p.elo, p.avatar_url
        FROM friends f
        JOIN profiles p ON p.id = f.friend_id
        WHERE f.user_id = ${userId} AND f.status = 'pending'
        ORDER BY f.created_at DESC
      `;

      return Response.json({ sent });
    }

    return Response.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Friends GET error:", error);
    return Response.json({ error: "Failed to get friends" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, targetUserId, username } = body;
    const userId = session.user.id;

    if (action === "send_request") {
      let targetId = targetUserId;

      if (!targetId && username) {
        const profile =
          await sql`SELECT id FROM profiles WHERE username = ${username}`;
        if (profile.length === 0) {
          return Response.json({ error: "User not found" }, { status: 404 });
        }
        targetId = profile[0].id;
      }

      if (targetId === userId) {
        return Response.json({ error: "Cannot add yourself" }, { status: 400 });
      }

      // Check if already friends or pending
      const existing = await sql`
        SELECT status FROM friends
        WHERE (user_id = ${userId} AND friend_id = ${targetId})
           OR (user_id = ${targetId} AND friend_id = ${userId})
      `;

      if (existing.length > 0) {
        if (existing[0].status === "accepted") {
          return Response.json({ error: "Already friends" }, { status: 400 });
        }
        if (existing[0].status === "pending") {
          return Response.json(
            { error: "Request already pending" },
            { status: 400 },
          );
        }
      }

      await sql`
        INSERT INTO friends (user_id, friend_id, status)
        VALUES (${userId}, ${targetId}, 'pending')
        ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'pending'
      `;

      return Response.json({ success: true, message: "Friend request sent" });
    }

    if (action === "accept") {
      await sql`
        UPDATE friends SET status = 'accepted'
        WHERE user_id = ${targetUserId} AND friend_id = ${userId} AND status = 'pending'
      `;

      return Response.json({
        success: true,
        message: "Friend request accepted",
      });
    }

    if (action === "reject") {
      await sql`
        DELETE FROM friends
        WHERE user_id = ${targetUserId} AND friend_id = ${userId} AND status = 'pending'
      `;

      return Response.json({
        success: true,
        message: "Friend request rejected",
      });
    }

    if (action === "remove") {
      await sql`
        DELETE FROM friends
        WHERE (user_id = ${userId} AND friend_id = ${targetUserId})
           OR (user_id = ${targetUserId} AND friend_id = ${userId})
      `;

      return Response.json({ success: true, message: "Friend removed" });
    }

    if (action === "block") {
      // Remove any existing relationship
      await sql`
        DELETE FROM friends
        WHERE (user_id = ${userId} AND friend_id = ${targetUserId})
           OR (user_id = ${targetUserId} AND friend_id = ${userId})
      `;

      // Add block
      await sql`
        INSERT INTO friends (user_id, friend_id, status)
        VALUES (${userId}, ${targetUserId}, 'blocked')
        ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'blocked'
      `;

      return Response.json({ success: true, message: "User blocked" });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Friends POST error:", error);
    return Response.json(
      { error: "Failed to process friend action" },
      { status: 500 },
    );
  }
}
