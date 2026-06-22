# TicTac Arena — Socket.io Events

## Connection

Connect with JWT token:

```js
const socket = io("wss://api.tictacarena.com", {
  auth: { token: "jwt-token" },
});
```

## Client → Server Events

### queue:join
Join matchmaking queue.
```json
{ "mode": "ranked" }
```

### queue:leave
Leave matchmaking queue.
```json
{}
```

### move:submit
Submit a game move.
```json
{ "matchId": "abc123", "position": 4 }
```

### chat:message
Send a chat message.
```json
{ "matchId": "abc123", "content": "Good game!" }
```
Omit `matchId` for global chat. Set `isGlobal: true` explicitly.

### typing:start / typing:stop
Typing indicators.
```json
{ "matchId": "abc123" }
```

### spectator:join / spectator:leave
Join/leave spectator mode.
```json
{ "matchId": "abc123" }
```

## Server → Client Events

### player:connected
```json
{ "userId": "abc", "username": "Player1" }
```

### player:disconnected
```json
{ "userId": "abc", "username": "Player1" }
```

### presence:update
```json
{ "userId": "abc", "username": "Player1", "status": "online|offline|in_game|away" }
```

### match:found
```json
{ "matchId": "abc", "playerSymbol": "X", "playerX": {...}, "playerO": {...} }
```

### match:start
```json
{ "matchId": "abc" }
```

### move:accepted
```json
{ "matchId": "abc", "boardState": {...}, "gameResult": {...}, "position": 4 }
```

### move:rejected
```json
{ "matchId": "abc", "error": "Not your turn" }
```

### match:update
```json
{ "matchId": "abc", "boardState": {...}, "status": "playing", "nextTurnId": "..." }
```

### match:end
```json
{ "matchId": "abc", "winnerId": "...", "isDraw": false, "boardState": {...} }
```

### chat:message
```json
{ "id": "msg1", "content": "hi", "username": "Player1", "createdAt": "..." }
```

### spectator:count
```json
{ "matchId": "abc", "count": 5 }
```

### error
```json
{ "message": "Match not found" }
```
