import sql from "@/app/api/utils/sql";
import { auth } from "@/auth";
import { checkGameState, calculateXP, calculateELO } from "@/lib/gameAI";

export async function POST(request, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { matchId } = params;
    const body = await request.json();
    const { position } = body;
    const userId = session.user.id;

    if (position === undefined || position < 0 || position > 8) {
      return Response.json({ error: "Invalid position" }, { status: 400 });
    }

    // Get match with lock (read)
    const matches = await sql`
      SELECT * FROM matches WHERE id = ${matchId} AND status = 'playing'
    `;

    if (matches.length === 0) {
      return Response.json(
        { error: "Match not found or not active" },
        { status: 404 },
      );
    }

    const match = matches[0];

    // Verify it's the user's turn
    if (match.current_turn_id !== userId) {
      return Response.json({ error: "Not your turn" }, { status: 403 });
    }

    // Verify user is a participant
    if (match.player_x_id !== userId && match.player_o_id !== userId) {
      return Response.json({ error: "Not a participant" }, { status: 403 });
    }

    const playerSymbol = match.player_x_id === userId ? "X" : "O";
    const boardState = match.board_state;
    const board = boardState.board;

    // Validate position is empty
    if (board[position] !== null) {
      return Response.json(
        { error: "Position already taken" },
        { status: 400 },
      );
    }

    // Make the move
    const newBoard = [...board];
    newBoard[position] = playerSymbol;
    const moveNumber = (boardState.moves || []).length + 1;

    // Check game state
    const gameResult = checkGameState(newBoard);
    const opponentId =
      match.player_x_id === userId ? match.player_o_id : match.player_x_id;
    const nextTurnId = gameResult.winner ? null : opponentId;

    let newStatus = "playing";
    let winnerId = null;
    let isDraw = false;
    let finishedAt = null;

    if (gameResult.winner === "draw") {
      newStatus = "finished";
      isDraw = true;
      finishedAt = new Date().toISOString();
    } else if (gameResult.winner) {
      newStatus = "finished";
      winnerId = userId;
      finishedAt = new Date().toISOString();
    }

    // Update moves list
    const moves = [
      ...(boardState.moves || []),
      { position, symbol: playerSymbol, moveNumber },
    ];
    const newBoardState = {
      board: newBoard,
      moves,
      winningLine: gameResult.winningLine,
    };

    // Update match in DB
    await sql`
      UPDATE matches SET
        board_state = ${JSON.stringify(newBoardState)},
        current_turn_id = ${nextTurnId},
        status = ${newStatus},
        winner_id = ${winnerId},
        is_draw = ${isDraw},
        finished_at = ${finishedAt},
        last_move_at = CURRENT_TIMESTAMP
      WHERE id = ${matchId}
    `;

    // Record move
    await sql`
      INSERT INTO moves (match_id, player_id, position, move_number, board_snapshot)
      VALUES (${matchId}, ${userId}, ${position}, ${moveNumber}, ${JSON.stringify(newBoard)})
    `;

    // Handle game end - update profiles
    if (newStatus === "finished") {
      const playerProfile =
        await sql`SELECT elo, mode FROM profiles WHERE id = ${userId}`;
      const opponentProfile =
        await sql`SELECT elo FROM profiles WHERE id = ${opponentId}`;

      const playerElo = playerProfile[0]?.elo || 1000;
      const opponentElo = opponentProfile[0]?.elo || 1000;

      const playerResult = isDraw ? "draw" : "win";
      const opponentResult = isDraw ? "draw" : "loss";

      const playerXP = calculateXP(playerResult, match.mode);
      const opponentXP = calculateXP(opponentResult, match.mode);

      let playerEloChange = 0;
      let opponentEloChange = 0;

      if (match.mode === "ranked") {
        playerEloChange = calculateELO(playerElo, opponentElo, playerResult);
        opponentEloChange = calculateELO(
          opponentElo,
          playerElo,
          opponentResult,
        );
      }

      // Update player profile
      await updateProfile(
        userId,
        playerResult,
        playerXP,
        playerEloChange,
        match.mode,
      );
      // Update opponent profile
      await updateProfile(
        opponentId,
        opponentResult,
        opponentXP,
        opponentEloChange,
        match.mode,
      );

      // Update match with final xp/elo
      await sql`
        UPDATE matches SET xp_awarded = ${playerXP}, elo_change = ${playerEloChange}
        WHERE id = ${matchId}
      `;

      // Clean up matchmaking queue
      await sql`DELETE FROM matchmaking_queue WHERE match_id = ${matchId}`;
    }

    return Response.json({
      success: true,
      boardState: newBoardState,
      gameResult,
      status: newStatus,
      nextTurnId,
    });
  } catch (error) {
    console.error("Move error:", error);
    return Response.json({ error: "Failed to submit move" }, { status: 500 });
  }
}

