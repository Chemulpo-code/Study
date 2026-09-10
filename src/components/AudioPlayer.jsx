import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

export default function AudioPlayer({ text, className = '', style = {} }) {
  const [isSlowNext, setIsSlowNext] = useState(false);

  // Сбрасываем режим скорости при смене текста
  useEffect(() => {
    setIsSlowNext(false);
  }, [text]);

  const speak = (e) => {
    e.stopPropagation(); // Предотвращаем переворот карточки

    if (!text || !text.trim()) return;

    // Останавливаем любое активное воспроизведение
    if (window.activeAudio) {
      try {
        window.activeAudio.pause();
        window.activeAudio.currentTime = 0;
      } catch {}
    }
    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }

    // Определяем скорость для ТЕКУЩЕГО нажатия
    const currentRate = isSlowNext ? 'slow' : 'normal';
    
    // Переключаем режим скорости на противоположный для СЛЕДУЮЩЕГО клика
    setIsSlowNext(!isSlowNext);

    const url = `${API_BASE}/api/tts?text=${encodeURIComponent(text)}&rate=${currentRate}`;
    const audioToPlay = new Audio(url);
    window.activeAudio = audioToPlay;

    audioToPlay.play().catch(err => {
      if (err.name === 'AbortError') return;
      // В случае сбоя сети — нативный fallback ровно 1 раз
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = currentRate === 'slow' ? 0.55 : 0.85;
        window.speechSynthesis.speak(utterance);
      }
    });
  };

  return (
    <button 
      onClick={speak}
      type="button"
      className={className}
      style={{
        height: '36px',
        borderRadius: isSlowNext ? '18px' : '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isSlowNext ? '0 10px' : 0,
        width: isSlowNext ? 'auto' : '36px',
        minWidth: 'auto',
        border: isSlowNext ? '1px solid rgba(212, 163, 115, 0.5)' : '1px solid rgba(0, 242, 254, 0.3)',
        background: isSlowNext ? 'rgba(212, 163, 115, 0.12)' : 'rgba(0, 242, 254, 0.05)',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease',
        gap: '4px',
        ...style
      }}
      title={isSlowNext ? "Нажмите для медленного воспроизведения (0.5x)" : "Нажмите для воспроизведения на обычной скорости"}
    >
      {isSlowNext && (
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: '700', 
          color: '#d4a373',
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          🐢 0.5x
        </span>
      )}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="16" 
        height="16" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ color: isSlowNext ? '#d4a373' : 'rgba(0, 242, 254, 0.9)' }}
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        {!isSlowNext && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
      </svg>
    </button>
  );
}
