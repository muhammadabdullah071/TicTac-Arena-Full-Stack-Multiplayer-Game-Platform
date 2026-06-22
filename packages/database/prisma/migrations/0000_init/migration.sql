-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('player', 'moderator', 'admin');
CREATE TYPE "FriendStatus" AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE "MatchStatus" AS ENUM ('playing', 'finished');
CREATE TYPE "MatchMode" AS ENUM ('casual', 'ranked', 'ai', 'tournament', 'ultimate');
CREATE TYPE "TournamentStatus" AS ENUM ('draft', 'registration', 'starting', 'live', 'completed', 'cancelled');
CREATE TYPE "TournamentFormat" AS ENUM ('single_elimination', 'double_elimination', 'round_robin');
CREATE TYPE "MissionType" AS ENUM ('daily', 'weekly');
CREATE TYPE "MissionRequirement" AS ENUM ('play_games', 'win_games', 'win_ranked', 'win_streak', 'beat_hard_ai', 'beat_impossible_ai', 'join_tournament');
CREATE TYPE "CosmeticType" AS ENUM ('theme', 'frame', 'animation');
CREATE TYPE "CurrencyType" AS ENUM ('xp', 'coins');
CREATE TYPE "TransactionType" AS ENUM ('earn', 'spend', 'reward');
CREATE TYPE "ReportReason" AS ENUM ('cheating', 'harassment', 'spam', 'inappropriate_name', 'other');
CREATE TYPE "ReportStatus" AS ENUM ('pending', 'resolved', 'dismissed');
CREATE TYPE "SeasonStatus" AS ENUM ('upcoming', 'active', 'completed');

-- Auth tables
CREATE TABLE "auth_users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    CONSTRAINT "auth_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_users_email_key" ON "auth_users"("email");

CREATE TABLE "auth_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "password" TEXT,
    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_accounts_provider_provider_account_id_key" ON "auth_accounts"("provider", "provider_account_id");
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts"("user_id");

CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "auth_sessions_session_token_key" ON "auth_sessions"("session_token");
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");

CREATE TABLE "auth_verification_tokens" (
    "identifier" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL
);

CREATE UNIQUE INDEX "auth_verification_tokens_identifier_token_key" ON "auth_verification_tokens"("identifier", "token");

-- Core tables
CREATE TABLE "profiles" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "bio" TEXT,
    "avatar_url" TEXT,
    "rank" TEXT NOT NULL DEFAULT 'Bronze',
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "win_streak" INTEGER NOT NULL DEFAULT 0,
    "highest_streak" INTEGER NOT NULL DEFAULT 0,
    "total_matches" INTEGER NOT NULL DEFAULT 0,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "total_losses" INTEGER NOT NULL DEFAULT 0,
    "total_draws" INTEGER NOT NULL DEFAULT 0,
    "role" "UserRole" NOT NULL DEFAULT 'player',
    "is_banned" BOOLEAN NOT NULL DEFAULT false,
    "ban_reason" TEXT,
    "banned_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "profiles_username_key" ON "profiles"("username");
CREATE INDEX "profiles_elo_idx" ON "profiles"("elo" DESC);
CREATE INDEX "profiles_rank_idx" ON "profiles"("rank");
CREATE INDEX "profiles_role_idx" ON "profiles"("role");
CREATE INDEX "profiles_created_at_idx" ON "profiles"("created_at" DESC);

