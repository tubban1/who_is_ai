import React, { useState } from 'react';
import { post } from './api.js';
import { t } from './i18n.js';
import { playSfx } from './audio.js';

const CONTACT_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'wechat', label: 'WeChat (微信)' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'line', label: 'Line' }
];

export default function FeedbackModal({ uuid, displayName, language = 'zh', onClose }) {
  const [contactType, setContactType] = useState('email');
  const [contactValue, setContactValue] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contactValue.trim()) {
      setError(t('feedbackContactRequired', language));
      return;
    }
    if (!content.trim()) {
      setError(t('feedbackContentRequired', language));
      return;
    }

    setError('');
    setLoading(true);
    try {
      await post('/api/feedback', {
        uuid,
        displayName,
        language,
        contactType,
        contactValue: contactValue.trim(),
        content: content.trim()
      });
      playSfx('click');
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Submit failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="feedback-modal glass">
        <div className="leader-head">
          <div>
            <div className="eyebrow">{t('feedbackEyebrow', language)}</div>
            <h2 style={{ margin: '4px 0 6px' }}>{t('feedbackTitle', language)}</h2>
          </div>
          <button onClick={onClose}>×</button>
        </div>

        {success ? (
          <div className="feedback-success">
            <div className="feedback-success-icon">✨</div>
            <h3>{t('feedbackSuccessTitle', language)}</h3>
            <p>{t('feedbackSuccessDesc', language)}</p>
            <button className="primary" style={{ marginTop: '20px' }} onClick={onClose}>
              {t('feedbackCloseBtn', language)}
            </button>
            <div style={{ marginTop: '14px' }}>
              <a
                href="#feedbacks"
                style={{
                  color: '#75f2da',
                  fontSize: '12px',
                  textDecoration: 'none',
                  opacity: 0.85,
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  if (typeof window !== 'undefined') {
                    window.location.hash = 'feedbacks';
                  }
                }}
              >
                📋 查看所有玩家反馈列表 →
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="feedback-form">
            <p className="feedback-subtitle">{t('feedbackSubtitle', language)}</p>

            <label className="feedback-label">
              <span>{t('feedbackContactTypeLabel', language)}</span>
              <div className="feedback-contact-row">
                <select
                  value={contactType}
                  onChange={e => setContactType(e.target.value)}
                  className="feedback-select"
                >
                  {CONTACT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  type="text"
                  required
                  placeholder={
                    contactType === 'email'
                      ? 'name@example.com'
                      : contactType === 'wechat'
                      ? 'WeChat ID'
                      : contactType === 'telegram'
                      ? '@username'
                      : '+1 234 567 8900'
                  }
                  value={contactValue}
                  onChange={e => setContactValue(e.target.value)}
                  maxLength={100}
                  className="feedback-input"
                />
              </div>
            </label>

            <label className="feedback-label" style={{ marginTop: '14px' }}>
              <span>{t('feedbackContentLabel', language)}</span>
              <textarea
                required
                rows={4}
                placeholder={t('feedbackContentPlaceholder', language)}
                value={content}
                onChange={e => setContent(e.target.value)}
                maxLength={2000}
                className="feedback-textarea"
              />
            </label>

            {error && <div className="error compact">{error}</div>}

            <div className="feedback-actions">
              <button type="button" className="feedback-cancel-btn" onClick={onClose} disabled={loading}>
                {t('feedbackCancelBtn', language)}
              </button>
              <button type="submit" className="primary feedback-submit-btn" disabled={loading}>
                {loading ? t('feedbackSubmitting', language) : t('feedbackSubmitBtn', language)}
              </button>
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <a
                href="#feedbacks"
                style={{
                  color: '#75f2da',
                  fontSize: '12px',
                  textDecoration: 'none',
                  opacity: 0.85,
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                  if (typeof window !== 'undefined') {
                    window.location.hash = 'feedbacks';
                  }
                }}
              >
                📋 查看所有玩家公开反馈列表 →
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
