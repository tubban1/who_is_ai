# WHO IS AI? — V1

A browser-based 3D social Turing-test game. Walk through a shared world, meet strangers, talk for at most five rounds, then decide whether the other participant is **HUMAN**, **AI**, or **NOT SURE**.

## V1 rules

- Walk around one shared 3D world.
- Approach a stranger and press **E** to talk.
- You may send at most **5 question rounds** in an encounter.
- Guess **HUMAN / AI / NOT SURE** at any time.
- Correct: **+1**. Wrong: **-1**. Not sure: **0**.
- The score is persisted under an anonymous browser UUID.
- A global leaderboard ranks all UUID identities.
- Human-human and human-AI messages use the same translation pipeline.
- The receiver sees a translation in their preferred language and can always reveal the original text.

## Stack

- Web: React + Vite + Three.js + React Three Fiber
- Server: dependency-light Node.js HTTP + Server-Sent Events
- Persistence: PostgreSQL when configured, JSON-file fallback for local play
- AI: OpenAI-compatible server-side provider abstraction + mock mode
- Assets: GLB models + procedural Blender generator

## Quick start — zero dependency playable client

The project includes a self-contained WebGL client, so the core game can be tested even when npm registry access is unavailable:

```bash
cp .env.example .env
npm run play
```

or simply:

```bash
node apps/server/src/index.js
```

Open `http://localhost:8787`.

This runs the actual multiplayer/AI/score server plus the built-in WebGL client. No frontend package install is required for this path.

## React / React Three Fiber development client

For the richer production client:

```bash
npm install
npm run dev
```

Open `http://localhost:5173`. The dev script starts the server on `8787` and Vite on `5173`.

### Run server only

```bash
npm --workspace apps/server run start
```

### Run with Docker

```bash
docker compose up --build
```

Then open `http://localhost:8080`.

## AI configuration

Default:

```env
AI_PROVIDER=mock
```

No API key is required. To connect an OpenAI-compatible endpoint:

```env
AI_PROVIDER=openai-compatible
AI_BASE_URL=https://your-endpoint.example/v1
AI_API_KEY=your-key
AI_MODEL=your-model
```

Keys are used only on the server.

## Anonymous identity

The web client creates a UUID with `crypto.randomUUID()` and saves it to `localStorage` under `who-is-ai.uuid`. The server upserts that UUID and attaches all score history to it. The same browser therefore resumes the same anonymous account. A future account-linking flow can bind that UUID to email/Google/Apple without resetting score.

## Cross-language communication

Each participant chooses a preferred UI language. Every message stores:

- original text
- source language
- translated text for the receiver
- receiver language

The translated text is shown by default, but **Show original** is always available. This prevents translation from erasing all human linguistic signals while still letting people who do not share a language play together.

## Database

`database/schema.sql` contains the production PostgreSQL schema. Without `DATABASE_URL`, local development persists to `data/local-db.json`.

## 3D assets

Runtime GLBs live in:

```text
apps/web/public/assets/
```

The included assets are lightweight original placeholders generated for this project. Production art can replace files with the same names without changing gameplay code.

Generate them again with:

```bash
npm run generate-assets
```

A Blender-side generation reference is included at `assets/blender/generate_scene.py`.

## Tests

```bash
npm test
```

The tests cover scoring, five-round enforcement, UUID handling, identity reveal rules, language-message representation, and leaderboard ordering.

## Important V1 scope

V1 intentionally uses one shared map. Parallel Beijing/New York worlds are documented as a V2 path in `docs/V2_IDEAS.md`; the first release should validate whether the core loop itself is fun before increasing world complexity.
