# TicTac Arena — Architecture

## Overview

TicTac Arena is a real-time multiplayer Tic-Tac-Toe platform built with a microservices architecture.

## System Components

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Web App   │────▶│  Socket.io   │────▶│   Redis     │
│  (React)    │     │  Server      │     │  (Pub/Sub)  │
└──────┬──────┘     └──────┬───────┘     └──────┬──────┘
       │                   │                     │
       ▼                   ▼                     ▼
┌─────────────────────────────────────────────────────┐
│                   PostgreSQL                          │
│                (via Prisma ORM)                       │
└─────────────────────────────────────────────────────┘
```

### Web App (apps/web)
- React 18 + React Router 7 (file-based routing)
- Vite dev server and bundler
- @auth/core for authentication (credentials + OAuth)
- Socket.io client for real-time communication
- Tailwind CSS for styling

### Socket Server (apps/socket)
- Standalone Socket.io server (port 3001)
- Redis adapter for horizontal scaling
- JWT-based authentication
- Game move processing
- Presence synchronization
- Matchmaking queue management

### Database (packages/database)
- Prisma ORM with PostgreSQL
- @neondatabase/serverless adapter
- 28 tables with full foreign key relationships
- Composite indexes on all query patterns

### Cache Layer (Redis)
- Session management
- Presence tracking
- Rate limiting
- Matchmaking queue
- API response caching
- Leaderboard caching

## Data Flow

### Match Flow
1. Player joins queue → Redis sorted set
2. Match found → Match created in PostgreSQL
3. Socket emits match:found to both players
4. Players submit moves via Socket.io
5. Moves validated server-side, persisted to DB
6. Match state broadcast to room
7. Game end → Ratings updated, rewards granted

### Chat Flow
1. Message sent via Socket.io
2. Saved to PostgreSQL
3. Broadcast to room/global
4. Rate-limited via Redis

## Key Design Decisions

- **Separate Socket server**: Allows independent scaling of real-time vs HTTP
- **Redis adapter**: Enables multiple socket server instances behind a load balancer
- **Prisma ORM**: Type-safe queries with connection pooling via Neon
- **JWT auth tokens**: Stateless authentication for WebSocket connections
- **Connection state recovery**: Socket.io built-in recovery for reconnections
