import test from 'node:test';
import assert from 'node:assert/strict';
import { MAX_ROUNDS, GUESS, scoreGuess, canSendRound, sanitizeTarget, makeLocalizedMessage, sortLeaderboard } from '../packages/shared/src/rules.js';

test('scoring follows +1/-1/0 exactly',()=>{
  assert.equal(scoreGuess(GUESS.AI,'ai'),1);
  assert.equal(scoreGuess(GUESS.HUMAN,'ai'),-1);
  assert.equal(scoreGuess(GUESS.NOT_SURE,'ai'),0);
});

test('conversation stops after five rounds',()=>{
  assert.equal(MAX_ROUNDS,5);
  assert.equal(canSendRound({roundsUsed:4,revealed:false}),true);
  assert.equal(canSendRound({roundsUsed:5,revealed:false}),false);
  assert.equal(canSendRound({roundsUsed:1,revealed:true}),false);
});

test('public stranger representation never leaks identity type',()=>{
  const p=sanitizeTarget({id:'a_1',displayName:'Mira',x:1,z:2,type:'ai',nativeLanguage:'ja',secret:'x'});
  assert.deepEqual(Object.keys(p).sort(),['displayName','id','rotation','status','x','z'].sort());
  assert.equal('type' in p,false);
});

test('localized message preserves original and translated forms',()=>{
  const m=makeLocalizedMessage({originalText:'你好',sourceLanguage:'zh',translatedText:'Hello',targetLanguage:'en',senderId:'x',at:1});
  assert.equal(m.originalText,'你好');assert.equal(m.translatedText,'Hello');assert.equal(m.sourceLanguage,'zh');assert.equal(m.targetLanguage,'en');
});

test('leaderboard favors score then decision rate',()=>{
  const rows=sortLeaderboard([
    {displayName:'A',score:10,decisionRate:.2,correct:12},
    {displayName:'B',score:10,decisionRate:.9,correct:11},
    {displayName:'C',score:9,decisionRate:1,correct:30}
  ]);
  assert.deepEqual(rows.map(r=>r.displayName),['B','A','C']);
});

test('resolveModelConfig correctly resolves model-specific prefixes and fallback', async ()=>{
  const { resolveModelConfig } = await import('../apps/server/src/ai.js');
  process.env.CLAUDE_API_KEY = 'sk-claude-test';
  process.env.CLAUDE_BASE_URL = 'https://claude-relay.test/v1';
  process.env.CLAUDE_FORMAT = 'anthropic';

  const cfgClaude = resolveModelConfig('Claude-3.5-Sonnet');
  assert.equal(cfgClaude.apiKey, 'sk-claude-test');
  assert.equal(cfgClaude.baseUrl, 'https://claude-relay.test/v1');
  assert.equal(cfgClaude.format, 'anthropic');

  const cfgDefault = resolveModelConfig('Unknown-Model');
  assert.equal(cfgDefault.format, 'openai');
});
