import sql from "@/app/api/utils/sql";
import { getSession } from "@/app/api/utils/session";

// Rate limiting store (in-memory, resets on function cold start)
const rateLimitMap = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 5000; // 5 seconds
  const maxMessages = 3;

  if (!rateLimitMap.has(userId)) {
    rateLimitMap.set(userId, []);
  }

  const timestamps = rateLimitMap.get(userId).filter((t) => now - t < windowMs);
  timestamps.push(now);
  rateLimitMap.set(userId, timestamps);

  return timestamps.length <= maxMessages;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const before = searchParams.get("before");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

    let messages;
    if (before) {
      messages = await sql`
        SELECT m.id, m.content, m.created_at, m.sender_id,
          p.username, p.rank, p.avatar_url
        FROM messages m
        LEFT JOIN profiles p ON p.id = m.sender_id::uuid
        WHERE m.is_global = true AND m.created_at < ${before}
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    } else {
      messages = await sql`
        SELECT m.id, m.content, m.created_at, m.sender_id,
          p.username, p.rank, p.avatar_url
        FROM messages m
        LEFT JOIN profiles p ON p.id = m.sender_id::uuid
        WHERE m.is_global = true
        ORDER BY m.created_at DESC
        LIMIT ${limit}
      `;
    }

    return Response.json({ messages: messages.reverse() });
  } catch (error) {
    console.error("Chat GET error:", error);
    return Response.json({ error: "Failed to get messages" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Rate limiting
    if (!checkRateLimit(userId)) {
      return Response.json(
        { error: "Too many messages. Please slow down." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content || content.trim().length === 0) {
      return Response.json(
        { error: "Message cannot be empty" },
        { status: 400 },
      );
    }

    const sanitized = content.trim().substring(0, 500);

    // Check if user is banned
    const profile =
      await sql`SELECT is_banned, username, rank, avatar_url FROM profiles WHERE id = ${userId}`;
    if (profile[0]?.is_banned) {
      return Response.json(
        { error: "You are banned from chat" },
        { status: 403 },
      );
    }

    const message = await sql`
      INSERT INTO messages (sender_id, content, is_global)
      VALUES (${userId}, ${sanitized}, true)
      RETURNING id, content, created_at, sender_id
    `;

    return Response.json({
      message: {
        ...message[0],
        username: profile[0]?.username,
        rank: profile[0]?.rank,
        avatar_url: profile[0]?.avatar_url,
      },
    });
  } catch (error) {
    console.error("Chat POST error:", error);
    return Response.json({ error: "Failed to send message" }, { status: 500 });
  }
}
