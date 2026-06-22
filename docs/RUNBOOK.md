# TicTac Arena — Runbook

## Health Checks

```bash
# Web app health
curl https://tictacarena.com/health

# Socket server health (via WebSocket ping)

# Database health
docker-compose exec db pg_isready -U tictac

# Redis health
docker-compose exec redis redis-cli ping
```

## Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
docker-compose logs -f socket
docker-compose logs -f db

# Last N lines
docker-compose logs --tail=100 web
```

## Monitoring

- **Errors**: Sentry dashboard (https://sentry.io)
- **Analytics**: PostHog dashboard (https://app.posthog.com)
- **Infrastructure**: Docker metrics via `docker stats`
- **Database**: Neon Dashboard or pgAdmin

## Common Incidents

### High error rate
1. Check Sentry for new errors
2. Check recent deployments in CI/CD
3. Verify database connectivity
4. Check Redis connectivity
5. Review recent logs

### Slow matchmaking
1. Check Redis queue size: `LLEN matchmaking:queue:ranked`
2. Verify socket server connections
3. Check for stuck matches in DB
4. Restart socket server if needed

### Database connection pool exhaustion
1. Check active connections: `SELECT count(*) FROM pg_stat_activity`
2. Scale connection pool in Neon dashboard
3. Check for slow queries in pg_stat_activity
4. Restart connection pooler if needed

### Redis memory usage
1. Check used memory: `INFO memory`
2. Set maxmemory policy
3. Clear stale cache keys
4. Scale Redis instance

### WebSocket disconnections
1. Check socket server logs
2. Verify Redis adapter connectivity
3. Check load balancer config for timeout settings
4. Verify JWT token validity period

## Backup and Recovery

### Database Backup
```bash
docker-compose exec db pg_dump -U tictac tictac_arena > backup.sql
```

### Database Restore
```bash
cat backup.sql | docker-compose exec -T db psql -U tictac tictac_arena
```

### Redis Backup
```bash
docker-compose exec redis redis-cli SAVE
# RDB file is at /data/dump.rdb
```

## Scaling

### Web app
Increase replica count:
```yaml
# docker-compose.yml
services:
  web:
    deploy:
      replicas: 3
```

### Socket server
Add instances with Redis adapter:
```yaml
# docker-compose.yml
services:
  socket:
    deploy:
      replicas: 2
```

### Database
- Upgrade Neon plan for more connections
- Add read replicas for leaderboard queries
- Consider connection pooling with pgBouncer

## Security Incidents

### Suspicious activity detected
1. Check auth logs
2. Review failed login attempts
3. Ban offending IPs/accounts via admin API
4. Rotate AUTH_SECRET if compromised
5. Notify users if needed

### Rate limiting triggered
1. Check Redis rate limit keys: `KEYS ratelimit:*`
2. Review logs for IPs hitting limits
3. Adjust rate limit thresholds if needed
4. Check for DDoS patterns

## Rollback Procedure

```bash
# Revert to previous Docker image
docker-compose down
docker-compose up -d

# Or use git revert
git revert HEAD
git push origin main

# Rebuild and deploy
docker-compose build
docker-compose up -d
```
