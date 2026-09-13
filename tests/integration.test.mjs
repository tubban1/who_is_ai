import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const root=path.resolve(import.meta.dirname,'..');
const port=8899; const base=`http://127.0.0.1:${port}`;
const dataDir=await fs.mkdtemp(path.join(os.tmpdir(),'whoisai-test-'));
const child=spawn(process.execPath,['apps/server/src/index.js'],{cwd:root,env:{...process.env,SERVER_PORT:String(port),AI_PROVIDER:'mock',AI_POPULATION:'4',WHOISAI_DATA_DIR:dataDir,DATABASE_URL:''},stdio:['ignore','pipe','pipe']});

async function waitServer(){for(let i=0;i<40;i++){try{const r=await fetch(`${base}/health`);if(r.ok)return}catch{}await new Promise(r=>setTimeout(r,100))}throw new Error('server did not start')}
async function post(p,b){const r=await fetch(base+p,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b)});return {status:r.status,data:await r.json()}}

test('real server: UUID persistence, proximity encounter, 5 rounds and reveal',async(t)=>{
  t.after(()=>child.kill('SIGTERM'));
  await waitServer();
  const uuid=crypto.randomUUID();
  let r=await post('/api/session',{uuid,displayName:'Tester',language:'en'});assert.equal(r.status,200);assert.equal(r.data.player.score,0);
  const world=await (await fetch(`${base}/api/world?uuid=${uuid}`)).json();assert.ok(world.strangers.length>=4);
  const target=world.strangers[0];
  r=await post('/api/position',{uuid,x:target.x,z:target.z,rotation:0});assert.equal(r.status,200);
  r=await post('/api/conversation/start',{uuid,targetId:target.id});assert.equal(r.status,200);const cid=r.data.conversation.id;
  assert.equal('targetType' in r.data.conversation,false);
  for(let i=0;i<5;i++){r=await post('/api/conversation/message',{uuid,conversationId:cid,text:`question ${i}`});assert.equal(r.status,200);assert.equal(r.data.conversation.roundsUsed,i+1)}
  r=await post('/api/conversation/message',{uuid,conversationId:cid,text:'sixth'});assert.equal(r.status,409);
  r=await post('/api/conversation/guess',{uuid,conversationId:cid,guess:'ai'});assert.equal(r.status,200);assert.equal(r.data.conversation.result.targetType,'ai');assert.equal(r.data.conversation.result.delta,1);assert.equal(r.data.player.score,1);
  const lb=await (await fetch(`${base}/api/leaderboard`)).json();assert.equal(lb.rows[0].displayName,'Tester');assert.equal(lb.rows[0].score,1);

  // AI agent is seamlessly recycled with a new identity so players can continuously encounter fresh personas
  const worldAfter = await (await fetch(`${base}/api/world?uuid=${uuid}`)).json();
  const nextTarget = worldAfter.strangers[0];
  await post('/api/position',{uuid,x:nextTarget.x,z:nextTarget.z,rotation:0});
  let rSecond = await post('/api/conversation/start',{uuid,targetId:nextTarget.id});
  assert.equal(rSecond.status,200);
  assert.equal(rSecond.data.conversation.alreadyJudged,false);
  assert.equal(rSecond.data.conversation.canGuess,true);
  let rLeave = await post('/api/conversation/leave',{uuid,conversationId:rSecond.data.conversation.id});
  assert.equal(rLeave.status,200);

  // Model leaderboard returns stats for models
  const mlb = await (await fetch(`${base}/api/leaderboard/models`)).json();
  assert.ok(Array.isArray(mlb.rows));
  assert.ok(mlb.rows.length >= 1);
  assert.ok('undetectedRate' in mlb.rows[0]);
  assert.ok('model' in mlb.rows[0]);
  assert.ok(mlb.rows.some(m => m.encounters >= 1));

  // Cross-language human-human path preserves originals even when mock translation is unavailable.
  const uuid2=crypto.randomUUID();
  r=await post('/api/session',{uuid:uuid2,displayName:'第二位玩家',language:'zh'});assert.equal(r.status,200);
  const w2=await (await fetch(`${base}/api/world?uuid=${uuid}`)).json();
  const humanTarget=w2.strangers.find(x=>x.displayName==='第二位玩家');assert.ok(humanTarget);
  await post('/api/position',{uuid,x:humanTarget.x,z:humanTarget.z,rotation:0});
  r=await post('/api/conversation/start',{uuid,targetId:humanTarget.id});assert.equal(r.status,200);const hcid=r.data.conversation.id;
  r=await post('/api/conversation/message',{uuid,conversationId:hcid,text:'Where are you from?'});assert.equal(r.status,200);
  let incoming=await (await fetch(`${base}/api/conversation/get?uuid=${uuid2}&id=${hcid}`)).json();
  assert.equal(incoming.conversation.messages[0].originalText,'Where are you from?');
  assert.equal(incoming.conversation.messages[0].sourceLanguage,'en');
  r=await post('/api/conversation/message',{uuid:uuid2,conversationId:hcid,text:'我来自另一个语言世界。'});assert.equal(r.status,200);
  const back=await (await fetch(`${base}/api/conversation/get?uuid=${uuid}&id=${hcid}`)).json();
  assert.equal(back.conversation.messages.at(-1).originalText,'我来自另一个语言世界。');
  assert.equal(back.conversation.messages.at(-1).sourceLanguage,'zh');

  // Guess the human target as 'ai' (impostor fooled the guesser)
  let rGuessHuman = await post('/api/conversation/guess',{uuid,conversationId:hcid,guess:'ai'});
  assert.equal(rGuessHuman.status,200);
  assert.equal(rGuessHuman.data.conversation.result.targetType,'human');
  assert.equal(rGuessHuman.data.conversation.result.delta,-1);

  const ilb = await (await fetch(`${base}/api/leaderboard/impostors`)).json();
  assert.ok(Array.isArray(ilb.rows));
  assert.ok(ilb.rows.length >= 1);
  assert.equal(ilb.rows[0].displayName, '第二位玩家');
  assert.equal(ilb.rows[0].testedCount, 1);
  assert.equal(ilb.rows[0].deceivedCount, 1);
  assert.equal(ilb.rows[0].deceptionRate, 100);

  const rootPage=await fetch(base+'/');assert.equal(rootPage.status,200);assert.match(await rootPage.text(),/WHO IS/);
  const asset=await fetch(base+'/assets/avatar.glb');assert.equal(asset.status,200);assert.ok((await asset.arrayBuffer()).byteLength>1000);
});
