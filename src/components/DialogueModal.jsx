import React, { useState, useEffect } from 'react';
import { X, ArrowLeft } from './Icons';
import AudioPlayer from './AudioPlayer';
import { API_BASE } from '../config';

export default function DialogueModal({ token, moduleId, onClose }) {
  const [dialogue, setDialogue] = useState([]);
  const [moduleTitle, setModuleTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDialogue = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/modules/${moduleId}/dialogue`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Ошибка загрузки диалога');

        setModuleTitle(data.moduleTitle || 'Разговорный модуль');
        setDialogue(Array.isArray(data.dialogue) ? data.dialogue : []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (moduleId) {
      fetchDialogue();
    }
  }, [moduleId, token]);

  if (!moduleId) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 16, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '650px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        borderRadius: '24px',
        padding: '28px',
        border: '1px solid var(--border-color)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Заголовок модального окна */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--neon-cyan)', letterSpacing: '2px', fontWeight: '600' }}>
              💬 Микро-диалог темы
            </span>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#fff', marginTop: '4px' }}>
              {moduleTitle}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="btn-neon btn-secondary"
            style={{ padding: '8px', borderRadius: '50%', minWidth: 'auto', width: '36px', height: '36px', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '1.8rem', marginBottom: '10px' }}>💬</div>
            Загрузка диалога...
          </div>
        ) : error ? (
          <div style={{
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            color: '#ff668c',
            padding: '16px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {dialogue.map((item, idx) => {
              const isSpeakerA = item.speaker === 'A';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignSelf: isSpeakerA ? 'flex-start' : 'flex-end',
                    maxWidth: '85%',
                    background: isSpeakerA ? 'rgba(0, 242, 254, 0.06)' : 'rgba(0, 255, 136, 0.06)',
                    border: `1px solid ${isSpeakerA ? 'rgba(0, 242, 254, 0.2)' : 'rgba(0, 255, 136, 0.2)'}`,
                    borderRadius: isSpeakerA ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                    padding: '14px 18px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '12px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isSpeakerA ? 'var(--neon-cyan)' : 'var(--neon-green)' }}>
                      {isSpeakerA ? '👤 Говорящий А' : '👤 Говорящий Б'}
                    </span>
                    <AudioPlayer text={item.chinese} style={{ width: '32px', height: '32px' }} />
                  </div>

                  <div className="chinese-char-sm" style={{ fontSize: '1.3rem', color: '#fff', fontWeight: '600', marginBottom: '4px' }}>
                    {item.chinese}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: isSpeakerA ? 'var(--neon-cyan)' : 'var(--neon-green)', fontWeight: '500', marginBottom: '4px' }}>
                    {item.pinyin}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                    {item.translation}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            className="btn-neon btn-secondary"
            style={{ padding: '10px 24px', fontSize: '0.9rem', width: '100%', maxWidth: '240px' }}
          >
            Закрыть диалог
          </button>
        </div>
      </div>
    </div>
  );
}
