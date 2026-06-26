import sql from "@/app/api/utils/sql";
import { getSession } from "@/app/api/utils/session";

export async function GET(request, { params }) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const myId = session.user.id;
    const { userId: otherId } = params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    // Get conversation
    const convRows = await sql`
      SELECT id FROM conversations
      WHERE (participant_one = ${myId} AND participant_two = ${otherId})
         OR (participant_one = ${otherId} AND participant_two = ${myId})
      LIMIT 1
    `;

    if (convRows.length === 0) {
      return Response.json({ messages: [], conversationId: null });
    }

    const conversationId = convRows[0].id;

    // Get messages from this conversation (stored in messages with match_id = null and a reference)
    const messages = await sql`
      SELECT m.id, m.content, m.created_at, m.sender_id,
        p.username, p.rank, p.avatar_url
      FROM messages m
      LEFT JOIN profiles p ON p.id = m.sender_id::uuid
      WHERE m.match_id IS NULL AND m.is_global = false
        AND (
          (m.sender_id = ${myId} AND m.content LIKE ${"conv:" + conversationId + ":%"})
          OR (m.sender_id = ${otherId} AND m.content LIKE ${"conv:" + conversationId + ":%"})
        )
      ORDER BY m.created_at DESC
      LIMIT ${limit}
    `;

    // Strip the conversation prefix
    const cleaned = messages.reverse().map((m) => ({
      ...m,
      content: m.content.replace(`conv:${conversationId}:`, ""),
    }));

    return Response.json({ messages: cleaned, conversationId });
  } catch (error) {
    console.error("Private chat GET error:", error);
    return Response.json({ error: "Failed to get messages" }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const myId = session.user.id;
    const { userId: otherId } = params;
    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return Response.json(
        { error: "Message cannot be empty" },
        { status: 400 },
      );
    }

    const sanitized = content.trim().substring(0, 1000);

    // Check if friends
    const friendship = await sql`
      SELECT status FROM friends
      WHERE ((user_id = ${myId} AND friend_id = ${otherId})
          OR (user_id = ${otherId} AND friend_id = ${myId}))
        AND status = 'accepted'
    `;

    if (friendship.length === 0) {
      return Response.json(
        { error: "Can only message friends" },
        { status: 403 },
      );
    }

    // Get or create conversation
    let conversationId;
    const existing = await sql`
      SELECT id FROM conversations
      WHERE (participant_one = ${myId} AND participant_two = ${otherId})
         OR (participant_one = ${otherId} AND participant_two = ${myId})
      LIMIT 1
    `;

    if (existing.length > 0) {
      conversationId = existing[0].id;
      await sql`UPDATE conversations SET last_message_at = CURRENT_TIMESTAMP WHERE id = ${conversationId}`;
    } else {
      const conv = await sql`
        INSERT INTO conversations (participant_one, participant_two)
        VALUES (${myId}, ${otherId})
        RETURNING id
      `;
      conversationId = conv[0].id;
    }

    // Store message with conversation prefix
    const storedContent = `conv:${conversationId}:${sanitized}`;
    const message = await sql`
      INSERT INTO messages (sender_id, content, is_global)
      VALUES (${myId}, ${storedContent}, false)
      RETURNING id, created_at, sender_id
    `;

    const profile =
      await sql`SELECT username, rank, avatar_url FROM profiles WHERE id = ${myId}`;

    return Response.json({
      message: {
        ...message[0],
        content: sanitized,
        username: profile[0]?.username,
        rank: profile[0]?.rank,
        avatar_url: profile[0]?.avatar_url,
        conversationId,
      },
    });
  } catch (error) {
    console.error("Private chat POST error:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
