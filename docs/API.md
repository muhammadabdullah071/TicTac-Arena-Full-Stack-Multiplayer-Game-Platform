# TicTac Arena — API Documentation

## Authentication

All endpoints (except auth) require authentication via session cookie or JWT token.

### POST /api/auth/callback/credentials-signin
Sign in with email and password.

### POST /api/auth/callback/credentials-signup
Create a new account.

## Matchmaking

### POST /api/matchmaking
Join, check status, or leave the queue.

**Actions:** `join`, `status`, `leave`

**Body:** `{ action: "join", mode: "casual|ranked|ultimate" }`

## Matches

### GET /api/matches/:matchId
Get match details with player info and messages.

### POST /api/matches/:matchId/move
Submit a move.

**Body:** `{ position: 0-8 }`

### GET /api/matches/history
Get user's match history.

**Query params:** `limit`, `offset`

## Tournaments

### GET /api/tournaments
List tournaments.

### POST /api/tournaments
Create tournament (admin).

### GET /api/tournaments/:id
Get tournament details with participants and matches.

### POST /api/tournaments/:id/join
Join a tournament.

### DELETE /api/tournaments/:id/join
Leave a tournament.

## Leaderboard

### GET /api/leaderboard
Get leaderboard rankings.

**Query params:** `type=global|weekly`, `limit`

## Friends

### GET /api/friends
Get friends list, requests, or sent requests.

**Query params:** `type=friends|requests|sent`

### POST /api/friends
Send, accept, reject, or remove friend requests.

**Actions:** `send_request`, `accept`, `reject`, `remove`, `block`

## Chat

### GET /api/chat/global
Get global chat messages.

**Query params:** `limit`, `before` (cursor)

### POST /api/chat/global
Send a global message.

**Rate limit:** 3 messages per 5 seconds.

## Economy

### GET /api/economy/daily
Get daily reward status.

### POST /api/economy/daily
Claim daily reward.

## Admin

All admin endpoints require `admin` or `moderator` role.

### GET /api/admin/analytics
Get platform analytics.

### GET /api/admin/users
List users with search and pagination.

### POST /api/admin/users
Ban, unban, set role, or reset ELO.

### GET /api/admin/reports
List moderation reports.

### POST /api/admin/reports
Resolve, dismiss, or ban-and-resolve reports.

## Real-time Events (Socket.io)

See SOCKET.md for the complete event reference.
