import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { initDb, upsertPlayer, getPlayer, applyGuess, leaderboard, modelLeaderboard, impostorLeaderboard, hasJudged } from './db.js';
import { aiReply, translateText, generateIcebreaker } from './ai.js';
import { createAiPopulation, tickAgents, distance, sceneObservation, getConfiguredModels, getRandomName } from './world.js';
import { MAX_ROUNDS, GUESS, scoreGuess, sanitizeTarget, makeLocalizedMessage } from '../../../packages/shared/src/rules.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
async function loadEnvFile() {
  try {
    const raw = await fs.readFile(path.join(ROOT,'.env'),'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const t=line.trim(); if(!t || t.startsWith('#') || !t.includes('=')) continue;
      const i=t.indexOf('='); const k=t.slice(0,i).trim(); let v=t.slice(i+1).trim();
      if((v.startsWith('"')&&v.endsWith('"'))||(v.startsWith("'")&&v.endsWith("'"))) v=v.slice(1,-1);
      if(process.env[k]===undefined) process.env[k]=v;
    }
  } catch {}
}
await loadEnvFile();
const PORT = Number(process.env.SERVER_PORT || 8787);
const STANDALONE = path.join(ROOT, 'apps/standalone');
const WEB_PUBLIC = path.join(ROOT, 'apps/web/public');
const aiAgents = createAiPopulation(Number(process.env.AI_POPULATION || 18));
const humans = new Map(); // uuid -> runtime
const publicToUuid = new Map();
const sseClients = new Map();
const conversations = new Map();
const dbInfo = await initDb();
console.log(`[server] persistence=${dbInfo.mode}`);

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
}
function json(res,status,data){ cors(res); res.writeHead(status,{'Content-Type':'application/json'}); res.end(JSON.stringify(data)); }
async function body(req){ let s=''; for await (const c of req) s+=c; return s?JSON.parse(s):{}; }
function isUuid(v){ return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v||''); }
function sendSse(uuid,payload){ const res=sseClients.get(uuid); if(res){ res.write(`data: ${JSON.stringify(payload)}\n\n`); } }
function runtimeByPublicId(id){
  const ai=aiAgents.find(a=>a.id===id); if(ai) return ai;
  const uuid=publicToUuid.get(id); return uuid ? humans.get(uuid) : null;
}
function publicWorld(forUuid){
  const me=humans.get(forUuid);
  const out=[];
  for(const a of aiAgents) out.push(sanitizeTarget(a));
  for(const [uuid,h] of humans){
    if(uuid===forUuid || Date.now()-h.lastSeen>15000) continue;
    out.push(sanitizeTarget(h));
  }
  return { me: me?{id:me.publicId,x:me.x,z:me.z,rotation:me.rotation}:null, strangers:out, serverTime:Date.now() };
}
function publicConversation(c,forUuid){
  const isInitiator=c.initiatorUuid===forUuid;
  const isTarget=c.targetUuid===forUuid;
  const otherId=isInitiator?c.targetPublicId:c.initiatorPublicId;
  const other=runtimeByPublicId(otherId);
  const alreadyJudged=Boolean(c.alreadyJudged);
  const canGuess = !alreadyJudged && !c.revealed && (isInitiator || (c.initiatorType === 'ai' && isTarget));
  return {
    id:c.id, other:other?sanitizeTarget(other):{id:otherId,displayName:'Stranger'},
    roundsUsed:c.roundsUsed,maxRounds:MAX_ROUNDS,revealed:c.revealed,
    result:c.revealed?c.result:null,
    canGuess,
    alreadyJudged,
    initiatorType:c.initiatorType,
    isPartnerTyping: Boolean(c.isPartnerTyping),
    messages:c.messages.map(m=>({
      ...m,
      displayText: m.recipientUuid===forUuid ? (m.translatedText||m.originalText) : m.originalText,
      translationUnavailable: m.recipientUuid===forUuid && m.translationUnavailable
    }))
  };
}

