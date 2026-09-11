# Architecture

```text
Browser
  ├─ React/R3F client (production path)
  └─ Standalone WebGL client (zero-dependency verified path)
          │
          ├─ HTTP actions
          └─ Server-Sent Events world stream
                    │
              Node authoritative server
              ├─ world positions
              ├─ encounter state
              ├─ identity truth
              ├─ five-round enforcement
              ├─ scoring
              ├─ translation
              └─ AI provider
                    │
              Persistence adapter
              ├─ PostgreSQL (production)
              └─ JSON file (local fallback)
```

## Identity protection

Clients receive the same public representation for humans and AI:

```json
{
  "id": "public-id",
  "displayName": "Mira",
  "x": 12.3,
  "z": -4.1,
  "rotation": 1.2,
  "status": "available"
}
```

The `type` field is held only in server memory. It is returned only after a guess is committed.

## World sync

The server emits public world snapshots over SSE roughly every 700 ms. Clients send compact position updates. The server clamps world bounds and validates encounter distance before creating a conversation.

## Encounters

The initiator may send at most five question rounds. The target can answer between questions. AI targets answer server-side. Human targets receive the same encounter via SSE and can reply from their own client.

A guess is immutable and ends the encounter for the guessing player.

## AI

`AI_PROVIDER=mock` uses multilingual deterministic personas and needs no key. `openai-compatible` calls `/chat/completions` server-side. The model sees encounter history and a tiny local scene observation, not hidden world identity state.