CREATE TABLE "matches" (
    "id" TEXT NOT NULL,
    "mode" "MatchMode" NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'playing',
    "player_x_id" TEXT NOT NULL,
    "player_o_id" TEXT,
    "current_turn_id" TEXT,
    "winner_id" TEXT,
    "is_draw" BOOLEAN NOT NULL DEFAULT false,
    "difficulty" TEXT,
    "board_state" JSONB NOT NULL DEFAULT '{"board":[null,null,null,null,null,null,null,null,null],"moves":[]}',
    "xp_awarded" INTEGER NOT NULL DEFAULT 0,
    "elo_change" INTEGER NOT NULL DEFAULT 0,
    "tournament_id" TEXT,
    "round" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "last_move_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "matches_player_x_id_idx" ON "matches"("player_x_id");
CREATE INDEX "matches_player_o_id_idx" ON "matches"("player_o_id");
CREATE INDEX "matches_tournament_id_idx" ON "matches"("tournament_id");
CREATE INDEX "matches_status_idx" ON "matches"("status");
CREATE INDEX "matches_mode_idx" ON "matches"("mode");
CREATE INDEX "matches_created_at_idx" ON "matches"("created_at" DESC);
CREATE INDEX "matches_player_x_id_status_idx" ON "matches"("player_x_id", "status");
CREATE INDEX "matches_player_o_id_status_idx" ON "matches"("player_o_id", "status");

CREATE TABLE "moves" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "player_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "move_number" INTEGER NOT NULL,
    "board_snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "moves_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "moves_match_id_idx" ON "moves"("match_id");
CREATE INDEX "moves_player_id_idx" ON "moves"("player_id");
CREATE INDEX "moves_match_id_move_number_idx" ON "moves"("match_id", "move_number");

CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "match_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_sender_id_idx" ON "messages"("sender_id");
CREATE INDEX "messages_match_id_idx" ON "messages"("match_id");
CREATE INDEX "messages_is_global_idx" ON "messages"("is_global");
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at" DESC);
CREATE INDEX "messages_is_global_created_at_idx" ON "messages"("is_global", "created_at" DESC);

CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "participant_one" TEXT NOT NULL,
    "participant_two" TEXT NOT NULL,
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversations_participant_one_participant_two_key" ON "conversations"("participant_one", "participant_two");

CREATE TABLE "friends" (
    "user_id" TEXT NOT NULL,
    "friend_id" TEXT NOT NULL,
    "status" "FriendStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "friends_pkey" PRIMARY KEY ("user_id", "friend_id")
);

CREATE INDEX "friends_friend_id_idx" ON "friends"("friend_id");
CREATE INDEX "friends_user_id_status_idx" ON "friends"("user_id", "status");

CREATE TABLE "matchmaking_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "elo" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'waiting',
    "match_id" TEXT,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "matchmaking_queue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "matchmaking_queue_user_id_idx" ON "matchmaking_queue"("user_id");
CREATE INDEX "matchmaking_queue_status_idx" ON "matchmaking_queue"("status");
CREATE INDEX "matchmaking_queue_mode_idx" ON "matchmaking_queue"("mode");
CREATE INDEX "matchmaking_queue_mode_status_elo_idx" ON "matchmaking_queue"("mode", "status", "elo");

-- Tournament tables
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "TournamentStatus" NOT NULL DEFAULT 'draft',
    "format" "TournamentFormat" NOT NULL DEFAULT 'single_elimination',
    "start_time" TIMESTAMP(3) NOT NULL,
    "max_players" INTEGER NOT NULL DEFAULT 8,
    "prize_pool" INTEGER NOT NULL DEFAULT 0,
    "creator_id" TEXT,
    "current_round" INTEGER NOT NULL DEFAULT 0,
    "bracket" JSONB,
    "season_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    CONSTRAINT "tournaments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "tournaments_status_idx" ON "tournaments"("status");
CREATE INDEX "tournaments_start_time_idx" ON "tournaments"("start_time");
CREATE INDEX "tournaments_season_id_idx" ON "tournaments"("season_id");

CREATE TABLE "tournament_participants" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "matches_won" INTEGER NOT NULL DEFAULT 0,
    "seed" INTEGER,
    "bracket_position" INTEGER,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tournament_participants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tournament_participants_tournament_id_user_id_key" ON "tournament_participants"("tournament_id", "user_id");
CREATE INDEX "tournament_participants_tournament_id_idx" ON "tournament_participants"("tournament_id");
CREATE INDEX "tournament_participants_user_id_idx" ON "tournament_participants"("user_id");

-- Achievement tables
CREATE TABLE "achievements" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_key" TEXT,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "coin_reward" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "achievements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "achievements_name_key" ON "achievements"("name");

CREATE TABLE "user_achievements" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "progress" INTEGER,
    CONSTRAINT "user_achievements_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_achievements_user_id_achievement_id_key" ON "user_achievements"("user_id", "achievement_id");
CREATE INDEX "user_achievements_user_id_idx" ON "user_achievements"("user_id");

-- Mission tables
CREATE TABLE "missions" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "MissionType" NOT NULL,
    "requirement_type" "MissionRequirement" NOT NULL,
    "requirement_value" INTEGER NOT NULL,
    "xp_reward" INTEGER NOT NULL DEFAULT 0,
    "coin_reward" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "missions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "missions_type_is_active_idx" ON "missions"("type", "is_active");

CREATE TABLE "user_missions" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "mission_id" INTEGER NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "claimed" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_missions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_missions_user_id_mission_id_key" ON "user_missions"("user_id", "mission_id");
CREATE INDEX "user_missions_user_id_idx" ON "user_missions"("user_id");
CREATE INDEX "user_missions_user_id_completed_expires_idx" ON "user_missions"("user_id", "completed", "expires_at");

-- Cosmetic tables
CREATE TABLE "cosmetics" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CosmeticType" NOT NULL,
    "price" INTEGER NOT NULL,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "cosmetics_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cosmetics_type_price_idx" ON "cosmetics"("type", "price");

CREATE TABLE "user_cosmetics" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "cosmetic_id" INTEGER NOT NULL,
    "is_equipped" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "user_cosmetics_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_cosmetics_user_id_cosmetic_id_key" ON "user_cosmetics"("user_id", "cosmetic_id");
CREATE INDEX "user_cosmetics_user_id_idx" ON "user_cosmetics"("user_id");

-- Economy tables
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" "CurrencyType" NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at" DESC);
CREATE INDEX "transactions_user_id_created_at_idx" ON "transactions"("user_id", "created_at" DESC);

