import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { API, get, post } from './api.js';
import World from './World.jsx';
import ConversationPanel from './ConversationPanel.jsx';
import Leaderboard from './Leaderboard.jsx';
import Minimap from './Minimap.jsx';
import { startBgm, toggleBgm, getStoredBgmPreference, playSfx } from './audio.js';

import { LANGS, t } from './i18n.js';
function ensureUuid(){let id=localStorage.getItem('who-is-ai.uuid');if(!id){id=crypto.randomUUID();localStorage.setItem('who-is-ai.uuid',id)}return id}

export default function App(){
  const [started,setStarted]=useState(false); const [uuid]=useState(ensureUuid);
  const [nickname,setNickname]=useState(localStorage.getItem('who-is-ai.name')||'');
  const [language,setLanguage]=useState(localStorage.getItem('who-is-ai.lang')||((navigator.language||'zh').split('-')[0]));
  const [player,setPlayer]=useState(null); const [world,setWorld]=useState({strangers:[]});
  const [nearest,setNearest]=useState(null); const [conversation,setConversation]=useState(null);
  const [leaderboardOpen,setLeaderboardOpen]=useState(false); const [error,setError]=useState('');
  const [bgmActive,setBgmActive]=useState(getStoredBgmPreference);
  const eventRef=useRef(null); const audioRef=useRef(null);

  const enter=async()=>{
    setError('');
    try{
      const name=(nickname.trim()||`Guest-${uuid.slice(0,4)}`).slice(0,24);
      localStorage.setItem('who-is-ai.name',name);localStorage.setItem('who-is-ai.lang',language);
      const s=await post('/api/session',{uuid,displayName:name,language}); setPlayer(s.player); setStarted(true);
      setTimeout(()=>{
        audioRef.current?.play().catch(()=>{});
        if(getStoredBgmPreference()){
          startBgm();
          setBgmActive(true);
        }
      },100);
    }catch(e){setError(e.message)}
  };

  useEffect(()=>{
    if(!started)return;
    const es=new EventSource(`${API}/api/events?uuid=${encodeURIComponent(uuid)}`); eventRef.current=es;
    es.onmessage=(ev)=>{
      const d=JSON.parse(ev.data);
      if(d.type==='world')setWorld(d);
      if(d.type==='incoming_conversation'){
        setConversation(d.conversation);
        playSfx('encounter');
      }
      if(d.type==='conversation_update' && conversation?.id===d.conversation.id)setConversation(d.conversation);
      if(d.type==='conversation_revealed' && conversation?.id===d.conversation.id)setConversation(d.conversation);
      if(d.type==='conversation_ended' && conversation?.id===d.conversationId)setConversation(null);
    };
    return()=>es.close();
  },[started,uuid,conversation?.id]);

  useEffect(()=>{
    if(!started)return; const t=setInterval(async()=>{
      if(!conversation)return;
      try{const d=await get(`/api/conversation/get?uuid=${uuid}&id=${conversation.id}`);setConversation(d.conversation)}catch{}
    },1500); return()=>clearInterval(t);
  },[started,conversation?.id,uuid]);

  const nearestRef = useRef(nearest);
  nearestRef.current = nearest;
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  const startTalk=async()=>{
    const target = nearestRef.current;
    if(!target||conversationRef.current)return;
    try{
      const d=await post('/api/conversation/start',{uuid,targetId:target.id});
      setConversation(d.conversation);
    }catch(e){setError(e.message)}
  };

  useEffect(()=>{
    if(!started)return;
    const onKey=(e)=>{
      if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
      if(e.code==='KeyE' && !e.repeat && !conversationRef.current){
        startTalk();
      }
      if(e.code==='Escape'&&conversationRef.current){
        const c=conversationRef.current;
        if(!c.revealed){ post('/api/conversation/leave',{uuid,conversationId:c.id}).catch(()=>{}); }
        setConversation(null);
      }
    };
    window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);
  },[started,uuid]);

  const [playerPos,setPlayerPos]=useState({x:0,z:-6,rotation:0});
  const onPlayerMoved=(p)=>{
    setPlayerPos(p);
    post('/api/position',{uuid,...p}).catch(()=>{});
  };
  const onConversationChange=(c,p)=>{setConversation(c);if(p)setPlayer(p)};

  if(!started)return <div className="landing">
    <div className="landing-orb"></div>
    <div className="landing-card glass">
      <div className="eyebrow">{t('globalTuringTest', language)}</div>
      <h1>WHO IS <span>AI?</span></h1>
      <p className="tagline">{t('tagline', language)}</p>
      <div className="rule-strip">
        <b>{t('ruleCorrect', language)}</b>
        <b>{t('ruleWrong', language)}</b>
        <b>{t('ruleNotSure', language)}</b>
      </div>
      <label>
        {t('nicknameLabel', language)}
        <input
          value={nickname}
          onChange={e=>setNickname(e.target.value)}
          maxLength={24}
          placeholder={t('nicknamePlaceholder', language, { id: uuid.slice(0,4) })}
        />
      </label>
      <label>
        {t('myLanguageLabel', language)}
        <select value={language} onChange={e=>{
          setLanguage(e.target.value);
          localStorage.setItem('who-is-ai.lang', e.target.value);
        }}>
          {LANGS.map(([v,n])=><option value={v} key={v}>{n}</option>)}
        </select>
      </label>
      <button className="primary" onClick={enter}>{t('enterWorld', language)}</button>
      <small>{t('uuidNotice', language)}</small>
      {error&&<div className="error">{error}</div>}
    </div>
  </div>;

  return <div className="game-shell">
    <audio ref={audioRef} src="/audio/plaza_ambient.wav" loop volume="0.18"/>
    <Canvas shadows camera={{position:[0,5,8],fov:60,near:0.8,far:850}}>
      <color attach="background" args={['#030913']}/>
      {/* Soft atmospheric depth fog (220m - 650m) */}
      <fog attach="fog" args={['#030913',220,650]}/>
      <ambientLight intensity={0.9}/>
      <directionalLight position={[30,50,20]} intensity={2.4} castShadow shadow-mapSize={[2048,2048]}/>
      <pointLight position={[0,9,-6]} intensity={45} distance={55} color="#fed7aa"/>
      <Stars radius={300} depth={90} count={2000} factor={3.5}/>
      <World strangers={world.strangers||[]} onNearest={setNearest} onPlayerMoved={onPlayerMoved} conversationOpen={!!conversation} language={language}/>
    </Canvas>

    <header className="hud-top glass">
      <div><b>WHO IS AI?</b><span>{t('liveWorld', language)}</span></div>
      <div className="score">{t('scoreLabel', language)} <strong>{player?.score??0}</strong></div>
    </header>
    <div className="top-actions">
      <button
        className={`audio-toggle-btn glass ${!bgmActive ? 'muted' : ''}`}
        onClick={() => {
          playSfx('click');
          const next = toggleBgm();
          setBgmActive(next);
        }}
        title="MIDI Music Toggle"
      >
        <span>{bgmActive ? '🔊' : '🔇'}</span>
        <span>{t('audioBgmToggle', language)}: {bgmActive ? t('audioOn', language) : t('audioOff', language)}</span>
      </button>
      <button className="rank-button-inline glass" onClick={() => { playSfx('click'); setLeaderboardOpen(true); }}>
        {t('globalLeaderboardBtn', language)}
      </button>
    </div>
    <div className="controls glass">
      <b>WASD / ↑↓←→</b> {t('controlMove', language)} <b>Shift</b> {t('controlRun', language)} <b>E</b> {t('controlTalk', language)}
    </div>
    {/* Minimap HUD */}
    <Minimap playerPos={playerPos} playerRotation={playerPos?.rotation || 0} strangers={world.strangers || []} language={language}/>
    {nearest&&!conversation&&<div className="interaction">
      <span>E</span>
      <div>
        <b>{t('talkTo', language, { name: nearest.displayName })}</b>
        <small>{t('areTheyHuman', language)}</small>
      </div>
    </div>}
    {conversation&&<ConversationPanel uuid={uuid} language={language} conversation={conversation} onChange={onConversationChange} onClose={()=>setConversation(null)}/>} 
    {leaderboardOpen&&<Leaderboard player={player} onClose={()=>setLeaderboardOpen(false)} language={language}/>} 
    {error&&<div className="toast" onClick={()=>setError('')}>{error}</div>}
  </div>
}