const server=http.createServer(async(req,res)=>{
  try{
    cors(res); if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
    const u=new URL(req.url,`http://${req.headers.host}`);
    if(u.pathname==='/health') return json(res,200,{ok:true,persistence:dbInfo.mode,players:humans.size,ai:aiAgents.length});

    if(u.pathname==='/api/session' && req.method==='POST'){
      const b=await body(req);
      if(!isUuid(b.uuid)) return json(res,400,{error:'invalid uuid'});
      const displayName=String(b.displayName||`Guest-${b.uuid.slice(0,4)}`).slice(0,24);
      const language=String(b.language||'en').slice(0,12);
      const player=await upsertPlayer({uuid:b.uuid,displayName,preferredLanguage:language});
      let h=humans.get(b.uuid);
      if(!h){
        const publicId=`h_${crypto.randomBytes(4).toString('hex')}`;
        h={id:publicId,publicId,uuid:b.uuid,displayName,x:(Math.random()-.5)*10,z:(Math.random()-.5)*10,rotation:0,status:'available',language,lastSeen:Date.now(),type:'human'};
        humans.set(b.uuid,h); publicToUuid.set(publicId,b.uuid);
      } else { h.displayName=displayName;h.language=language;h.lastSeen=Date.now();h.status='available'; }
      return json(res,200,{player,publicId:h.publicId});
    }

    if(u.pathname==='/api/events' && req.method==='GET'){
      const uuid=u.searchParams.get('uuid'); if(!isUuid(uuid)||!humans.has(uuid)) return json(res,401,{error:'session required'});
      res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','Access-Control-Allow-Origin':'*'});
      res.write(`data: ${JSON.stringify({type:'world',...publicWorld(uuid)})}\n\n`);
      sseClients.set(uuid,res);
      req.on('close',()=>{ if(sseClients.get(uuid)===res) sseClients.delete(uuid); });
      return;
    }

    if(u.pathname==='/api/world' && req.method==='GET'){
      const uuid=u.searchParams.get('uuid'); return json(res,200,publicWorld(uuid));
    }

    if(u.pathname==='/api/position' && req.method==='POST'){
      const b=await body(req); const h=humans.get(b.uuid);
      if(!h) return json(res,404,{error:'human not found'});
      h.x=Number(b.x)||0; h.z=Number(b.z)||0; h.rotation=Number(b.rotation)||0; h.lastSeen=Date.now();
      return json(res,200,{ok:true});
    }

    if(u.pathname==='/api/leaderboard' && req.method==='GET') return json(res,200,{rows:await leaderboard(100)});
    if(u.pathname==='/api/leaderboard/models' && req.method==='GET') return json(res,200,{rows:await modelLeaderboard(getConfiguredModels())});
    if(u.pathname==='/api/leaderboard/impostors' && req.method==='GET') return json(res,200,{rows:await impostorLeaderboard(100)});

    if(u.pathname==='/api/conversation/start' && req.method==='POST'){
      const b=await body(req); const me=humans.get(b.uuid); const target=runtimeByPublicId(b.targetId);
      if(!me||!target) return json(res,404,{error:'player not found'});
      if(target.id===me.publicId) return json(res,400,{error:'cannot talk to self'});
      if(distance(me,target)>5.5) return json(res,400,{error:'move closer to talk'});
      const id=crypto.randomUUID();
      const targetUuid=target.type==='human'?target.uuid:null;
      const alreadyJudged=hasJudged(b.uuid, target.id, targetUuid);
      const c={
        id,
        initiatorUuid:b.uuid,
        initiatorPublicId:me.publicId,
        initiatorType:'human',
        targetPublicId:target.id,
        targetUuid,
        targetType:target.type,
        roundsUsed:0,
        revealed:false,
        alreadyJudged,
        isPartnerTyping:false,
        messages:[],
        createdAt:Date.now()
      };
      conversations.set(id,c); me.status='talking'; target.status='talking';
      if(targetUuid) sendSse(targetUuid,{type:'incoming_conversation',conversation:publicConversation(c,targetUuid)});
      return json(res,200,{conversation:publicConversation(c,b.uuid)});
    }

    if(u.pathname==='/api/conversation/typing' && req.method==='POST'){
      const b=await body(req); const c=conversations.get(b.conversationId);
      if(c && (c.initiatorUuid===b.uuid || c.targetUuid===b.uuid)){
        const otherUuid = c.initiatorUuid === b.uuid ? c.targetUuid : c.initiatorUuid;
        if(otherUuid) {
          sendSse(otherUuid, { type: 'partner_typing', conversationId: b.conversationId, typing: Boolean(b.typing) });
        }
      }
      return json(res,200,{ok:true});
    }

    if(u.pathname==='/api/conversation/message' && req.method==='POST'){
      const b=await body(req); const c=conversations.get(b.conversationId); const sender=humans.get(b.uuid);
      if(!c||!sender) return json(res,404,{error:'conversation not found'});
      if(c.revealed) return json(res,409,{error:'conversation already revealed'});
      const isInitiator=c.initiatorUuid===b.uuid;
      const isHumanTarget=c.targetUuid===b.uuid;
      if(!isInitiator && !isHumanTarget) return json(res,403,{error:'not a participant'});
      if(!c.alreadyJudged && c.roundsUsed>=MAX_ROUNDS) return json(res,409,{error:'five rounds reached; make your guess'});
      const text=String(b.text||'').trim().slice(0,500); if(!text)return json(res,400,{error:'empty message'});
      c.roundsUsed++;
      const recipientUuid=isInitiator?c.targetUuid:c.initiatorUuid;
      const recipient=isInitiator?runtimeByPublicId(c.targetPublicId):runtimeByPublicId(c.initiatorPublicId);
      const sourceLanguage=sender.language||'en'; const targetLanguage=recipient?.language||recipient?.nativeLanguage||'en';
      let tr={text,translated:false};
      if(recipientUuid) { try{tr=await translateText(text,sourceLanguage,targetLanguage);}catch{} }
      const msg={...makeLocalizedMessage({originalText:text,sourceLanguage,translatedText:tr.translated?tr.text:null,targetLanguage,senderId:sender.publicId}),recipientUuid,translationUnavailable:Boolean(tr.unavailable)};
      c.messages.push(msg);

      const isAiPartner = (c.targetType === 'ai' && isInitiator) || (c.initiatorType === 'ai' && isHumanTarget);
      if(isAiPartner){
        c.isPartnerTyping = true;
        const aiId = isInitiator ? c.targetPublicId : c.initiatorPublicId;
        const ai = runtimeByPublicId(aiId);
        
        // Asynchronously generate AI reply with realistic typing cadence
        (async () => {
          const startTime = Date.now();
          let reply;
          try{ reply=await aiReply(ai,c.messages,sceneObservation(ai),sender.language); }
          catch(err){ 
            console.warn('[ai]',err.message); 
            const lang = ai?.nativeLanguage || sender.language || 'en';
            reply = { text: lang === 'zh' ? '？我刚刚卡了一下，你说啥？' : 'yo sorry, I lagged for a sec, what?', language: lang }; 
          }
          let backTr={text:reply.text,translated:false};
          try{backTr=await translateText(reply.text,reply.language,sender.language);}catch{}
          
          // Realistic human typing delay:
          // 1. Reading & reaction time: short question ~600-1100ms, longer question ~1200-1800ms
          // 2. Typing speed: ~90-140ms per character with random jitter
          // 3. Short answers (e.g. "哈哈", "yo", "？", "没在看") take ~1.2s - 2.0s
          // 4. Medium answers take ~2.2s - 3.2s
          // 5. Long answers take ~3.5s - 4.8s
          const charCount = (reply.text || '').length;
          const readTime = Math.min(1600, Math.max(700, (c.messages.at(-1)?.originalText?.length || 5) * 45)) + (Math.random() * 400 - 200);
          const typeTime = charCount * (90 + Math.random() * 45);
          const rawTargetDelay = readTime + typeTime;
          // Clamp between 1300ms (fast short punchy reply) and 4900ms (thoughtful long reply)
          const targetDelay = Math.min(4900, Math.max(1300, rawTargetDelay));
          const elapsed = Date.now() - startTime;
          const waitMs = Math.max(150, targetDelay - elapsed);
          
          setTimeout(() => {
            if (!conversations.has(c.id) || c.revealed) return;
            c.isPartnerTyping = false;
            c.messages.push({...makeLocalizedMessage({originalText:reply.text,sourceLanguage:reply.language,translatedText:backTr.translated?backTr.text:null,targetLanguage:sender.language,senderId:ai.id}),recipientUuid:b.uuid,translationUnavailable:Boolean(backTr.unavailable)});
            sendSse(b.uuid, {type:'conversation_update', conversation:publicConversation(c,b.uuid)});
          }, waitMs);
        })().catch(err => {
          c.isPartnerTyping = false;
        });

        return json(res,200,{conversation:publicConversation(c,b.uuid)});
      } else if(recipientUuid){
        c.isPartnerTyping = false;
        sendSse(recipientUuid,{type:'conversation_update',conversation:publicConversation(c,recipientUuid)});
        sendSse(recipientUuid,{type:'partner_typing',conversationId:c.id,typing:false});
      }
      return json(res,200,{conversation:publicConversation(c,b.uuid)});
    }

    if(u.pathname==='/api/conversation/get' && req.method==='GET'){
      const uuid=u.searchParams.get('uuid'), id=u.searchParams.get('id'); const c=conversations.get(id);
      if(!c || (c.initiatorUuid!==uuid&&c.targetUuid!==uuid)) return json(res,404,{error:'not found'});
      return json(res,200,{conversation:publicConversation(c,uuid)});
    }

    if(u.pathname==='/api/conversation/leave' && req.method==='POST'){
      const b=await body(req); const c=conversations.get(b.conversationId);
      if(c && (c.initiatorUuid===b.uuid || c.targetUuid===b.uuid)){
        const initiator=runtimeByPublicId(c.initiatorPublicId), target=runtimeByPublicId(c.targetPublicId);
        if(initiator){
          initiator.status='available';
          if(initiator.type==='ai') initiator.displayName = getRandomName(initiator.nativeLanguage);
        }
        if(target){
          target.status='available';
          if(target.type==='ai') target.displayName = getRandomName(target.nativeLanguage);
        }
        const hu=humans.get(b.uuid); if(hu)hu.status='available';
        conversations.delete(b.conversationId);
        const otherUuid = c.initiatorUuid === b.uuid ? c.targetUuid : c.initiatorUuid;
        if(otherUuid) {
          const otherHu=humans.get(otherUuid); if(otherHu)otherHu.status='available';
          sendSse(otherUuid,{type:'conversation_ended',conversationId:b.conversationId});
        }
      }
      return json(res,200,{ok:true});
    }

    if(u.pathname==='/api/conversation/guess' && req.method==='POST'){
      const b=await body(req); const c=conversations.get(b.conversationId);
      if(!c) return json(res,404,{error:'conversation not found'});
      const isHumanInitiator = c.initiatorUuid === b.uuid;
      const isHumanTargetOfAi = c.initiatorType === 'ai' && c.targetUuid === b.uuid;
      if(!isHumanInitiator && !isHumanTargetOfAi) return json(res,403,{error:'only the testing participant can guess'});
      if(c.alreadyJudged) return json(res,409,{error:'already judged; free chat does not score'});
      if(c.revealed) return json(res,409,{error:'already revealed'});
      if(!Object.values(GUESS).includes(b.guess)) return json(res,400,{error:'invalid guess'});

      const targetType = isHumanInitiator ? c.targetType : c.initiatorType;
      const targetPublicId = isHumanInitiator ? c.targetPublicId : c.initiatorPublicId;
      const targetEntity = runtimeByPublicId(targetPublicId);
      const targetModel = targetType === 'ai' ? (targetEntity?.model || null) : null;
      const targetUuid = targetType === 'human' ? (targetEntity?.uuid || (isHumanInitiator ? c.targetUuid : c.initiatorUuid)) : null;

      const delta=scoreGuess(b.guess,targetType); c.revealed=true;
      c.result={guess:b.guess,targetType,delta,model:targetModel};
      const player=await applyGuess({uuid:b.uuid,targetType,guess:b.guess,delta,roundsUsed:c.roundsUsed,targetPublicId,model:targetModel,targetUuid});
      const initiator=runtimeByPublicId(c.initiatorPublicId), target=runtimeByPublicId(c.targetPublicId);
      if(initiator){
        initiator.status='available';
        if(initiator.type==='ai') initiator.displayName = getRandomName(initiator.nativeLanguage);
      }
      if(target){
        target.status='available';
        if(target.type==='ai') target.displayName = getRandomName(target.nativeLanguage);
      }
      const hu=humans.get(b.uuid); if(hu)hu.status='available';
      if(c.targetUuid) sendSse(c.targetUuid,{type:'conversation_revealed',conversation:publicConversation(c,c.targetUuid)});
      if(c.initiatorUuid && c.initiatorUuid!==b.uuid) sendSse(c.initiatorUuid,{type:'conversation_revealed',conversation:publicConversation(c,c.initiatorUuid)});
      return json(res,200,{conversation:publicConversation(c,b.uuid),player});
    }

    if(req.method==='GET') {
      let filePath=null;
      if(u.pathname==='/') filePath=path.join(STANDALONE,'index.html');
      else if(u.pathname==='/standalone.js') filePath=path.join(STANDALONE,'standalone.js');
      else if(u.pathname==='/standalone.css') filePath=path.join(STANDALONE,'standalone.css');
      else if(u.pathname.startsWith('/audio/')) filePath=path.join(WEB_PUBLIC,u.pathname);
      else if(u.pathname.startsWith('/assets/')) filePath=path.join(WEB_PUBLIC,u.pathname);
      if(filePath) {
        try {
          const data=await fs.readFile(filePath);
          const ext=path.extname(filePath);
          const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.wav':'audio/wav','.glb':'model/gltf-binary'}[ext]||'application/octet-stream';
          cors(res);res.writeHead(200,{'Content-Type':mime,'Cache-Control':ext==='.html'?'no-cache':'public, max-age=3600'});return res.end(data);
        } catch {}
      }
    }
    return json(res,404,{error:'not found'});
  } catch(err){ console.error(err); return json(res,500,{error:err.message||'server error'}); }
});