CREATE TABLE "daily_rewards" (
    "id" SERIAL NOT NULL,
    "user_id" TEXT NOT NULL,
    "day_streak" INTEGER NOT NULL,
    "coins_earned" INTEGER NOT NULL,
    "xp_earned" INTEGER NOT NULL,
    "claimed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "daily_rewards_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "daily_rewards_user_id_idx" ON "daily_rewards"("user_id");
CREATE INDEX "daily_rewards_claimed_at_idx" ON "daily_rewards"("claimed_at" DESC);

-- Moderation tables
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "reporter_id" TEXT NOT NULL,
    "reported_id" TEXT NOT NULL,
    "match_id" TEXT,
    "reason" "ReportReason" NOT NULL,
    "description" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'pending',
    "resolved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "reports_reported_id_idx" ON "reports"("reported_id");
CREATE INDEX "reports_status_idx" ON "reports"("status");
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at" DESC);
CREATE INDEX "reports_reported_id_status_idx" ON "reports"("reported_id", "status");

CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "admin_id" TEXT,
    "action" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "audit_logs_admin_id_idx" ON "audit_logs"("admin_id");
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at" DESC);

-- New feature tables
CREATE TABLE "seasons" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "status" "SeasonStatus" NOT NULL DEFAULT 'upcoming',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "rewards" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seasons_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "seasons_status_idx" ON "seasons"("status");
CREATE INDEX "seasons_number_idx" ON "seasons"("number");

CREATE TABLE "season_leaderboard_entries" (
    "id" TEXT NOT NULL,
    "season_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "elo" INTEGER NOT NULL DEFAULT 1000,
    "peak_elo" INTEGER NOT NULL DEFAULT 1000,
    "matches_played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "rank" TEXT NOT NULL DEFAULT 'Bronze',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "season_leaderboard_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "season_leaderboard_entries_season_id_user_id_key" ON "season_leaderboard_entries"("season_id", "user_id");
CREATE INDEX "season_leaderboard_entries_season_id_idx" ON "season_leaderboard_entries"("season_id");
CREATE INDEX "season_leaderboard_entries_elo_idx" ON "season_leaderboard_entries"("elo" DESC);

CREATE TABLE "push_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "push_subscriptions_user_id_endpoint_key" ON "push_subscriptions"("user_id", "endpoint");
CREATE INDEX "push_subscriptions_user_id_idx" ON "push_subscriptions"("user_id");

CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "notification_preferences_user_id_key_key" ON "notification_preferences"("user_id", "key");
CREATE INDEX "notification_preferences_user_id_idx" ON "notification_preferences"("user_id");

CREATE TABLE "replays" (
    "id" TEXT NOT NULL,
    "match_id" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "title" TEXT,
    "share_code" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "replays_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "replays_match_id_key" ON "replays"("match_id");
CREATE UNIQUE INDEX "replays_share_code_key" ON "replays"("share_code");
CREATE INDEX "replays_is_public_idx" ON "replays"("is_public");

CREATE TABLE "replay_comments" (
    "id" TEXT NOT NULL,
    "replay_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "replay_comments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "replay_comments_replay_id_idx" ON "replay_comments"("replay_id");

-- Foreign keys
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE;
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth_users"("id") ON DELETE CASCADE;
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth_users"("id") ON DELETE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_x_id_fkey" FOREIGN KEY ("player_x_id") REFERENCES "profiles"("id");
ALTER TABLE "matches" ADD CONSTRAINT "matches_player_o_id_fkey" FOREIGN KEY ("player_o_id") REFERENCES "profiles"("id");
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "profiles"("id");
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id");
ALTER TABLE "moves" ADD CONSTRAINT "moves_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id") ON DELETE CASCADE;
ALTER TABLE "moves" ADD CONSTRAINT "moves_player_id_fkey" FOREIGN KEY ("player_id") REFERENCES "profiles"("id");
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "profiles"("id");
ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id");
ALTER TABLE "friends" ADD CONSTRAINT "friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");
ALTER TABLE "friends" ADD CONSTRAINT "friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "profiles"("id");
ALTER TABLE "matchmaking_queue" ADD CONSTRAINT "matchmaking_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");
ALTER TABLE "matchmaking_queue" ADD CONSTRAINT "matchmaking_queue_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id");
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "profiles"("id");
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id");
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments"("id") ON DELETE CASCADE;
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "achievements"("id");
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");
ALTER TABLE "user_missions" ADD CONSTRAINT "user_missions_mission_id_fkey" FOREIGN KEY ("mission_id") REFERENCES "missions"("id");
ALTER TABLE "user_cosmetics" ADD CONSTRAINT "user_cosmetics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");
ALTER TABLE "user_cosmetics" ADD CONSTRAINT "user_cosmetics_cosmetic_id_fkey" FOREIGN KEY ("cosmetic_id") REFERENCES "cosmetics"("id");
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");
ALTER TABLE "daily_rewards" ADD CONSTRAINT "daily_rewards_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "profiles"("id");
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_id_fkey" FOREIGN KEY ("reported_id") REFERENCES "profiles"("id");
ALTER TABLE "reports" ADD CONSTRAINT "reports_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id");
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "profiles"("id");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "profiles"("id");
ALTER TABLE "season_leaderboard_entries" ADD CONSTRAINT "season_leaderboard_entries_season_id_fkey" FOREIGN KEY ("season_id") REFERENCES "seasons"("id");
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id");
ALTER TABLE "replays" ADD CONSTRAINT "replays_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "matches"("id");
ALTER TABLE "replay_comments" ADD CONSTRAINT "replay_comments_replay_id_fkey" FOREIGN KEY ("replay_id") REFERENCES "replays"("id") ON DELETE CASCADE;
