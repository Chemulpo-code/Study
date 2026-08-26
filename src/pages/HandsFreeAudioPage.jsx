import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Play, Pause, SkipForward, SkipBack, RefreshCw } from '../components/Icons';
import { API_BASE } from '../config';

export default function HandsFreeAudioPage({ token, modules, onBack }) {
  const [selectedModuleId, setSelectedModuleId] = useState('all');
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1.0); // 1.0, 0.75, 1.25
  const [currentStep, setCurrentStep] = useState('idle'); // 'chinese' | 'pause' | 'russian' | 'example'
  const [loading, setLoading] = useState(true);

  const isMountedRef = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => {
    isMountedRef.current = true;
    fetchCards();
    return () => {
      isMountedRef.current = false;
      clearTimeout(timerRef.current);
      if (window.activeAudio) {
        try { window.activeAudio.pause(); } catch (e) {}
      }
    };
  }, [selectedModuleId]);

  const fetchCards = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/cards`;
      if (selectedModuleId === 'error-box') {
        const res = await fetch(`${API_BASE}/api/modules/error-box`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setCards(data.cards || []);
        setLoading(false);
        return;
      } else if (selectedModuleId !== 'all') {
        url = `${API_BASE}/api/modules/${selectedModuleId}/cards`;
      } else {
        // Загружаем все карточки из всех модулей
        const res = await fetch(`${API_BASE}/api/modules`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const mods = await res.json();
        let allC = [];
        for (const m of mods) {
          const cRes = await fetch(`${API_BASE}/api/modules/${m.id}/cards`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const cData = await cRes.json();
          allC = [...allC, ...cData];
        }
        setCards(allC);
        setLoading(false);
        return;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setCards(data);
    } catch (err) {
      console.error('Ошибка загрузки карточек для аудио-плеера:', err);
    } finally {
      setLoading(false);
    }
  };

  // Озвучивание текста через TTS API или синтез речи браузера
  const speakText = (text, lang = 'zh-CN') => {
    return new Promise((resolve) => {
      if (!isMountedRef.current) return resolve();

      if (lang === 'zh-CN') {
        const url = `${API_BASE}/api/tts?text=${encodeURIComponent(text)}&rate=normal`;
        const audio = new Audio(url);
        audio.playbackRate = speed;
        window.activeAudio = audio;

        audio.onended = () => resolve();
        audio.onerror = () => {
          // Нативный fallback
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = 'zh-CN';
            u.rate = speed * 0.85;
            u.onend = () => resolve();
            u.onerror = () => resolve();
            window.speechSynthesis.speak(u);
          } else {
            resolve();
          }
        };

        audio.play().catch(() => {
          resolve();
        });
      } else {
        // Русский перевод через нативный браузерный ттс
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'ru-RU';
          u.rate = speed * 0.95;
          u.onend = () => resolve();
          u.onerror = () => resolve();
          window.speechSynthesis.speak(u);
        } else {
          resolve();
        }
      }
    });
  };

  // Проигрывание последовательности для текущей карточки
  const playCardSequence = async (index) => {
    if (!isPlaying || !isMountedRef.current || cards.length === 0) return;
    const card = cards[index];
    if (!card) return;

    // Шаг 1: Произношение на китайском
    setCurrentStep('chinese');
    await speakText(card.characters, 'zh-CN');

    if (!isPlaying || !isMountedRef.current) return;

    // Шаг 2: Пауза 2.5 секунды для вспоминания перевода
    setCurrentStep('pause');
    await new Promise(res => {
      timerRef.current = setTimeout(res, 2500 / speed);
    });

    if (!isPlaying || !isMountedRef.current) return;

    // Шаг 3: Русский перевод
    setCurrentStep('russian');
    await speakText(card.translation, 'ru-RU');

    if (!isPlaying || !isMountedRef.current) return;

    // Шаг 4: Пример предложения (если есть)
    if (card.examples && card.examples.length > 0 && card.examples[0].chinese) {
      setCurrentStep('example');
      await speakText(card.examples[0].chinese, 'zh-CN');
    }

    if (!isPlaying || !isMountedRef.current) return;

    // Шаг 5: Переход к следующей карточке
    const nextIdx = (index + 1) % cards.length;
    setCurrentIndex(nextIdx);
    timerRef.current = setTimeout(() => {
      playCardSequence(nextIdx);
    }, 1000 / speed);
  };

  useEffect(() => {
    if (isPlaying) {
      playCardSequence(currentIndex);
    } else {
      clearTimeout(timerRef.current);
      if (window.activeAudio) {
        try { window.activeAudio.pause(); } catch (e) {}
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setCurrentStep('idle');
    }
  }, [isPlaying]);

  const togglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleNext = () => {
    clearTimeout(timerRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const nextIdx = (currentIndex + 1) % cards.length;
    setCurrentIndex(nextIdx);
    if (isPlaying) playCardSequence(nextIdx);
  };

  const handlePrev = () => {
    clearTimeout(timerRef.current);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    const prevIdx = (currentIndex - 1 + cards.length) % cards.length;
    setCurrentIndex(prevIdx);
    if (isPlaying) playCardSequence(prevIdx);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#fff' }}>
        <div className="loader" style={{ borderTopColor: 'var(--neon-cyan)' }} />
        <span style={{ marginLeft: '12px' }}>Загрузка аудиоплеера...</span>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px 100px 20px' }}>
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
            🎧 Слушай на ходу (Hands-Free)
          </h2>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Слово {cards.length > 0 ? currentIndex + 1 : 0} из {cards.length}
        </div>
      </div>

      {/* Селектор выбора модуля */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
          Выберите модуль для аудио-тренировки:
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
          <option value="all" style={{ background: '#121824' }}>📚 Все модули</option>
          <option value="error-box" style={{ background: '#121824' }}>❌ Мои ошибки (за 7 дней)</option>
          {modules.map(m => (
            <option key={m.id} value={m.id} style={{ background: '#121824' }}>{m.title} ({m.totalCards || 0} слов)</option>
          ))}
        </select>
      </div>

      {cards.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          В выбранном разделе пока нет слов.
        </div>
      ) : (
        <>
          {/* Карточка текущего слова */}
          <div className="glass-panel" style={{
            padding: '40px 30px',
            borderRadius: '24px',
            textAlign: 'center',
            marginBottom: '32px',
            border: isPlaying ? '1px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.08)',
            boxShadow: isPlaying ? '0 0 30px rgba(0, 242, 254, 0.15)' : 'none',
            transition: 'all 0.4s ease'
          }}>
            {/* Статус автопроигрывания */}
            <div style={{ marginBottom: '16px' }}>
              <span style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                padding: '4px 12px',
                borderRadius: '12px',
                background: currentStep === 'chinese' ? 'rgba(0, 242, 254, 0.15)' :
                            currentStep === 'pause' ? 'rgba(255, 204, 0, 0.15)' :
                            currentStep === 'russian' ? 'rgba(0, 255, 136, 0.15)' : 'rgba(255,255,255,0.05)',
                color: currentStep === 'chinese' ? 'var(--neon-cyan)' :
                       currentStep === 'pause' ? '#ffcc00' :
                       currentStep === 'russian' ? 'var(--neon-green)' : 'var(--text-secondary)',
                fontWeight: '600'
              }}>
                {currentStep === 'chinese' && '🔊 Произношение...'}
                {currentStep === 'pause' && '⏱️ Пауза (вспомните перевод)'}
                {currentStep === 'russian' && '🗣️ Русский перевод'}
                {currentStep === 'example' && '📝 Пример в предложении'}
                {currentStep === 'idle' && '⏸️ На паузе'}
              </span>
            </div>

            {/* Иероглифы */}
            <h1 className="chinese-char" style={{ fontSize: '3.5rem', marginBottom: '8px' }}>
              {currentCard?.characters}
            </h1>

            {/* Пиньинь */}
            <div style={{ fontSize: '1.4rem', color: 'var(--neon-cyan)', fontWeight: '600', marginBottom: '16px' }}>
              {currentCard?.pinyin}
            </div>

            {/* Перевод */}
            <div style={{ fontSize: '1.25rem', color: '#fff', fontWeight: '500', marginBottom: '20px' }}>
              {currentCard?.translation}
            </div>

            {/* Пример предложения */}
            {currentCard?.examples && currentCard.examples.length > 0 && (
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                padding: '16px',
                borderRadius: '14px',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                border: '1px solid rgba(255,255,255,0.05)'
              }}>
                <div style={{ color: '#fff', fontSize: '1rem', marginBottom: '4px' }}>
                  {currentCard.examples[0].chinese}
                </div>
                <div>{currentCard.examples[0].translation}</div>
              </div>
            )}
          </div>

          {/* Панель управления воспроизведением */}
          <div className="glass-panel" style={{
            padding: '24px 30px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <button
              onClick={handlePrev}
              className="btn-neon btn-secondary"
              style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Предыдущее слово"
            >
              <SkipBack size={20} />
            </button>

            <button
              onClick={togglePlay}
              className={`btn-neon ${isPlaying ? 'btn-red' : 'btn-cyan'}`}
              style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: '700', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              {isPlaying ? <><Pause size={20} /> Пауза</> : <><Play size={20} /> Запустить плеер</>}
            </button>

            <button
              onClick={handleNext}
              className="btn-neon btn-secondary"
              style={{ width: '48px', height: '48px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Следующее слово"
            >
              <SkipForward size={20} />
            </button>

            {/* Скорость */}
            <button
              onClick={() => setSpeed(s => s === 1.0 ? 0.75 : s === 0.75 ? 1.25 : 1.0)}
              className="btn-neon btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem', fontWeight: '600', borderRadius: '10px' }}
              title="Скорость речи"
            >
              {speed}x
            </button>
          </div>
        </>
      )}
    </div>
  );
}