async function updateProfile(userId, result, xpEarned, eloChange, mode) {
  try {
    const profiles = await sql`SELECT * FROM profiles WHERE id = ${userId}`;
    if (profiles.length === 0) return;

    const profile = profiles[0];
    const isWin = result === "win";
    const isDraw = result === "draw";

    const newXP = profile.xp + xpEarned;
    const newLevel = Math.floor(newXP / 1000) + 1;
    const newElo =
      mode === "ranked" ? Math.max(100, profile.elo + eloChange) : profile.elo;
    const newWins = isWin ? profile.total_wins + 1 : profile.total_wins;
    const newLosses =
      !isWin && !isDraw ? profile.total_losses + 1 : profile.total_losses;
    const newDraws = isDraw ? profile.total_draws + 1 : profile.total_draws;
    const newStreak = isWin ? profile.win_streak + 1 : 0;
    const newBestStreak = Math.max(profile.highest_streak, newStreak);
    const newTotal = profile.total_matches + 1;

    // Calculate rank from ELO
    const newRank = getRankFromElo(newElo);

    await sql`
      UPDATE profiles SET
        xp = ${newXP},
        level = ${newLevel},
        elo = ${newElo},
        rank = ${newRank},
        total_wins = ${newWins},
        total_losses = ${newLosses},
        total_draws = ${newDraws},
        win_streak = ${newStreak},
        highest_streak = ${newBestStreak},
        total_matches = ${newTotal},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${userId}
    `;

    // Add coins reward
    const coinsEarned = isWin ? 25 : isDraw ? 10 : 5;
    await sql`UPDATE profiles SET coins = coins + ${coinsEarned} WHERE id = ${userId}`;

    // Log transaction
    await sql`
      INSERT INTO transactions (user_id, type, amount, currency, description)
      VALUES (${userId}, 'earn', ${xpEarned}, 'xp', 'Match result: ' || ${result})
    `;
    await sql`
      INSERT INTO transactions (user_id, type, amount, currency, description)
      VALUES (${userId}, 'earn', ${coinsEarned}, 'coins', 'Match result: ' || ${result})
    `;

    // Check achievements
    await checkAndGrantAchievements(userId, { newWins, newStreak, newElo });

    // Update missions progress
    await updateMissionProgress(userId, result, mode);
  } catch (err) {
    console.error("Update profile error:", err);
  }
}

function getRankFromElo(elo) {
  if (elo >= 2800) return "Legend";
  if (elo >= 2400) return "Master";
  if (elo >= 2000) return "Diamond";
  if (elo >= 1600) return "Platinum";
  if (elo >= 1300) return "Gold";
  if (elo >= 1100) return "Silver";
  return "Bronze";
}

async function checkAndGrantAchievements(userId, stats) {
  try {
    const { newWins, newStreak } = stats;

    const achievementChecks = [
      { name: "First Victory", condition: newWins >= 1 },
      { name: "10 Wins", condition: newWins >= 10 },
      { name: "100 Wins", condition: newWins >= 100 },
      { name: "500 Wins", condition: newWins >= 500 },
      { name: "1000 Wins", condition: newWins >= 1000 },
      { name: "Win Streak 5", condition: newStreak >= 5 },
      { name: "Win Streak 10", condition: newStreak >= 10 },
      { name: "Win Streak 20", condition: newStreak >= 20 },
    ];

    for (const check of achievementChecks) {
      if (check.condition) {
        const achievement =
          await sql`SELECT id FROM achievements WHERE name = ${check.name}`;
        if (achievement.length > 0) {
          const exists = await sql`
            SELECT 1 FROM user_achievements
            WHERE user_id = ${userId} AND achievement_id = ${achievement[0].id}
          `;
          if (exists.length === 0) {
            await sql`
              INSERT INTO user_achievements (user_id, achievement_id)
              VALUES (${userId}, ${achievement[0].id})
              ON CONFLICT DO NOTHING
            `;
            // Grant rewards
            await sql`
              UPDATE profiles SET
                xp = xp + ${achievement[0].xp_reward || 0},
                coins = coins + ${achievement[0].coin_reward || 0}
              WHERE id = ${userId}
            `;
          }
        }
      }
    }
  } catch (err) {
    console.error("Achievement check error:", err);
  }
}

async function updateMissionProgress(userId, result, mode) {
  try {
    const now = new Date();

    // Get active user missions
    const userMissions = await sql`
      SELECT um.*, m.requirement_type, m.requirement_value, m.xp_reward, m.coin_reward
      FROM user_missions um
      JOIN missions m ON m.id = um.mission_id
      WHERE um.user_id = ${userId}
        AND um.completed = false
        AND um.expires_at > ${now.toISOString()}
    `;

    for (const um of userMissions) {
      let shouldIncrement = false;
      let incrementBy = 1;

      switch (um.requirement_type) {
        case "play_games":
          shouldIncrement = true;
          break;
        case "win_games":
          shouldIncrement = result === "win";
          break;
        case "win_ranked":
          shouldIncrement = result === "win" && mode === "ranked";
          break;
        case "win_streak":
          // Handled separately
          break;
        default:
          break;
      }

      if (shouldIncrement) {
        const newProgress = um.progress + incrementBy;
        const completed = newProgress >= um.requirement_value;

        await sql`
          UPDATE user_missions SET
            progress = ${newProgress},
            completed = ${completed},
            completed_at = ${completed ? now.toISOString() : null}
          WHERE id = ${um.id}
        `;
      }
    }
  } catch (err) {
    console.error("Mission progress error:", err);
  }
}
