import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { API, get, post } from './api.js';
import World from './World.jsx';
import NightLighting from './NightLighting.jsx';
import AtmosphereSky from './AtmosphereSky.jsx';
import SceneEffects from './SceneEffects.jsx';
import { ATMOSPHERES, atmosphereLabels, chooseTimeOfDay } from './atmosphere.js';
import ConversationPanel from './ConversationPanel.jsx';
import Leaderboard from './Leaderboard.jsx';
import FeedbackModal from './FeedbackModal.jsx';
import FeedbackListPage from './FeedbackListPage.jsx';
import Minimap from './Minimap.jsx';
import MobileControls from './MobileControls.jsx';
import { startBgm, stopBgm, toggleBgm, getStoredBgmPreference, playSfx, toggleSfx, getStoredSfxPreference } from './audio.js';

import { LANGS, t } from './i18n.js';
function ensureUuid(){let id=localStorage.getItem('who-is-ai.uuid');if(!id){id=crypto.randomUUID();localStorage.setItem('who-is-ai.uuid',id)}return id}

import { getRandomName } from './names.js';

export default function App(){
  const [started,setStarted]=useState(false); const [uuid]=useState(ensureUuid);
  const [timeOfDay, setTimeOfDay] = useState('day');
  const atmosphere = ATMOSPHERES[timeOfDay];
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
  const [leaderboardOpen,setLeaderboardOpen]=useState(false); const [feedbackOpen,setFeedbackOpen]=useState(false); const [error,setError]=useState('');
  const isFeedbackRoute = () => {
    if (typeof window === 'undefined') return false;
    const h = (window.location.hash || '').toLowerCase();
    const p = (window.location.pathname || '').toLowerCase();
    const s = (window.location.search || '').toLowerCase();
    return h.includes('feedback') || p.includes('feedback') || s.includes('feedback');
  };
  const [viewRoute, setViewRoute] = useState(() => isFeedbackRoute() ? 'feedbacks' : 'game');
  const [bgmActive,setBgmActive]=useState(getStoredBgmPreference);
  const [sfxActive,setSfxActive]=useState(getStoredSfxPreference);
  const [touchInput,setTouchInput]=useState({ x: 0, y: 0, run: false });
  const [partnerTyping,setPartnerTyping]=useState(false);
  const eventRef=useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleRouteChange = () => {
      setViewRoute(isFeedbackRoute() ? 'feedbacks' : 'game');
    };
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

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
      const s=await post('/api/session',{uuid,displayName:name,language});
      setTimeOfDay(chooseTimeOfDay()); setPlayer(s.player); setStarted(true);
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

  const inviteFrom = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('invite') || null;
  }, []);

  const [inviteToast, setInviteToast] = useState(false);
  const handleInviteFriend = async () => {
    const inviteUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/?invite=${encodeURIComponent(nickname || 'BundWalker')}`
      : 'https://whoisai.xyz';
    
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
        playSfx('click');
        setInviteToast(true);
        setTimeout(() => setInviteToast(false), 3500);
      } catch (e) {
        setError(e.message);
      }
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('autostart') && !started) {
      enter();
    }
  }, []);

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
    es.onerror = () => {
      // If mobile connection drops or screen sleeps, reconnect
      setTimeout(() => {
        if (!started) return;
        post('/api/session', { uuid, displayName: nickname, language }).catch(() => {});
      }, 1000);
    };
    return()=>es.close();
  },[started,uuid,nickname,language]);

  // Handle mobile screen wake-up / tab visibility change
  useEffect(() => {
    if (!started) return;
    const onWake = () => {
      if (document.visibilityState === 'visible') {
        post('/api/session', { uuid, displayName: nickname, language }).catch(() => {});
      }
    };
    window.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    return () => {
      window.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('focus', onWake);
    };
  }, [started, uuid, nickname, language]);

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
    }catch(e){
      // If session dropped, immediately re-establish session and retry talk once
      if (e.message?.includes('not found') || e.message?.includes('session')) {
        try {
          await post('/api/session', { uuid, displayName: nickname, language });
          const d2 = await post('/api/conversation/start', { uuid, targetId: target.id });
          setConversation(d2.conversation);
          return;
        } catch {}
      }
      setError(e.message);
    }
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

  if (viewRoute === 'feedbacks') {
    return (
      <FeedbackListPage
        onBack={() => {
          if (typeof window !== 'undefined') {
            if (window.location.hash) {
              window.location.hash = '';
            }
            if (window.location.pathname.includes('feedback') || window.location.search.includes('feedback')) {
              window.history.pushState(null, '', '/');
            }
          }
          setViewRoute('game');
        }}
      />
    );
  }

  if(!started)return <div className="landing">
    <div className="landing-orb"></div>
    <div className="landing-card glass">
      {inviteFrom && (
        <div className="invite-banner glass">
          <span className="invite-banner-icon">💌</span>
          <span className="invite-banner-text">{t('friendInvitedBanner', language, { inviter: inviteFrom })}</span>
        </div>
      )}
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
        <small>{t('uuidNotice', language)}</small>
      </div>
      {error&&<div className="error">{error}</div>}
    </div>
  </div>;

  return <div className="game-shell" data-time-of-day={timeOfDay}>
    <Canvas
      dpr={[1, typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 1.5) : 1]}
      gl={{ powerPreference: 'high-performance', antialias: true, failIfMajorPerformanceCaveat: false }}
      shadows
      camera={{position:[0,5,8],fov:60,near:0.8,far:850}}
    >
      <color attach="background" args={[atmosphere.sky]}/>
      <fog attach="fog" args={[atmosphere.fog, atmosphere.fogNear, atmosphere.fogFar]}/>
      <AtmosphereSky timeOfDay={timeOfDay} />
      <NightLighting timeOfDay={timeOfDay} />
      <SceneEffects timeOfDay={timeOfDay} conversationOpen={!!conversation} />
      <World
        timeOfDay={timeOfDay}
        strangers={world.strangers||[]}
        onNearest={setNearest}
        onPlayerMoved={onPlayerMoved}
        conversationOpen={!!conversation}
        conversation={conversation}
        uuid={uuid}
        language={language}
        touchInput={touchInput}
      />
    </Canvas>

    <header className="hud-top glass">
      <div><b>WHO IS AI?</b><span>{t('liveWorld', language)}</span></div>
      <div className="score">{t('scoreLabel', language)} <strong>{player?.score??0}</strong></div>
    </header>
    <div className="top-actions">
      <button className="atmosphere-toggle glass" data-testid="atmosphere-toggle"
        title={atmosphereLabels(language)[2]}
        onClick={() => setTimeOfDay(current => current === 'day' ? 'night' : 'day')}>
        <span aria-hidden="true">{timeOfDay === 'day' ? '☀️' : '🌙'}</span>
        <span>{atmosphereLabels(language)[timeOfDay === 'day' ? 0 : 1]}</span>
      </button>
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
          playSfx('click');
          const next = toggleSfx();
          setSfxActive(next);
          if (next) playSfx('click');
        }}
        title="Sound Effects Toggle"
      >
        <span>{sfxActive ? '🔔' : '🔕'}</span>
        <span>{t('audioSfxToggle', language)}: {sfxActive ? t('audioOn', language) : t('audioOff', language)}</span>
      </button>
      <button className="invite-button-inline glass" onClick={handleInviteFriend} title={t('inviteFriendsBtn', language)}>
        <span aria-hidden="true">🔗</span>
        <span>{t('inviteFriendsBtn', language)}</span>
      </button>
      <button className="rank-button-inline glass" onClick={() => { playSfx('click'); setLeaderboardOpen(true); }}>
        {t('globalLeaderboardBtn', language)}
      </button>
      <button className="rank-button-inline glass" onClick={() => { playSfx('click'); setFeedbackOpen(true); }}>
        {t('feedbackBtn', language)}
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
    {conversation&&<ConversationPanel uuid={uuid} language={language} conversation={conversation} partnerTyping={partnerTyping || Boolean(conversation?.isPartnerTyping)} onChange={onConversationChange} onClose={()=>setConversation(null)} nickname={nickname}/>} 
    {leaderboardOpen&&<Leaderboard player={player} onClose={()=>setLeaderboardOpen(false)} language={language}/>} 
    {feedbackOpen&&<FeedbackModal uuid={uuid} displayName={nickname} language={language} onClose={()=>setFeedbackOpen(false)}/>}
    {inviteToast&&<div className="toast toast-success" onClick={()=>setInviteToast(false)}>{t('copiedInviteToast', language)}</div>}
    {error&&<div className="toast" onClick={()=>setError('')}>{error}</div>}
  </div>
}
