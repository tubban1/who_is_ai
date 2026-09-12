import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.WHOISAI_DATA_DIR || path.resolve(here, '../../../data');
const jsonPath = path.join(dataDir, 'local-db.json');
let pool = null;
const judgedSet = new Set();

export function hasJudged(uuid, targetPublicId, targetUuid = null) {
  if (!uuid) return false;
  if (targetPublicId && judgedSet.has(`${uuid}:${targetPublicId}`)) return true;
  if (targetUuid && judgedSet.has(`${uuid}:${targetUuid}`)) return true;
  return false;
}

function recordJudgedInternal(uuid, targetPublicId, targetUuid = null) {
  if (uuid && targetPublicId) judgedSet.add(`${uuid}:${targetPublicId}`);
  if (uuid && targetUuid) judgedSet.add(`${uuid}:${targetUuid}`);
}

async function loadJson() {
  await fs.mkdir(dataDir, { recursive: true });
  try { return JSON.parse(await fs.readFile(jsonPath, 'utf8')); }
  catch { return { players: {}, encounters: [] }; }
}
async function saveJson(data) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(jsonPath, JSON.stringify(data, null, 2));
}

export async function initDb() {
  judgedSet.clear();
  if (!process.env.DATABASE_URL) {
    const data = await loadJson();
    for (const e of (data.encounters || [])) {
      const u = e.uuid || e.guesser_uuid;
      const t = e.targetPublicId || e.target_public_id;
      const tu = e.targetUuid || e.target_uuid;
      if (u && t) judgedSet.add(`${u}:${t}`);
      if (u && tu) judgedSet.add(`${u}:${tu}`);
    }
    return { mode: 'json' };
  }
  try {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query('SELECT 1');
    const { rows } = await pool.query('SELECT guesser_uuid, target_public_id, target_uuid FROM encounters');
    for (const r of rows) {
      if (r.guesser_uuid && r.target_public_id) judgedSet.add(`${r.guesser_uuid}:${r.target_public_id}`);
      if (r.guesser_uuid && r.target_uuid) judgedSet.add(`${r.guesser_uuid}:${r.target_uuid}`);
    }
    return { mode: 'postgres' };
  } catch (err) {
    console.warn('[db] falling back to json storage:', err.message);
    pool = null;
    return { mode: 'json' };
  }
}

export async function upsertPlayer({ uuid, displayName, preferredLanguage }) {
  if (pool) {
    const { rows } = await pool.query(`
      INSERT INTO players(uuid, display_name, preferred_language)
      VALUES ($1,$2,$3)
      ON CONFLICT (uuid) DO UPDATE SET
        display_name=EXCLUDED.display_name,
        preferred_language=EXCLUDED.preferred_language,
        last_seen_at=NOW()
      RETURNING *`, [uuid, displayName, preferredLanguage]);
    return normalizeRow(rows[0]);
  }
  const data = await loadJson();
  const prev = data.players[uuid] || {
    uuid, score: 0, correct: 0, wrong: 0, notSure: 0, encounters: 0,
    humanCorrect: 0, aiCorrect: 0, deceivedCount: 0, confusedCount: 0, testedCount: 0, createdAt: new Date().toISOString()
  };
  data.players[uuid] = {
    ...prev, displayName, preferredLanguage, lastSeenAt: new Date().toISOString()
  };
  await saveJson(data);
  return data.players[uuid];
}

export async function getPlayer(uuid) {
  if (pool) {
    const { rows } = await pool.query('SELECT * FROM players WHERE uuid=$1', [uuid]);
    return rows[0] ? normalizeRow(rows[0]) : null;
  }
  const data = await loadJson();
  return data.players[uuid] || null;
}

export async function saveFeedback({ uuid, contactType, contactValue, content, displayName, language }) {
  if (pool) {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedbacks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        player_uuid UUID REFERENCES players(uuid) ON DELETE SET NULL,
        display_name TEXT,
        contact_type VARCHAR(32) NOT NULL,
        contact_value TEXT NOT NULL,
        content TEXT NOT NULL,
        language VARCHAR(16),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `).catch(() => {});
    const { rows } = await pool.query(`
      INSERT INTO feedbacks (player_uuid, display_name, contact_type, contact_value, content, language)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [uuid, displayName || null, contactType, contactValue, content, language || null]);
    return rows[0];
  }
  const data = await loadJson();
  if (!data.feedbacks) data.feedbacks = [];
  const item = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    playerUuid: uuid,
    displayName,
    contactType,
    contactValue,
    content,
    language,
    createdAt: new Date().toISOString()
  };
  data.feedbacks.push(item);
  await saveJson(data);
  return item;
}

