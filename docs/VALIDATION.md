# Validation report

The delivery was validated in the build environment with the following checks.

## Passed

- `node --check` on the dependency-free server and standalone WebGL client.
- `npm test`: 6/6 tests passed.
- A real server integration test created a UUID session, moved the player into encounter range, opened an AI encounter, completed five rounds, rejected the sixth round, guessed AI, updated score from 0 to 1, and returned the result in the global leaderboard.
- A human-human cross-language integration path preserved both English and Chinese original messages and their language metadata.
- Static runtime check returned HTTP 200 for `/`, `/standalone.js`, `/health`, and `/assets/avatar.glb`.
- All generated GLB files can be parsed as valid GLB scenes by `trimesh`.

## Environment limitation

`npm install` for the React/React Three Fiber client timed out because package-registry access was unavailable in the execution environment. Therefore this report does **not** claim a completed Vite production build here.

To make the delivery independently testable despite that limitation, the package includes `apps/standalone`, a zero-frontend-dependency WebGL client served directly by the verified Node server. The React/R3F source remains included as the production-quality upgrade path.
