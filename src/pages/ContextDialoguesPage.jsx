import React, { useState, useEffect } from 'react';
import { ArrowLeft, Volume2, Eye, EyeOff } from '../components/Icons';
import { API_BASE } from '../config';

export default function ContextDialoguesPage({ token, modules, onBack }) {
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.id || '');
  const [dialogues, setDialogues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPinyin, setShowPinyin] = useState(true);
  const [showTranslation, setShowTranslation] = useState(true);
  const [playingLineId, setPlayingLineId] = useState(null);

  useEffect(() => {
    if (selectedModuleId) {
      fetchDialogues(selectedModuleId);
    }
  }, [selectedModuleId]);

  const fetchDialogues = async (moduleId) => {
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
  };

  const playLineAudio = (text, lineId) => {
    setPlayingLineId(lineId);
    const url = `${API_BASE}/api/tts?text=${encodeURIComponent(text)}&rate=normal`;

    if (window.activeAudio) {
      try { window.activeAudio.pause(); } catch (e) {}
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
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px 100px 20px' }}>
      {/* Прикрепленная верхняя панель навигации */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'rgba(10, 14, 23, 0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '16px 20px',
        margin: '-40px -20px 24px -20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={onBack} 
            className="btn-neon btn-secondary" 
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.85rem', 
              fontWeight: '600',
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              borderRadius: '10px'
            }}
          >
            <ArrowLeft size={16} /> Назад
          </button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#fff', margin: 0 }}>
            💬 Интерактивные микро-диалоги
          </h2>
        </div>

        {/* Переключатели пиньиня и перевода */}
        <div style={{ display: 'flex', gap: '10px' }}>
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
      </div>

      {/* Селектор модуля */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          Выберите модуль диалогов:
        </label>
        <select
          value={selectedModuleId}
          onChange={(e) => setSelectedModuleId(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            fontSize: '0.95rem',
            outline: 'none'
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
