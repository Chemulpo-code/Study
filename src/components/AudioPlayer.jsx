import React from 'react';
import { API_BASE } from '../config';

export default function AudioPlayer({ text, className = '', style = {} }) {
  const speak = (e) => {
    e.stopPropagation(); // Предотвращаем переворот карточки

    if (!text || !text.trim()) return;

    // Останавливаем предыдущее воспроизведение
    if (window.activeAudio) {
      try {
        window.activeAudio.pause();
        window.activeAudio.currentTime = 0;
      } catch (err) {}
    }

    if ('speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch (err) {}
    }

    const url = `${API_BASE}/api/tts?text=${encodeURIComponent(text)}&rate=normal`;
    const audioToPlay = new Audio(url);
    window.activeAudio = audioToPlay;

    audioToPlay.play().catch(err => {
      if (err.name === 'AbortError') return;
      // Fallback в случае фатальной ошибки сети
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
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
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 0,
        minWidth: 'auto',
        border: '1px solid rgba(0, 242, 254, 0.3)',
        background: 'rgba(0, 242, 254, 0.05)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ...style
      }}
      title="Прослушать произношение"
    >
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
        style={{ color: 'rgba(0, 242, 254, 0.9)' }}
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
      </svg>
    </button>
  );
}