export async function getFeedbacks(limit = 100) {
  if (pool) {
    try {
      const { rows } = await pool.query(`
        SELECT id, player_uuid, display_name, contact_type, contact_value, content, language, created_at
        FROM feedbacks
        ORDER BY created_at DESC
        LIMIT $1
      `, [limit]);
      return rows.map(r => ({
        id: r.id,
        playerUuid: r.player_uuid,
        displayName: r.display_name,
        contactType: r.contact_type,
        contactValue: r.contact_value,
        content: r.content,
        language: r.language,
        createdAt: r.created_at
      }));
    } catch {
      return [];
    }
  }
  const data = await loadJson();
  const list = Array.isArray(data.feedbacks) ? [...data.feedbacks] : [];
  return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
}

export async function applyGuess({ uuid, targetType, guess, delta, roundsUsed, targetPublicId, model = null, targetUuid = null }) {
  recordJudgedInternal(uuid, targetPublicId, targetUuid);
  if (pool) {
    const correct = delta === 1;
    const wrong = delta === -1;
    const notSure = delta === 0;
    await pool.query(`ALTER TABLE encounters ADD COLUMN IF NOT EXISTS model TEXT;`).catch(()=>{});
    await pool.query(`ALTER TABLE encounters ADD COLUMN IF NOT EXISTS target_uuid TEXT;`).catch(()=>{});
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS deceived_count INTEGER DEFAULT 0;`).catch(()=>{});
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS confused_count INTEGER DEFAULT 0;`).catch(()=>{});
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS tested_count INTEGER DEFAULT 0;`).catch(()=>{});
    const { rows } = await pool.query(`
      UPDATE players SET
        score=score+$2,
        correct=correct+$3,
        wrong=wrong+$4,
        not_sure=not_sure+$5,
        encounters=encounters+1,
        human_correct=human_correct+$6,
        ai_correct=ai_correct+$7,
        last_seen_at=NOW()
      WHERE uuid=$1 RETURNING *`, [uuid, delta, correct?1:0, wrong?1:0, notSure?1:0,
        correct && targetType==='human'?1:0, correct && targetType==='ai'?1:0]);
    await pool.query(`INSERT INTO encounters(guesser_uuid,target_public_id,target_type,guess,score_delta,rounds_used,model,target_uuid,ended_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,NOW())`, [uuid,targetPublicId,targetType,guess,delta,roundsUsed,model,targetUuid]);
    
    if (targetType === 'human' && targetUuid) {
      const isDeceived = guess === 'ai' ? 1 : 0;
      const isConfused = guess === 'not_sure' ? 1 : 0;
      await pool.query(`
        UPDATE players SET
          tested_count=COALESCE(tested_count,0)+1,
          deceived_count=COALESCE(deceived_count,0)+$2,
          confused_count=COALESCE(confused_count,0)+$3
        WHERE uuid=$1`, [targetUuid, isDeceived, isConfused]).catch(()=>{});
    }
    return normalizeRow(rows[0]);
  }
  const data = await loadJson();
  const p = data.players[uuid];
  if (!p) throw new Error('player not found');
  p.score += delta;
  p.correct += delta === 1 ? 1 : 0;
  p.wrong += delta === -1 ? 1 : 0;
  p.notSure += delta === 0 ? 1 : 0;
  p.encounters += 1;
  p.humanCorrect += delta === 1 && targetType === 'human' ? 1 : 0;
  p.aiCorrect += delta === 1 && targetType === 'ai' ? 1 : 0;
  p.lastSeenAt = new Date().toISOString();

  if (targetType === 'human' && targetUuid && data.players[targetUuid]) {
    const tp = data.players[targetUuid];
    tp.testedCount = (tp.testedCount || 0) + 1;
    if (guess === 'ai') tp.deceivedCount = (tp.deceivedCount || 0) + 1;
    else if (guess === 'not_sure') tp.confusedCount = (tp.confusedCount || 0) + 1;
  }

  data.encounters.push({ uuid, targetPublicId, targetType, targetUuid, guess, delta, roundsUsed, model, at: new Date().toISOString() });
  await saveJson(data);
  return p;
}

export async function leaderboard(limit=100) {
  if (pool) {
    const { rows } = await pool.query(`SELECT * FROM players ORDER BY score DESC, correct DESC, encounters DESC LIMIT $1`, [limit]);
    return rows.map(normalizeRow).map(toLeaderboard);
  }
  const data = await loadJson();
  return Object.values(data.players).map(toLeaderboard)
    .sort((a,b)=>(b.score-a.score)||(b.decisionRate-a.decisionRate)||(b.correct-a.correct))
    .slice(0,limit);
}

export async function impostorLeaderboard(limit=100) {
  if (pool) {
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS deceived_count INTEGER DEFAULT 0;`).catch(()=>{});
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS confused_count INTEGER DEFAULT 0;`).catch(()=>{});
    await pool.query(`ALTER TABLE players ADD COLUMN IF NOT EXISTS tested_count INTEGER DEFAULT 0;`).catch(()=>{});
    const { rows } = await pool.query(
      `SELECT * FROM players WHERE COALESCE(tested_count,0) > 0 ORDER BY ((COALESCE(deceived_count,0) + COALESCE(confused_count,0)*0.5) / NULLIF(tested_count,0)) DESC, deceived_count DESC, tested_count DESC LIMIT $1`,
      [limit]
    );
    return rows.map(normalizeRow).map(toImpostorLeaderboard);
  }
  const data = await loadJson();
  return Object.values(data.players)
    .filter(p => (p.testedCount || 0) > 0)
    .map(toImpostorLeaderboard)
    .sort((a, b) => (b.deceptionRate - a.deceptionRate) || (b.deceivedCount - a.deceivedCount) || (b.testedCount - a.testedCount))
    .slice(0, limit);
}

export async function modelLeaderboard(configuredModels = []) {
  let encountersList = [];
  if (pool) {
    try {
      const { rows } = await pool.query(`SELECT model, target_type, guess FROM encounters WHERE target_type='ai'`);
      encountersList = rows.map(r => ({ model: r.model, targetType: r.target_type, guess: r.guess }));
    } catch { encountersList = []; }
  } else {
    const data = await loadJson();
    encountersList = (data.encounters || []).filter(e => e.targetType === 'ai');
  }

  const stats = new Map();
  for (const m of configuredModels) {
    if (m) stats.set(m, { model: m, encounters: 0, guessedHuman: 0, guessedAi: 0, guessedNotSure: 0 });
  }

  for (const e of encountersList) {
    const m = e.model || (configuredModels[0] || 'Default-AI');
    if (!stats.has(m)) {
      stats.set(m, { model: m, encounters: 0, guessedHuman: 0, guessedAi: 0, guessedNotSure: 0 });
    }
    const s = stats.get(m);
    s.encounters += 1;
    if (e.guess === 'human') s.guessedHuman += 1;
    else if (e.guess === 'ai') s.guessedAi += 1;
    else if (e.guess === 'not_sure') s.guessedNotSure += 1;
  }

  const result = Array.from(stats.values()).map(s => {
    const undetectedRate = s.encounters > 0
      ? Math.round(((s.guessedHuman + s.guessedNotSure * 0.5) / s.encounters) * 100)
      : 0;
    return {
      ...s,
      undetectedRate
    };
  });

  return result.sort((a, b) =>
    (b.undetectedRate - a.undetectedRate) ||
    (b.encounters - a.encounters) ||
    a.model.localeCompare(b.model)
  );
}

function toLeaderboard(p) {
  const decisions = (p.correct||0)+(p.wrong||0);
  return {
    displayName: p.displayName,
    score: p.score||0,
    correct: p.correct||0,
    wrong: p.wrong||0,
    notSure: p.notSure||0,
    encounters: p.encounters||0,
    accuracy: decisions ? p.correct/decisions : 0,
    decisionRate: p.encounters ? decisions/p.encounters : 0
  };
}
function toImpostorLeaderboard(p) {
  const tested = p.testedCount || 0;
  const deceived = p.deceivedCount || 0;
  const confused = p.confusedCount || 0;
  const rate = tested > 0 ? Math.round(((deceived + confused * 0.5) / tested) * 100) : 0;
  return {
    displayName: p.displayName,
    testedCount: tested,
    deceivedCount: deceived,
    confusedCount: confused,
    deceptionRate: rate
  };
}

function normalizeRow(r) {
  return {
    uuid: r.uuid,
    displayName: r.display_name,
    preferredLanguage: r.preferred_language,
    score: r.score,
    correct: r.correct,
    wrong: r.wrong,
    notSure: r.not_sure,
    encounters: r.encounters,
    humanCorrect: r.human_correct,
    aiCorrect: r.ai_correct,
    deceivedCount: r.deceived_count || 0,
    confusedCount: r.confused_count || 0,
    testedCount: r.tested_count || 0,
    createdAt: r.created_at,
    lastSeenAt: r.last_seen_at
  };
}
