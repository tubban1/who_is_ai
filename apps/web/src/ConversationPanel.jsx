import React, { useMemo, useState } from 'react';
import { post } from './api.js';
import { t } from './i18n.js';
import { playSfx } from './audio.js';

export default function ConversationPanel({uuid,language='zh',conversation,partnerTyping=false,onChange,onClose}){
  const [text,setText]=useState(''); const [busy,setBusy]=useState(false); const [showOriginal,setShowOriginal]=useState({}); const [error,setError]=useState('');
  const [isComposing, setIsComposing] = useState(false);
  const messagesEndRef = React.useRef(null);
  const lastTypingPingRef = React.useRef(0);

  // Auto-scroll to bottom whenever messages change, partner starts typing, or input is focused
  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [conversation?.messages, partnerTyping]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setText(val);
    const now = Date.now();
    if (conversation?.id) {
      if (val.trim()) {
        if (now - lastTypingPingRef.current > 1800) {
          lastTypingPingRef.current = now;
          post('/api/conversation/typing', { uuid, conversationId: conversation.id, typing: true }).catch(() => {});
        }
      } else {
        post('/api/conversation/typing', { uuid, conversationId: conversation.id, typing: false }).catch(() => {});
      }
    }
  };

  const send=async()=>{
    if(!text.trim()||busy)return;
    setBusy(true);
    setError('');
    playSfx('send');
    try{
      post('/api/conversation/typing', { uuid, conversationId: conversation.id, typing: false }).catch(() => {});
      const d=await post('/api/conversation/message',{uuid,conversationId:conversation.id,text});
      setText('');
      onChange(d.conversation);
      setTimeout(() => scrollToBottom('auto'), 50);
    }catch(e){
      setError(e.message);
    }finally{
      setBusy(false);
    }
  };

  const guess=async(g)=>{
    if(busy)return;
    setBusy(true);
    try{
      const d=await post('/api/conversation/guess',{uuid,conversationId:conversation.id,guess:g});
      if(d.conversation?.result?.delta===1)playSfx('victory');
      else if(d.conversation?.result?.delta===-1)playSfx('defeat');
      else playSfx('draw');
      onChange(d.conversation,d.player);
    }catch(e){
      setError(e.message);
    }finally{
      setBusy(false);
    }
  };

  const handleClose = async () => {
    if (!conversation.revealed) {
      try { await post('/api/conversation/leave', { uuid, conversationId: conversation.id }); } catch {}
    }
    onClose();
  };

  const myMessages=conversation.messages||[];
  const isMyMsg=m=>m.senderId!==conversation.other.id;
  const isFreeChat=Boolean(conversation.alreadyJudged);
  const roundsLocked = !isFreeChat && conversation.roundsUsed >= 5;

  const guessLabels = {
    human: t('humanVerdict', language),
    ai: t('aiVerdict', language),
    not_sure: t('notSureVerdict', language)
  };

  return <div className="conversation glass">
    <div className="conv-head">
      <div>
        <span className={`status-dot ${partnerTyping ? 'typing' : ''}`}></span>
        <b>{conversation.other.displayName}</b>
        <small>
          {partnerTyping ? (
            <span className="partner-typing-indicator">{t('partnerTyping', language)}</span>
          ) : isFreeChat ? (
            t('knownParticipant', language)
          ) : (
            t('strangerHidden', language)
          )}
        </small>
      </div>
      <button onClick={handleClose} title="Close">×</button>
    </div>
    {!conversation.revealed && !isFreeChat && <div className="round-meter">
      <span>{t('roundMeter', language)}</span>
      {Array.from({length:5},(_,i)=><i key={i} className={i<conversation.roundsUsed?'used':''}>{i+1}</i>)}
    </div>}
    {isFreeChat && <div className="judged-banner">{t('alreadyJudgedBanner', language)}</div>}
    <div className="messages">
      {myMessages.length===0&&<div className="empty-chat">{t('emptyChat', language)}</div>}
      {myMessages.map((m,i)=>{
        const mine=isMyMsg(m); const hasAlt=Boolean(m.translatedText)&&m.translatedText!==m.originalText; const shown=!mine&&showOriginal[i]?m.originalText:(m.displayText||m.originalText);
        return <div className={`bubble ${mine?'mine':'theirs'}`} key={i}><div>{shown}</div>{!mine&&hasAlt&&<button className="original-toggle" onClick={()=>setShowOriginal(s=>({...s,[i]:!s[i]}))}>{showOriginal[i]?t('showTranslation', language):t('showOriginal', language)} · {m.sourceLanguage}</button>}{!mine&&m.translationUnavailable&&m.sourceLanguage!==language&&<small className="translation-note">{t('translationUnavailable', language)}</small>}</div>
      })}
      {partnerTyping && (
        <div className="bubble theirs typing-bubble">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className="typing-text">{t('partnerTyping', language)}</span>
        </div>
      )}
      <div ref={messagesEndRef} style={{ height: 1, margin: 0, padding: 0 }} />
    </div>
    {conversation.revealed ? <div className={`reveal ${conversation.result.delta===1?'win':conversation.result.delta===-1?'lose':'neutral'}`}>
      <div className="reveal-kicker">{t('theyWere', language)}</div>
      <div className="identity">{conversation.result.targetType === 'human' ? t('humanVerdict', language) : t('aiVerdict', language)} {conversation.result.model && <small style={{display:'block',fontSize:'13px',color:'#7ce6d8',fontWeight:500,letterSpacing:'0.04em',marginTop:'4px'}}>{conversation.result.model}</small>}</div>
      <div className="delta">{t('pointDelta', language, { delta: conversation.result.delta > 0 ? '+1' : conversation.result.delta < 0 ? '−1' : '0' })}</div>
      <p>{t('youGuessed', language, { guess: guessLabels[conversation.result.guess] || conversation.result.guess })}</p>
      <button className="primary" onClick={handleClose}>{t('keepWalking', language)}</button>
    </div> : <>
      <div className="composer">
        <input 
          value={text} 
          onChange={handleInputChange} 
          onFocus={() => setTimeout(() => scrollToBottom('smooth'), 150)}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (isComposing || e.nativeEvent.isComposing || e.keyCode === 229) return;
              e.preventDefault();
              send();
            }
          }} 
          disabled={roundsLocked||busy} 
          placeholder={roundsLocked?t('composerRoundsLocked', language):t('composerPlaceholder', language)}
        />
        <button onClick={send} disabled={roundsLocked||busy}>{t('sendBtn', language)}</button>
      </div>
      {conversation.canGuess&&<div className="guess-zone"><small>{t('yourVerdictTitle', language)}</small><div><button onClick={()=>guess('human')}>{t('guessHumanBtn', language)}</button><button onClick={()=>guess('ai')}>{t('guessAiBtn', language)}</button><button className="muted" onClick={()=>guess('not_sure')}>{t('guessNotSureBtn', language)}</button></div></div>}
      {!conversation.canGuess&&!isFreeChat&&<div className="passive-note">{t('passiveNoteTesting', language)}</div>}
      {isFreeChat&&<div className="passive-note">{t('passiveNoteCasual', language)}</div>}
    </>}
    {error&&<div className="error compact">{error}</div>}
  </div>
}
