import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

export default function AudioPlayer({ text, className = '' }) {
  const [isSlowNext, setIsSlowNext] = useState(false);

  // Сбрасываем режим скорости при смене текста (карточки)
  useEffect(() => {
    setIsSlowNext(false);
  }, [text]);

  const speak = (e) => {
    e.stopPropagation(); // Предотвращаем срабатывание клика по самой карточке (переворот)
    
    // Определяем скорость для запроса
    const rateParam = isSlowNext ? 'slow' : 'normal';
    const url = `${API_BASE}/api/tts?text=${encodeURIComponent(text)}&rate=${rateParam}`;
    
    if (window.activeAudio) {
      try {
        window.activeAudio.pause();
        window.activeAudio.currentTime = 0;
      } catch (e) {}
    }
    
    const audio = new Audio(url);
    window.activeAudio = audio;
    
    audio.play()
      .then(() => {
        // Переключаем скорость на противоположную после успешного воспроизведения
        setIsSlowNext(!isSlowNext);
      })
      .catch(err => {
        if (err.name === 'AbortError') return; // Игнорируем прерывание звука пользователем
        console.warn('Ошибка воспроизведения MP3, пробуем фолбек Web Speech API:', err);
        
        // Локальный фолбек на Web Speech API на случай отсутствия интернета
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          const voices = window.speechSynthesis.getVoices();
          const zhVoice = voices.find(voice => 
            voice.lang.toLowerCase().includes('zh-cn') || 
            voice.lang.toLowerCase().includes('zh-hk') || 
            voice.lang.toLowerCase().includes('zh-tw')
          );
          if (zhVoice) utterance.voice = zhVoice;
          // Если планировался медленный режим — ставим скорость 0.55, иначе 0.85
          utterance.rate = isSlowNext ? 0.55 : 0.85;
          window.speechSynthesis.speak(utterance);
        }
        
        // В случае ошибки все равно переключаем скорость
        setIsSlowNext(!isSlowNext);
      });
  };

  return (
    <button 
      onClick={speak}
      type="button"
      className={className}
      style={isSlowNext ? {
        height: '36px',
        borderRadius: '18px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 12px',
        minWidth: 'auto',
        border: '1px solid rgba(157, 78, 221, 0.4)',
        background: 'rgba(157, 78, 221, 0.1)',
        boxShadow: '0 0 10px rgba(157, 78, 221, 0.2)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        gap: '6px'
      } : {
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
        transition: 'all 0.2s ease'
      }}
      title={isSlowNext ? "Прослушать медленно (скорость 0.5x)" : "Прослушать произношение (нормальная скорость)"}
    >
      {isSlowNext && (
        <span style={{ 
          fontSize: '0.75rem', 
          fontWeight: '700', 
          color: '#d4a373',
          WebkitTextFillColor: '#d4a373', // Предотвращаем наследование прозрачности текста от .chinese-char
          display: 'flex',
          alignItems: 'center',
          gap: '2px'
        }}>
          🐢 0.5x
        </span>
      )}
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="15" 
        height="15" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        style={{ color: isSlowNext ? 'rgba(157, 78, 221, 0.9)' : 'rgba(0, 242, 254, 0.9)' }}
      >
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        {!isSlowNext && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
      </svg>
    </button>
  );
}
