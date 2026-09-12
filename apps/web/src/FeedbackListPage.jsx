import React, { useEffect, useState } from 'react';
import { get } from './api.js';

export default function FeedbackListPage({ onBack }) {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');

  const fetchFeedbacks = () => {
    setLoading(true);
    setError('');
    get('/api/feedbacks')
      .then(res => {
        setFeedbacks(res.feedbacks || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Failed to load feedbacks');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const filtered = feedbacks.filter(fb => {
    if (filterType === 'all') return true;
    return (fb.contactType || fb.contact_type) === filterType;
  });

  const formatDate = (isoString) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      return d.toLocaleString();
    } catch {
      return isoString;
    }
  };

  const getContactIcon = (type) => {
    switch (type) {
      case 'wechat': return '💬 WeChat';
      case 'whatsapp': return '📱 WhatsApp';
      case 'telegram': return '✈️ Telegram';
      case 'line': return '🟢 Line';
      case 'email':
      default: return '✉️ Email';
    }
  };

  return (
    <div className="feedback-page-shell">
      <div className="feedback-page-container glass">
        <header className="feedback-page-header">
          <div className="feedback-header-left">
            <div className="eyebrow">FEEDBACK DASHBOARD</div>
            <h1>玩家反馈看板 <span>({filtered.length})</span></h1>
          </div>
          <div className="feedback-header-actions">
            <button className="feedback-page-btn" onClick={fetchFeedbacks} disabled={loading}>
              🔄 刷新
            </button>
            {onBack ? (
              <button className="feedback-page-btn back" onClick={onBack}>
                ← 返回游戏
              </button>
            ) : (
              <a href="/" className="feedback-page-btn back" style={{ textDecoration: 'none' }}>
                ← 返回游戏
              </a>
            )}
          </div>
        </header>

        {/* Filter bar */}
        <div className="feedback-filter-bar">
          <span className="filter-label">渠道筛选：</span>
          {['all', 'email', 'wechat', 'whatsapp', 'telegram', 'line'].map(key => (
            <button
              key={key}
              className={`feedback-filter-tag ${filterType === key ? 'active' : ''}`}
              onClick={() => setFilterType(key)}
            >
              {key === 'all' ? '全部' : key}
            </button>
          ))}
        </div>

        {error && <div className="error" style={{ margin: '16px 0' }}>{error}</div>}

        {loading ? (
          <div className="feedback-loading">
            <div className="status-dot pulse" style={{ margin: '0 auto 12px' }}></div>
            <span>加载反馈列表中…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="feedback-empty">
            <span>📭</span>
            <p>暂无符合条件的反馈记录</p>
          </div>
        ) : (
          <div className="feedback-cards-grid">
            {filtered.map(item => {
              const cType = item.contactType || item.contact_type || 'email';
              const cVal = item.contactValue || item.contact_value || '-';
              const name = item.displayName || item.display_name || '匿名玩家';
              const date = formatDate(item.createdAt || item.created_at);
              const lang = item.language || '-';

              return (
                <div className="feedback-card glass" key={item.id}>
                  <div className="feedback-card-top">
                    <div className="feedback-author-meta">
                      <b>{name}</b>
                      <span className="feedback-lang-badge">{lang.toUpperCase()}</span>
                    </div>
                    <time className="feedback-time">{date}</time>
                  </div>

                  <div className="feedback-card-contact">
                    <span className="contact-badge">{getContactIcon(cType)}</span>
                    <span className="contact-val" title={cVal}>{cVal}</span>
                  </div>

                  <div className="feedback-card-body">
                    <p>{item.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
