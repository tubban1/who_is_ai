# Deployment

## Minimal single-server deployment

For early playtests, run the dependency-free server/client path:

```bash
cp .env.example .env
node apps/server/src/index.js
```

Put the service behind HTTPS and a reverse proxy. Local persistence uses `data/local-db.json`.

## Production persistence

Set:

```env
DATABASE_URL=postgres://user:password@host:5432/whoisai
```

Run `database/schema.sql` before starting the service. The server automatically selects PostgreSQL when it can connect.

## Production AI

```env
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://provider.example/v1
AI_API_KEY=secret
AI_MODEL=model-name
```

The browser never receives the key.

## Docker

```bash
docker compose up --build
```

- React/R3F web: `http://localhost:8080`
- Game API/server: `http://localhost:8787`
- The server also serves the standalone client at `http://localhost:8787`

## Scaling note

V1 keeps active world and encounter state in one server process. For a global launch, shard users into world instances and move live presence/encounter routing to Redis or a dedicated realtime layer. Leaderboard state can remain centralized in PostgreSQL.
