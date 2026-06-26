import sql from "@/app/api/utils/sql";
import { getSession } from "@/app/api/utils/session";

// Join matchmaking queue or get current queue status
export async function POST(request) {
  try {
    const session = await getSession(request);
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, mode } = body;
    const userId = session.user.id;

    if (action === "join") {
      // Remove any existing queue entries for this user
      await sql`DELETE FROM matchmaking_queue WHERE user_id = ${userId}`;

      // Get user profile for ELO
      const profileResult =
        await sql`SELECT elo FROM profiles WHERE id = ${userId}`;
      const elo = profileResult[0]?.elo || 1000;

      // Check if there's a waiting opponent in the queue (ELO within 300 range, same mode)
      const opponents = await sql`
        SELECT mq.*, p.username, p.elo as profile_elo, p.rank
        FROM matchmaking_queue mq
        JOIN profiles p ON p.id = mq.user_id
        WHERE mq.status = 'waiting'
          AND mq.mode = ${mode}
          AND mq.user_id != ${userId}
          AND ABS(mq.elo - ${elo}) <= 300
        ORDER BY mq.joined_at ASC
        LIMIT 1
      `;

      if (opponents.length > 0) {
        const opponent = opponents[0];

        // Randomly assign X/O
        const playerIsX = Math.random() < 0.5;
        const playerXId = playerIsX ? userId : opponent.user_id;
        const playerOId = playerIsX ? opponent.user_id : userId;

        // Create match
        const match = await sql`
          INSERT INTO matches (
            mode, status, player_x_id, player_o_id,
            current_turn_id, board_state
          ) VALUES (
            ${mode}, 'playing', ${playerXId}, ${playerOId},
            ${playerXId},
            ${JSON.stringify({ board: Array(9).fill(null), moves: [] })}
          )
          RETURNING id
        `;
        const matchId = match[0].id;

        // Update opponent's queue entry
        await sql`
          UPDATE matchmaking_queue
          SET status = 'matched', match_id = ${matchId}
          WHERE user_id = ${opponent.user_id}
        `;

        // Insert player's matched entry
        await sql`
          INSERT INTO matchmaking_queue (user_id, mode, elo, status, match_id)
          VALUES (${userId}, ${mode}, ${elo}, 'matched', ${matchId})
        `;

        // Record moves start
        return Response.json({
          status: "matched",
          matchId,
          playerSymbol: playerIsX ? "X" : "O",
          opponent: {
            username: opponent.username,
            elo: opponent.profile_elo,
            rank: opponent.rank,
          },
        });
      } else {
        // Add to queue
        await sql`
          INSERT INTO matchmaking_queue (user_id, mode, elo, status)
          VALUES (${userId}, ${mode}, ${elo}, 'waiting')
        `;

        return Response.json({ status: "waiting" });
      }
    }

    if (action === "status") {
      const queue = await sql`
        SELECT mq.*, m.id as match_id,
          m.player_x_id, m.player_o_id
        FROM matchmaking_queue mq
        LEFT JOIN matches m ON m.id = mq.match_id
        WHERE mq.user_id = ${userId}
        ORDER BY mq.joined_at DESC
        LIMIT 1
      `;

      if (queue.length === 0) {
        return Response.json({ status: "not_queued" });
      }

      const entry = queue[0];

      if (entry.status === "matched" && entry.match_id) {
        // Get player symbol
        const match =
          await sql`SELECT player_x_id, player_o_id FROM matches WHERE id = ${entry.match_id}`;
        const playerSymbol = match[0]?.player_x_id === userId ? "X" : "O";

        return Response.json({
          status: "matched",
          matchId: entry.match_id,
          playerSymbol,
        });
      }

      return Response.json({ status: "waiting", queuedAt: entry.joined_at });
    }

    if (action === "leave") {
      await sql`DELETE FROM matchmaking_queue WHERE user_id = ${userId} AND status = 'waiting'`;
      return Response.json({ status: "left" });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Matchmaking error:", error);
    return Response.json({ error: "Matchmaking failed" }, { status: 500 });
  }
}
