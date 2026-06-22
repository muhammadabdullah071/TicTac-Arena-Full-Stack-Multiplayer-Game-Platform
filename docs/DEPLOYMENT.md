# TicTac Arena — Deployment Guide

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- Node.js 20+ (for local development)
- A PostgreSQL database (Neon, AWS RDS, or self-hosted)
- A Redis instance (Upstash, AWS ElastiCache, or self-hosted)

## Quick Start (Development)

```bash
# Install dependencies
npm ci

# Generate Prisma client
npx prisma generate --schema=packages/database/prisma/schema.prisma

# Run database migrations
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma

# Seed database
npm run -w packages/database seed

# Start web app
npm run -w apps/web dev

# Start socket server (in another terminal)
npm run -w apps/socket dev
```

## Docker Deployment

```bash
# Build and start all services
docker-compose up --build

# Run migrations
docker-compose exec web npx prisma migrate deploy

# Seed database
docker-compose exec web npm run -w packages/database seed
```

## Production Checklist

- [ ] Set strong `AUTH_SECRET` (256-bit random string)
- [ ] Configure Cloudinary for avatar uploads
- [ ] Set up Sentry DSN for error tracking
- [ ] Configure PostHog for analytics
- [ ] Generate VAPID keys for push notifications
- [ ] Set up SSL/TLS termination (reverse proxy)
- [ ] Configure database connection pooling
- [ ] Set up regular database backups
- [ ] Configure Redis persistence
- [ ] Set up monitoring alerts

## Environment Variables

See `.env.example` for the complete list of required environment variables.

## Scaling

- **Web app**: Stateless, scale horizontally behind a load balancer
- **Socket server**: Requires Redis adapter for horizontal scaling
- **Database**: Use connection pooling (pgBouncer/Neon)
- **Redis**: Can be clustered for high availability

## Health Checks

- Web: `GET /health` — returns 200
- Socket: Socket.io ping/pong mechanism
- Database: Prisma health query
- Redis: Redis ping command
