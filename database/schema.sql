CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS players (
  uuid UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  preferred_language VARCHAR(12) NOT NULL DEFAULT 'en',
  score INTEGER NOT NULL DEFAULT 0,
  correct INTEGER NOT NULL DEFAULT 0,
  wrong INTEGER NOT NULL DEFAULT 0,
  not_sure INTEGER NOT NULL DEFAULT 0,
  encounters INTEGER NOT NULL DEFAULT 0,
  human_correct INTEGER NOT NULL DEFAULT 0,
  ai_correct INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guesser_uuid UUID NOT NULL REFERENCES players(uuid) ON DELETE CASCADE,
  target_public_id TEXT NOT NULL,
  target_type VARCHAR(8) NOT NULL CHECK (target_type IN ('human','ai')),
  guess VARCHAR(16),
  score_delta INTEGER,
  rounds_used INTEGER NOT NULL DEFAULT 0,
  model TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  sender_public_id TEXT NOT NULL,
  original_text TEXT NOT NULL,
  source_language VARCHAR(12) NOT NULL,
  translated_text TEXT,
  target_language VARCHAR(12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_score ON players(score DESC);
CREATE INDEX IF NOT EXISTS idx_encounters_guesser ON encounters(guesser_uuid, started_at DESC);
