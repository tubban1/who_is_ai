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

  process.env.DEEPSEEK_API_KEY = 'sk-deepseek-test';
  process.env.DEEPSEEK_BASE_URL = 'https://deepseek-relay.test/v1';
  const cfgDeepSeek = resolveModelConfig('deepseek-chat');
  assert.equal(cfgDeepSeek.apiKey, 'sk-deepseek-test');
  assert.equal(cfgDeepSeek.baseUrl, 'https://deepseek-relay.test/v1');

  const cfgDefault = resolveModelConfig('Unknown-Model');
  assert.equal(cfgDefault.format, 'openai');
});

test('prepareAiReplyBubbles handles single and multi-bubble responses cleanly', async () => {
  const { prepareAiReplyBubbles } = await import('../apps/server/src/ai.js');
  // Empty or short
  assert.deepEqual(prepareAiReplyBubbles('', 'zh'), ['']);
  
  // Predictable split when punctuated and seed triggers
  const splitResult = prepareAiReplyBubbles('哈哈哈哈，你也是刚来的？', 'zh', 10);
  assert.ok(Array.isArray(splitResult));
  assert.ok(splitResult.length >= 1 && splitResult.length <= 2);
  if (splitResult.length === 2) {
    assert.equal(splitResult[0], '哈哈哈哈');
    assert.equal(splitResult[1], '你也是刚来的？');
  }
});

test('getTargetAiPopulation balances floor population with dynamic human ratio', async () => {
  const { getTargetAiPopulation } = await import('../apps/server/src/world.js');
  // Floor population when humans are low:
  assert.equal(getTargetAiPopulation(0), 14);
  assert.equal(getTargetAiPopulation(1), 14);

  // Progressive scaling during moderate humans:
  assert.equal(getTargetAiPopulation(5), 16);
  assert.equal(getTargetAiPopulation(10), 21);
  assert.equal(getTargetAiPopulation(20), 28);

  // Near 1:1 balance at higher numbers:
  assert.equal(getTargetAiPopulation(30), 30);

  // Upper bound protection:
  assert.equal(getTargetAiPopulation(40), 36);
  assert.equal(getTargetAiPopulation(100), 36);
});

