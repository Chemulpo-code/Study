import React, { useState, useEffect, useCallback } from 'react';
import { Volume2 } from '../components/Icons';
import { API_BASE } from '../config';
import { PageHeader } from '../components/UI';

export default function ContextDialoguesPage({ token, modules, onBack }) {
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '');
  const [dialogues, setDialogues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [playingLineId, setPlayingLineId] = useState(null);

  const fetchDialogues = useCallback(async (moduleId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/modules/${moduleId}/dialogues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setDialogues(data);
    } catch (err) {
      console.error('Ошибка загрузки диалогов:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (selectedModuleId) {
      fetchDialogues(selectedModuleId);
    }
  }, [selectedModuleId, fetchDialogues]);

  const playLineAudio = (text, lineId) => {
    setPlayingLineId(lineId);
    const url = `${API_BASE}/api/tts?text=${encodeURIComponent(text)}&rate=normal`;

    if (window.activeAudio) {
      try { window.activeAudio.pause(); } catch {}
    }

    const audio = new Audio(url);
    window.activeAudio = audio;

    audio.onended = () => setPlayingLineId(null);
    audio.onerror = () => setPlayingLineId(null);

    audio.play().catch(() => {
      // Fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        u.onend = () => setPlayingLineId(null);
        u.onerror = () => setPlayingLineId(null);
        window.speechSynthesis.speak(u);
      } else {
        setPlayingLineId(null);
      }
    });
  };

  return (
    <div className="page-container medium-page">
      <PageHeader title="Микро-диалоги" eyebrow="Речь · 对话" onBack={onBack} actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowPinyin(p => !p)}
            className={`btn-neon ${showPinyin ? 'btn-cyan' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '600', borderRadius: '10px' }}
          >
            拼 Пиньинь
          </button>
          <button
            onClick={() => setShowTranslation(t => !t)}
            className={`btn-neon ${showTranslation ? 'btn-green' : 'btn-secondary'}`}
            style={{ padding: '6px 12px', fontSize: '0.8rem', fontWeight: '600', borderRadius: '10px' }}
          >
            🌐 Перевод
          </button>
        </div>
      } />

      {/* Селектор модуля */}
      <div style={{ marginBottom: '28px' }}>
        <label htmlFor="dialogue-module" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          Выберите модуль диалогов:
        </label>
        <select
          id="dialogue-module"
          name="module"
          value={selectedModuleId}
          onChange={(e) => setSelectedModuleId(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontSize: '0.95rem'
          }}
        >
          {modules.map(m => (
            <option key={m.id} value={m.id} style={{ background: '#121824' }}>{m.title} ({m.totalCards || 0} слов)</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh', color: '#fff' }}>
          <div className="loader" style={{ borderTopColor: 'var(--neon-cyan)' }} />
          <span style={{ marginLeft: '12px' }}>Генерация диалогов...</span>
        </div>
      ) : dialogues.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Для этого модуля диалоги временно недоступны.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {dialogues.map((dialogue) => (
            <div key={dialogue.id} className="glass-panel" style={{ padding: '28px 30px', borderRadius: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>
                {dialogue.title}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                Сценарий: {dialogue.scenario}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {dialogue.lines.map((line, idx) => {
                  const lineKey = `${dialogue.id}-${idx}`;
                  const isPlaying = playingLineId === lineKey;

                  return (
                    <div
                      key={idx}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '16px',
                        background: line.speaker === 'A' || line.speaker === 'Покупатель'
                          ? 'rgba(0, 242, 254, 0.04)'
                          : 'rgba(185, 0, 254, 0.04)',
                        border: line.speaker === 'A' || line.speaker === 'Покупатель'
                          ? '1px solid rgba(0, 242, 254, 0.15)'
                          : '1px solid rgba(185, 0, 254, 0.15)',
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: '16px'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: line.speaker === 'A' || line.speaker === 'Покупатель' ? 'var(--neon-cyan)' : '#d156ff',
                          marginBottom: '4px'
                        }}>
                          {line.speaker}
                        </div>

                        {/* Китайский текст */}
                        <div style={{ fontSize: '1.3rem', fontWeight: '600', color: '#fff', marginBottom: showPinyin ? '4px' : '0' }}>
                          {line.chinese}
                        </div>

                        {/* Пиньинь */}
                        {showPinyin && (
                          <div style={{ fontSize: '0.9rem', color: 'var(--neon-cyan)', marginBottom: showTranslation ? '6px' : '0' }}>
                            {line.pinyin}
                          </div>
                        )}

                        {/* Перевод */}
                        {showTranslation && (
                          <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                            {line.translation}
                          </div>
                        )}
                      </div>

                      {/* Кнопка воспроизведения аудио реплики */}
                      <button
                        onClick={() => playLineAudio(line.chinese, lineKey)}
                        className={`btn-neon ${isPlaying ? 'btn-green' : 'btn-cyan'}`}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                        title="Прослушать реплику"
                      >
                        <Volume2 size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
