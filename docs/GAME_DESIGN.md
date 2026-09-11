# WHO IS AI? — V1 Game Design

## One-line pitch

Walk through a beautiful shared 3D world, meet a stranger, talk for up to five rounds, then decide whether they are human or AI.

## Player-visible rules

1. Walk around.
2. Approach someone and talk.
3. You have at most five rounds.
4. Guess HUMAN, AI, or NOT SURE.
5. Correct +1, wrong -1, not sure 0.

Everything else stays behind the scenes.

## Why one shared map in V1

The first product risk is whether the social Turing-test loop is fun and repeatable. One shared map creates clear spatial presence and avoids confusing references to incompatible surroundings. Multiple parallel worlds are a V2 expansion once retention is proven.

## Cross-language fairness

Translation is mandatory for global reach, but translation can erase typo patterns, non-native phrasing, slang, punctuation habits, and other human signals. V1 therefore uses a dual representation:

- translated text is shown first for comprehension;
- original text is always one click away;
- humans and AI use the same server-side translation mechanism;
- translation metadata is never an identity hint.

## AI behavior

AI should not act like a static chatbot. Each AI has a small persona, a native language, a movement target, response-length preference, and an imperfect conversational style. In mock mode these are heuristic. In API mode a model receives only the current encounter history plus local scene observations.

## 3D interaction

The map is a compact futuristic international plaza: trees, benches, lamps, water, kiosks and towers. Players can walk and run. Nearby strangers are highlighted. Press E to begin an encounter. The world remains visible while the conversation panel is open.

## V1 non-goals

- combat
- crafting
- character classes
- complex inventory
- multiple maps
- voice chat
- persistent friends/social graph
- model-specific public rankings

These can be revisited only after the core loop is validated.
