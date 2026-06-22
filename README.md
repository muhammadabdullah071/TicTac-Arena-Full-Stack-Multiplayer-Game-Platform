# TicTac Arena — Full-Stack Multiplayer Game Platform

A production-grade, real-time multiplayer Tic-Tac-Toe platform with matchmaking, tournaments, leaderboards, chat, cosmetics, and a complete auth system. Built as a monorepo serving web, mobile, and real-time socket clients from a shared codebase.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Web App    │     │  Mobile App  │     │  Socket.IO   │
│  React 18    │     │  Expo / RN   │     │  Real-time   │
│  SSR + SPA   │     │  iOS/Android │     │  Server      │
├──────────────┤     ├──────────────┤     ├──────────────┤
│  Hono Server │◄────│  REST + WS   │────►│  Matchmaking │
│  Auth.js     │     │              │     │  Game Logic  │
│  API Routes  │     │              │     │  Chat/Presence│
└──────┬───────┘     └──────────────┘     └──────┬───────┘
       │                                         │
       └──────────────┬──────────────────────────┘
                      │
         ┌────────────┴────────────┐
         │    PostgreSQL + Redis   │
         │  (Prisma ORM / Neon)    │
         └─────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Chakra UI, Tailwind CSS, TanStack Query, Zustand, React Router 7, Framer Motion |
| **Backend (SSR)** | Hono.js, Auth.js, Argon2, Stripe |
| **Real-time** | Socket.IO, Redis (pub/sub, presence, queue) |
| **Database** | PostgreSQL 16, Prisma ORM, Neon Serverless |
| **Mobile** | Expo, React Native, Skia, Reanimated |
| **Testing** | Vitest, Testing Library, Playwright, k6 |
| **Infra** | Docker Compose, GitHub Actions, Cloudflare Pages |

## Features

### Gameplay
- **Matchmaking** — Elo-based casual, ranked, and tournament queues with Redis-backed presence
- **AI Opponent** — 4 difficulty levels (Easy / Medium / Hard / Impossible) using minimax with alpha-beta pruning
- **Ultimate Mode** — 9-board variant
- **Replays** — View, share, and comment on past matches
- **Spectating** — Watch live matches in real-time

### Player Systems
- **Auth** — Email/password sign-up/sign-in, OAuth (Google, Facebook, Twitter, Apple), JWT sessions with in-memory dev fallback
- **Profiles** — Custom usernames, avatars, bios, rank progression (Bronze → Legend)
- **ELO & XP** — Competitive ranking with seasonal leaderboards
- **Achievements** — Unlockable badges with progress tracking
- **Missions** — Daily and weekly challenges with XP/coin rewards
- **Economy** — Virtual currency (coins, XP), daily rewards, cosmetic shop
- **Tournaments** — Single/double elimination brackets with automated seeding

### Social
- **Friends** — Send, accept, block, remove friends
- **Chat** — Global chat, private 1-on-1 conversations, in-game chat
- **Presence** — Online/offline/in-game status

### Platform
- **Admin Panel** — User management, report moderation, audit logs, analytics
- **Responsive** — Desktop, tablet, and mobile web
- **Native Mobile** — Expo-based iOS/Android app
- **Themes** — 7 color themes (Purple, Blue, Emerald, Red, Orange, Pink, Teal) with dynamic CSS variables
- **Error Handling** — Sentry integration, serialized error pages

## Database (PostgreSQL — 28 tables)

- `auth_users`, `auth_accounts`, `auth_sessions` — Auth.js-compatible auth
- `profiles` — Player stats, rank, ELO, XP, coins, streak
- `matches`, `moves` — Game state and move history
- `tournaments`, `tournament_participants` — Tournament brackets and seeding
- `matchmaking_queue` — Redis-backed queue persistence
- `achievements`, `missions`, `user_achievements`, `user_missions` — Progression
- `cosmetics`, `user_cosmetics`, `transactions` — Shop and economy
- `friends`, `messages`, `conversations` — Social
- `replays`, `replay_comments` — Replay system
- `seasons`, `season_leaderboard_entries` — Competitive seasons
- `reports`, `audit_logs` — Moderation
- `daily_rewards`, `push_subscriptions`, `notification_preferences` — Engagement

## Real-time Events (Socket.IO)

| Event | Purpose |
|---|---|
| `queue:join` / `queue:leave` | Matchmaking |
| `match:found` / `match:start` / `match:update` / `match:end` | Game lifecycle |
| `move:submit` / `move:accepted` / `move:rejected` | Move validation |
| `chat:message` / `typing:start` / `typing:stop` | Chat |
| `spectator:join` / `spectator:leave` / `spectator:count` | Spectating |
| `presence:update` | Online status |

## Quick Start

```bash
# Install
npm install --legacy-peer-deps

# Start infrastructure
docker compose up -d postgres redis

# Run database migrations
npm run db:migrate
npm run db:generate

# Start development servers
npm run dev:web      # Web app at http://localhost:4000
npm run dev:socket   # Socket server at port 3001

# Run tests
npm test                    # Unit tests
npx playwright test         # E2E tests
```

## Project Structure

```
apps/
  web/          React Router web app with Hono SSR
  socket/       Socket.IO real-time server
  mobile/       Expo React Native app
packages/
  database/     Prisma schema, migrations, seed
  shared/       Game logic, ELO/XP calc, shared types
tests/
  e2e/          Playwright end-to-end tests
  load/         k6 load testing scripts
```

## Testing

- **Unit**: Vitest + Testing Library (game AI, bracket generation, security, API endpoints)
- **E2E**: Playwright (auth flows, leaderboard, tournaments — Chromium/Firefox/WebKit)
- **Load**: k6 (200 concurrent users matchmaking, 50 concurrent WebSocket connections)
- **CI**: GitHub Actions with PostgreSQL + Redis service containers
