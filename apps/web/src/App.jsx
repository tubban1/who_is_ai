import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { API, get, post } from './api.js';
import World from './World.jsx';
import ConversationPanel from './ConversationPanel.jsx';
import Leaderboard from './Leaderboard.jsx';
import Minimap from './Minimap.jsx';
import MobileControls from './MobileControls.jsx';
import { startBgm, stopBgm, toggleBgm, getStoredBgmPreference, playSfx, toggleSfx, getStoredSfxPreference } from './audio.js';

import { LANGS, t } from './i18n.js';
function ensureUuid(){let id=localStorage.getItem('who-is-ai.uuid');if(!id){id=crypto.randomUUID();localStorage.setItem('who-is-ai.uuid',id)}return id}

import { getRandomName } from './names.js';

export default function App(){
  const [started,setStarted]=useState(false); const [uuid]=useState(ensureUuid);
  const initialLang = localStorage.getItem('who-is-ai.lang') || ((navigator.language || 'zh').split('-')[0]);
  const [language,setLanguage]=useState(initialLang);
  const [nickname,setNickname]=useState(() => {
    const saved = localStorage.getItem('who-is-ai.name');
    if (saved && !saved.startsWith('Guest-') && !saved.startsWith('访客-')) return saved;
    const generated = getRandomName(initialLang);
    return generated;
  });
  const [player,setPlayer]=useState(null); const [world,setWorld]=useState({strangers:[]});
  const [nearest,setNearest]=useState(null); const [conversation,setConversation]=useState(null);
  const [leaderboardOpen,setLeaderboardOpen]=useState(false); const [error,setError]=useState('');
  const [bgmActive,setBgmActive]=useState(getStoredBgmPreference);
  const [sfxActive,setSfxActive]=useState(getStoredSfxPreference);
  const [touchInput,setTouchInput]=useState({ x: 0, y: 0, run: false });
  const [partnerTyping,setPartnerTyping]=useState(false);
  const eventRef=useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const updateVv = () => {
      const vv = window.visualViewport;
      if (!vv) return;
      const kbHeight = Math.max(0, window.innerHeight - vv.height);
      document.documentElement.style.setProperty('--keyboard-height', `${kbHeight}px`);
      document.documentElement.style.setProperty('--visual-viewport-height', `${vv.height}px`);
    };
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateVv);
      window.visualViewport.addEventListener('scroll', updateVv);
      updateVv();
    }
    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateVv);
        window.visualViewport.removeEventListener('scroll', updateVv);
      }
    };
  }, []);

  const enter=async()=>{
    setError('');
    try{
      const name=(nickname.trim()||getRandomName(language)).slice(0,24);
      localStorage.setItem('who-is-ai.name',name);localStorage.setItem('who-is-ai.lang',language);
      const s=await post('/api/session',{uuid,displayName:name,language}); setPlayer(s.player); setStarted(true);
      setTimeout(()=>{
        const bgmPref = getStoredBgmPreference();
        if(bgmPref){
          startBgm();
          setBgmActive(true);
        } else {
          stopBgm();
          setBgmActive(false);
        }
      },100);
    }catch(e){setError(e.message)}
  };

  const nearestRef = useRef(nearest);
  nearestRef.current = nearest;
  const conversationRef = useRef(conversation);
  conversationRef.current = conversation;

  useEffect(()=>{
    if(!started)return;
    const es=new EventSource(`${API}/api/events?uuid=${encodeURIComponent(uuid)}`); eventRef.current=es;
    es.onmessage=(ev)=>{
      try {
        const d=JSON.parse(ev.data);
        if(d.type==='world')setWorld(d);
        if(d.type==='incoming_conversation'){
          setConversation(d.conversation);
          setPartnerTyping(Boolean(d.conversation?.isPartnerTyping));
          playSfx('encounter');
        }
        if(d.type==='partner_typing' && conversationRef.current?.id===d.conversationId){
          setPartnerTyping(Boolean(d.typing));
        }
        if(d.type==='conversation_update'){
          setPartnerTyping(Boolean(d.conversation?.isPartnerTyping));
          setConversation(curr => (curr && curr.id === d.conversation.id ? d.conversation : curr));
        }
        if(d.type==='conversation_revealed'){
          setPartnerTyping(false);
          setConversation(curr => (curr && curr.id === d.conversation.id ? d.conversation : curr));
        }
        if(d.type==='conversation_ended'){
          setPartnerTyping(false);
          setConversation(curr => (curr && curr.id === d.conversationId ? null : curr));
        }
      } catch(e) {}
    };
    return()=>es.close();
  },[started,uuid]);

  useEffect(()=>{
    if(!started)return;
    const t=setInterval(async()=>{
      const cur = conversationRef.current;
      if(!cur)return;
      try{
        const d=await get(`/api/conversation/get?uuid=${uuid}&id=${cur.id}`);
        if(d?.conversation){
          setConversation(curr => (curr && curr.id === d.conversation.id ? d.conversation : curr));
        }
      }catch{}
    },1200);
    return()=>clearInterval(t);
  },[started,uuid]);

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
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span>{t('nicknameLabel', language)}</span>
          <button 
            type="button" 
            style={{background:'none',border:'none',color:'#75f2da',fontSize:'11px',cursor:'pointer',padding:0}}
            onClick={()=>setNickname(getRandomName(language))}
          >
            🎲 {language === 'zh' ? '随机昵称' : 'Randomize'}
          </button>
        </div>
        <input
          value={nickname}
          onChange={e=>setNickname(e.target.value)}
          maxLength={24}
          placeholder={getRandomName(language)}
        />
      </label>
      <label>
        {t('myLanguageLabel', language)}
        <select value={language} onChange={e=>{
          const nextLang = e.target.value;
          setLanguage(nextLang);
          localStorage.setItem('who-is-ai.lang', nextLang);
          // If the player hadn't customized a personal non-default nickname, switch default name to match new language
          setNickname(prev => {
            const saved = localStorage.getItem('who-is-ai.name');
            if (saved && !saved.startsWith('Guest-') && !saved.startsWith('访客-') && saved === prev) return prev;
            return getRandomName(nextLang);
          });
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
    <Canvas
      dpr={[1, typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1]}
      gl={{ powerPreference: 'high-performance', antialias: true, failIfMajorPerformanceCaveat: false }}
      shadows
      camera={{position:[0,5,8],fov:60,near:0.8,far:850}}
    >
      <color attach="background" args={['#030913']}/>
      {/* Soft atmospheric depth fog (220m - 650m) */}
      <fog attach="fog" args={['#030913',220,650]}/>
      <ambientLight intensity={0.9}/>
      <directionalLight position={[30,50,20]} intensity={2.4} castShadow shadow-mapSize={[1024,1024]}/>
      <pointLight position={[0,9,-6]} intensity={45} distance={55} color="#fed7aa"/>
      <Stars radius={300} depth={90} count={1200} factor={3.5}/>
      <World
        strangers={world.strangers||[]}
        onNearest={setNearest}
        onPlayerMoved={onPlayerMoved}
        conversationOpen={!!conversation}
        language={language}
        touchInput={touchInput}
      />
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
        title="Music & Ambient Toggle"
      >
        <span>{bgmActive ? '🎵' : '🔇'}</span>
        <span>{t('audioBgmToggle', language)}: {bgmActive ? t('audioOn', language) : t('audioOff', language)}</span>
      </button>
      <button
        className={`audio-toggle-btn glass ${!sfxActive ? 'muted' : ''}`}
        onClick={() => {
          const next = toggleSfx();
          setSfxActive(next);
          if (next) playSfx('click');
        }}
        title="Sound Effects Toggle"
      >
        <span>{sfxActive ? '🔔' : '🔕'}</span>
        <span>{t('audioSfxToggle', language)}: {sfxActive ? t('audioOn', language) : t('audioOff', language)}</span>
      </button>
      <button className="rank-button-inline glass" onClick={() => { playSfx('click'); setLeaderboardOpen(true); }}>
        {t('globalLeaderboardBtn', language)}
      </button>
    </div>
    <div className="controls glass">
      <b>WASD / ↑↓←→</b> {t('controlMove', language)} <b>Shift</b> {t('controlRun', language)} <b>E</b> {t('controlTalk', language)}
    </div>

    {/* On-screen Virtual Joystick & Action buttons for Mobile / Touch devices */}
    {!conversation && (
      <MobileControls
        onMove={setTouchInput}
        onAction={startTalk}
        actionVisible={Boolean(nearest && !conversation)}
        actionLabel={nearest ? t('talkTo', language, { name: nearest.displayName }) : 'E'}
      />
    )}

    {/* Minimap HUD (hidden during active conversation to keep screen clear) */}
    {!conversation && (
      <Minimap playerPos={playerPos} playerRotation={playerPos?.rotation || 0} strangers={world.strangers || []} language={language}/>
    )}
    {nearest&&!conversation&&<div className="interaction">
      <span>E</span>
      <div>
        <b>{t('talkTo', language, { name: nearest.displayName })}</b>
        <small>{t('areTheyHuman', language)}</small>
      </div>
    </div>}
    {conversation&&<ConversationPanel uuid={uuid} language={language} conversation={conversation} partnerTyping={partnerTyping || Boolean(conversation?.isPartnerTyping)} onChange={onConversationChange} onClose={()=>setConversation(null)}/>} 
    {leaderboardOpen&&<Leaderboard player={player} onClose={()=>setLeaderboardOpen(false)} language={language}/>} 
    {error&&<div className="toast" onClick={()=>setError('')}>{error}</div>}
  </div>
}