setInterval(()=>{
  const now=Date.now();
  for(const [id,c] of conversations){
    if(!c.revealed && now-c.createdAt>5*60*1000){
      const a=runtimeByPublicId(c.initiatorPublicId), b=runtimeByPublicId(c.targetPublicId);
      if(a)a.status='available'; if(b)b.status='available'; conversations.delete(id);
    }
  }
},30000).unref();

// AI natural proactive chat check (checked every 5s, lowered frequency)
setInterval(async ()=>{
  const now = Date.now();
  const activeHumans = Array.from(humans.values()).filter(h => (h.status === 'available' || !h.status) && now - (h.lastSeen || 0) < 30000);
  if (activeHumans.length === 0) return;

  for (const human of activeHumans) {
    let inChat = false;
    for (const c of conversations.values()) {
      if (!c.revealed && (c.initiatorUuid === human.uuid || c.targetUuid === human.uuid)) {
        inChat = true; break;
      }
    }
    if (inChat) continue;

    if (human.status !== 'available') human.status = 'available';

    const candidates = aiAgents.filter(a => {
      if (a.status !== 'available') return false;
      if (a.chatCooldownUntil && now < a.chatCooldownUntil) return false;
      return distance(a, human) <= 3.2;
    });

    if (candidates.length === 0) continue;
    // 20% chance every 5s check to initiate conversation
    if (Math.random() > 0.20) continue;

    const ai = candidates[Math.floor(Math.random() * candidates.length)];
    // Extended cooldown (45s to 75s) so AI doesn't persistently harass humans
    ai.chatCooldownUntil = now + 45000 + Math.random() * 30000;
    ai.status = 'talking';
    human.status = 'talking';

    const id = crypto.randomUUID();
    const judged = hasJudged(human.uuid, ai.id);

    let icebreaker;
    try {
      icebreaker = await generateIcebreaker(ai, sceneObservation(ai), ai.nativeLanguage || 'en');
    } catch {
      const lang = ai.nativeLanguage || 'en';
      icebreaker = { text: lang === 'zh' ? '哈喽，你是真人吗？' : 'yo, are you real?', language: lang };
    }

    let tr = { text: icebreaker.text, translated: false };
    if (human.language && human.language !== icebreaker.language) {
      try { tr = await translateText(icebreaker.text, icebreaker.language, human.language); } catch {}
    }

    const firstMsg = {
      ...makeLocalizedMessage({
        originalText: icebreaker.text,
        sourceLanguage: icebreaker.language,
        translatedText: tr.translated ? tr.text : null,
        targetLanguage: human.language,
        senderId: ai.id
      }),
      recipientUuid: human.uuid,
      translationUnavailable: Boolean(tr.unavailable)
    };

    const c = {
      id,
      initiatorUuid: null,
      initiatorPublicId: ai.id,
      initiatorType: 'ai',
      targetPublicId: human.publicId,
      targetUuid: human.uuid,
      targetType: 'human',
      roundsUsed: 0,
      revealed: false,
      alreadyJudged: judged,
      isPartnerTyping: true,
      messages: [],
      createdAt: now
    };
    conversations.set(id, c);
    // Send empty conversation with typing indicator so popup does not dump text instantly
    sendSse(human.uuid, { type: 'incoming_conversation', conversation: publicConversation(c, human.uuid) });

    // Wait realistic typing time before popping the first message (short greeting ~1.4s - 2.5s)
    const icebreakerLen = (icebreaker.text || '').length;
    const initialDelay = Math.min(2800, Math.max(1400, 1100 + icebreakerLen * 90 + Math.random() * 400));
    setTimeout(() => {
      const liveC = conversations.get(id);
      if (!liveC || liveC.revealed) return;
      liveC.messages.push(firstMsg);
      liveC.roundsUsed = 1;
      liveC.isPartnerTyping = false;
      sendSse(human.uuid, { type: 'conversation_update', conversation: publicConversation(liveC, human.uuid) });
    }, initialDelay);
    break;
  }
}, 5000).unref();

setInterval(()=>{
  tickAgents(aiAgents, 0.7, humans);
  for(const [uuid,h] of humans){
    if(Date.now()-h.lastSeen>60000){ publicToUuid.delete(h.publicId); humans.delete(uuid); sseClients.delete(uuid); continue; }
    sendSse(uuid,{type:'world',...publicWorld(uuid)});
  }
},700).unref();

server.listen(PORT,'0.0.0.0',()=>console.log(`[server] WHO IS AI? listening on http://0.0.0.0:${PORT}`));
