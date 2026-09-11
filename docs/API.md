# HTTP API

## Session

`POST /api/session`

```json
{"uuid":"...","displayName":"Guest","language":"en"}
```

Creates or resumes the persistent anonymous account.

## World events

`GET /api/events?uuid=...`

Server-Sent Events stream for world snapshots and incoming encounter changes.

## Position

`POST /api/position`

```json
{"uuid":"...","x":1.2,"z":4.5,"rotation":0.3}
```

## Conversation

`POST /api/conversation/start`

```json
{"uuid":"...","targetId":"a_01"}
```

The target must be nearby.

`POST /api/conversation/message`

```json
{"uuid":"...","conversationId":"...","text":"Where are you from?"}
```

Initiator messages consume one of five rounds. Replies from a human target do not consume an additional initiator round.

`GET /api/conversation/get?uuid=...&id=...`

Returns the caller's safe view of the conversation.

`POST /api/conversation/guess`

```json
{"uuid":"...","conversationId":"...","guess":"ai"}
```

Valid values: `human`, `ai`, `not_sure`.

## Leaderboard

`GET /api/leaderboard`

Returns the top 100 anonymous identities by score.
