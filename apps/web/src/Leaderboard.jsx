import React, { useEffect, useState } from 'react';
import { get } from './api.js';
import { t } from './i18n.js';

export default function Leaderboard({ player, onClose, language = 'zh' }) {
  const [tab, setTab] = useState('players');
  const [playerRows, setPlayerRows] = useState([]);
  const [modelRows, setModelRows] = useState([]);
  const [impostorRows, setImpostorRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      get('/api/leaderboard').catch(() => ({ rows: [] })),
      get('/api/leaderboard/models').catch(() => ({ rows: [] })),
      get('/api/leaderboard/impostors').catch(() => ({ rows: [] }))
    ]).then(([playersData, modelsData, impostorsData]) => {
      setPlayerRows(playersData.rows || []);
      setModelRows(modelsData.rows || []);
      setImpostorRows(impostorsData.rows || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="leaderboard glass">
        <div className="leader-head">
          <div>
            <div className="eyebrow">
              {tab === 'players' ? t('leaderboardEyebrow', language) : tab === 'impostors' ? t('impostorEyebrow', language) : t('aiBenchmarkEyebrow', language)}
            </div>
            <h2>
              {tab === 'players' ? t('leaderboardTitle', language) : tab === 'impostors' ? t('impostorLeaderboardTitle', language) : t('aiLeaderboardTitle', language)}
            </h2>
          </div>
          <button onClick={onClose}>×</button>
        </div>

        <div className="leader-tabs">
          <button
            className={`leader-tab ${tab === 'players' ? 'active' : ''}`}
            onClick={() => setTab('players')}
          >
            {t('tabPlayers', language)}
          </button>
          <button
            className={`leader-tab ${tab === 'impostors' ? 'active' : ''}`}
            onClick={() => setTab('impostors')}
          >
            {t('tabImpostors', language)}
          </button>
          <button
            className={`leader-tab ${tab === 'models' ? 'active' : ''}`}
            onClick={() => setTab('models')}
          >
            {t('tabModels', language)}
          </button>
        </div>

        {tab === 'players' ? (
          <>
            <div className="leader-columns">
              <span>{t('colRank', language)}</span>
              <span>{t('colPlayer', language)}</span>
              <span>{t('colScore', language)}</span>
              <span>{t('colAccuracy', language)}</span>
            </div>
            <div className="leader-rows">
              {playerRows.map((r, i) => (
                <div className={`leader-row ${r.displayName === player?.displayName ? 'me' : ''}`} key={i}>
                  <span>{i + 1}</span>
                  <span>{r.displayName}</span>
                  <strong>{r.score}</strong>
                  <span>{Math.round((r.accuracy || 0) * 100)}%</span>
                </div>
              ))}
              {playerRows.length === 0 && !loading && (
                <p className="empty-notice">{t('noPlayers', language)}</p>
              )}
            </div>
            <div className="leader-foot">
              {t('leaderFootRule', language)}<br />
              <small>{t('leaderFootTie', language)}</small>
            </div>
          </>
        ) : tab === 'impostors' ? (
          <>
            <div className="model-subhead impostor-subhead">
              <span>{t('impostorSubhead', language)}</span>
            </div>
            <div className="leader-columns impostor-columns">
              <span>{t('colRank', language)}</span>
              <span>{t('colPlayer', language)}</span>
              <span>{t('colDeceptionRate', language)}</span>
              <span>{t('colDeceivedCount', language)}</span>
            </div>
            <div className="leader-rows">
              {impostorRows.map((imp, i) => (
                <div className={`leader-row impostor-row ${i === 0 && imp.testedCount > 0 ? 'top-impostor' : ''} ${imp.displayName === player?.displayName ? 'me' : ''}`} key={imp.displayName || i}>
                  <span className="rank-num">{i + 1}</span>
                  <span className="model-name">
                    <b>{imp.displayName}</b>
                    {i === 0 && imp.testedCount > 0 && <span className="crown-badge impostor-badge">{t('badgeImpostor', language)}</span>}
                  </span>
                  <strong className="rate-value impostor-rate">{imp.deceptionRate}%</strong>
                  <span className="encounters-count">{imp.deceivedCount} / {imp.testedCount}</span>
                </div>
              ))}
              {impostorRows.length === 0 && !loading && (
                <p className="empty-notice">{t('noImpostors', language)}</p>
              )}
            </div>
            <div className="leader-foot">
              <small>{t('impostorFootNote', language)}</small>
            </div>
          </>
        ) : (
          <>
            <div className="model-subhead">
              <span>{t('modelSubhead', language)}</span>
            </div>
            <div className="leader-columns model-columns">
              <span>{t('colRank', language)}</span>
              <span>{t('colModel', language)}</span>
              <span>{t('colUndetected', language)}</span>
              <span>{t('colPlays', language)}</span>
            </div>
            <div className="leader-rows">
              {modelRows.map((m, i) => (
                <div className={`leader-row model-row ${i === 0 && m.encounters > 0 ? 'top-model' : ''}`} key={m.model || i}>
                  <span className="rank-num">{i + 1}</span>
                  <span className="model-name">
                    <b>{m.model}</b>
                    {i === 0 && m.encounters > 0 && <span className="crown-badge">{t('badgeUndetected', language)}</span>}
                  </span>
                  <strong className="rate-value">{m.undetectedRate}%</strong>
                  <span className="encounters-count">{m.encounters}</span>
                </div>
              ))}
              {modelRows.length === 0 && !loading && (
                <p className="empty-notice">{t('noModels', language)}</p>
              )}
            </div>
            <div className="leader-foot">
              <small>{t('modelFootNote', language)}</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
