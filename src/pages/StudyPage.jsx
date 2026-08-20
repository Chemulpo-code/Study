import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X, RefreshCw } from '../components/Icons';
import AudioPlayer from '../components/AudioPlayer';
import WritingTrainer from '../components/WritingTrainer';
import { API_BASE } from '../config';
import { useToast } from '../components/Toast';
import { cacheCardsLocally, getCachedCardsLocally, queueOfflineProgress } from '../utils/offlineStorage';

export default function StudyPage({ token, moduleId, mode, initialMode, spaced, initialSpaced, displayMode, onToggleDisplayMode, onBackToDashboard, onBack }) {
  const { showToast } = useToast();
  const handleBack = onBackToDashboard || onBack;
  const currentMode = mode || initialMode || 'cards';
  const isSpaced = spaced !== undefined ? spaced : (initialSpaced !== undefined ? initialSpaced : false);
  const [cards, setCards] = useState([]);
  const [allOriginalCards, setAllOriginalCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ know: 0, dontKnow: 0 });
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Состояния для режима Теста (Quiz)
  const [quizOptions, setQuizOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isQuizCorrect, setIsQuizCorrect] = useState(null);

  // Состояния для режима Диктанта (Dictation)
  const [dictationInput, setDictationInput] = useState('');
  const [isDictationChecked, setIsDictationChecked] = useState(false);
  const [isDictationCorrect, setIsDictationCorrect] = useState(false);
  
  // Состояние тренировки письма
  const [showWriting, setShowWriting] = useState(false);
  
  // Направление карточек: 'zh-to-ru' (с китайского на русский) или 'ru-to-zh' (с русского на китайский)
  const [cardDirection, setCardDirection] = useState('zh-to-ru');

  // Вспомогательная очистка пиньиня для сравнения
  const cleanPinyinForMatching = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // убираем диакритические знаки тонов
      .replace(/[^a-z0-9]/g, "") // оставляем только буквы и цифры, убирая пробелы и знаки препинания
      .trim();
  };

  // Автоматическое воспроизведение звука
  const triggerAutoplaySound = (text) => {
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
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Загрузка карточек
  const fetchCards = async () => {
    if (!moduleId) {
      setError('Идентификатор модуля не указан.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 сек таймаут

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`${API_BASE}/api/modules/${moduleId}/cards`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при загрузке карточек');
      
      const cardList = Array.isArray(data) ? data : [];
      setAllOriginalCards(cardList);
      cacheCardsLocally(moduleId, cardList);

      let processedCards = [...cardList];

      // Если включен режим интервальных повторений, фильтруем карточки
      if (isSpaced) {
        const now = new Date();
        processedCards = cardList.filter(card => {
          if (!card.nextReviewAt) return true;
          const reviewDate = new Date(card.nextReviewAt);
          return reviewDate <= now;
        });
      }

      // Перемешиваем карточки
      const shuffled = processedCards.sort(() => Math.random() - 0.5);
      setCards(shuffled);
    } catch (err) {
      clearTimeout(timeoutId);
      const cached = getCachedCardsLocally(moduleId);
      if (cached && cached.length > 0) {
        setAllOriginalCards(cached);
        const shuffled = [...cached].sort(() => Math.random() - 0.5);
        setCards(shuffled);
        showToast('Загружены карточки из офлайн-кэша 📶', 'info');
      } else {
        if (err.name === 'AbortError') {
          setError('Превышено время ожидания ответа от сервера (6 сек). Проверьте интернет-соединение.');
        } else {
          setError(err.message || 'Ошибка подключения к серверу');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [moduleId, isSpaced]);

  // Фоновый предзапуск генерации качественной озвучки Microsoft Edge Neural TTS (нормальная и медленная скорости)
  useEffect(() => {
    if (allOriginalCards && allOriginalCards.length > 0) {
      allOriginalCards.forEach(card => {
        // Предзагружаем озвучку для самого слова (обычная и медленная)
        fetch(`${API_BASE}/api/tts?text=${encodeURIComponent(card.characters)}`).catch(() => {});
        fetch(`${API_BASE}/api/tts?text=${encodeURIComponent(card.characters)}&rate=slow`).catch(() => {});
        
        // Предзагружаем озвучку для примеров использования (обычная и медленная)
        if (card.examples && Array.isArray(card.examples)) {
          card.examples.forEach(ex => {
            fetch(`${API_BASE}/api/tts?text=${encodeURIComponent(ex.chinese)}`).catch(() => {});
            fetch(`${API_BASE}/api/tts?text=${encodeURIComponent(ex.chinese)}&rate=slow`).catch(() => {});
          });
        }
      });
    }
  }, [allOriginalCards]);

  // Генерация вариантов ответов для викторины (вызывается при смене индекса карточки в режиме 'quiz')
  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length && currentMode === 'quiz') {
      const correctText = cards[currentIndex].translation;
      const options = new Set([correctText]);
      
      // Выбираем другие варианты перевода из этого же модуля
      const otherTranslations = allOriginalCards
        .map(c => c.translation)
        .filter(t => t !== correctText);

      const shuffledOthers = [...otherTranslations].sort(() => Math.random() - 0.5);
      
      for (let i = 0; i < shuffledOthers.length && options.size < 4; i++) {
        options.add(shuffledOthers[i]);
      }

      // Заполняем варианты
      setQuizOptions(Array.from(options).sort(() => Math.random() - 0.5));
      setSelectedOption(null);
      setIsQuizCorrect(null);
    }
  }, [cards, currentIndex, currentMode, allOriginalCards]);

  // Автозвук в режиме Диктанта при смене слова
  useEffect(() => {
    if (cards.length > 0 && currentIndex < cards.length && currentMode === 'dictation') {
      setDictationInput('');
      setIsDictationChecked(false);
      setIsDictationCorrect(false);

      setTimeout(() => {
        triggerAutoplaySound(cards[currentIndex].characters);
      }, 300);
    }
  }, [cards, currentIndex, currentMode]);

  const handleCardFlip = () => {
    if (currentMode === 'cards') {
      setIsFlipped(!isFlipped);
    }
  };

  const handleAnswer = async (knows) => {
    const card = cards[currentIndex];
    
    // Обновляем статистику сессии
    setSessionStats(prev => ({
      ...prev,
      know: knows ? prev.know + 1 : prev.know,
      dontKnow: !knows ? prev.dontKnow + 1 : prev.dontKnow
    }));

    try {
      if (!navigator.onLine) {
        queueOfflineProgress(card.id, knows ? 'know' : 'dont_know', moduleId);
        showToast('Прогресс сохранен офлайн 📶', 'info');
      } else {
        const response = await fetch(`${API_BASE}/api/progress`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            cardId: card.id,
            status: knows ? 'know' : 'dont_know'
          })
        });

        if (!response.ok) {
          queueOfflineProgress(card.id, knows ? 'know' : 'dont_know', moduleId);
        }
      }
    } catch (err) {
      queueOfflineProgress(card.id, knows ? 'know' : 'dont_know', moduleId);
      showToast('Прогресс сохранен офлайн 📶', 'info');
    }

    setIsFlipped(false);
    
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    }, 250);
  };

  // Выбор ответа в Викторине
  const handleSelectQuizOption = async (option) => {
    if (selectedOption !== null) return; // Уже ответили

    const correctTranslation = cards[currentIndex].translation;
    const isCorrect = option === correctTranslation;

    setSelectedOption(option);
    setIsQuizCorrect(isCorrect);

    // Отправляем результат в базу
    try {
      await fetch(`${API_BASE}/api/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: cards[currentIndex].id,
          status: isCorrect ? 'know' : 'dont_know'
        })
      });
    } catch (err) {
      console.error(err);
    }

    setSessionStats(prev => ({
      ...prev,
      know: isCorrect ? prev.know + 1 : prev.know,
      dontKnow: !isCorrect ? prev.dontKnow + 1 : prev.dontKnow
    }));

    // Переход дальше через 1.2 сек
    setTimeout(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        setSessionCompleted(true);
      }
    }, 1200);
  };

  // Проверка Диктанта
  const handleCheckDictation = async (e) => {
    e.preventDefault();
    if (isDictationChecked) return; // Уже проверили

    const correctPinyin = cards[currentIndex].pinyin;
    const isCorrect = cleanPinyinForMatching(dictationInput) === cleanPinyinForMatching(correctPinyin);

    setIsDictationCorrect(isCorrect);
    setIsDictationChecked(true);

    try {
      await fetch(`${API_BASE}/api/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cardId: cards[currentIndex].id,
          status: isCorrect ? 'know' : 'dont_know'
        })
      });
    } catch (err) {
      console.error(err);
    }

    setSessionStats(prev => ({
      ...prev,
      know: isCorrect ? prev.know + 1 : prev.know,
      dontKnow: !isCorrect ? prev.dontKnow + 1 : prev.dontKnow
    }));
  };

  const handleNextDictation = () => {
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionCompleted(true);
    }
  };

  const restartSession = () => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    setCards(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionStats({ know: 0, dontKnow: 0 });
    setSessionCompleted(false);
    setSelectedOption(null);
    setIsQuizCorrect(null);
    setDictationInput('');
    setIsDictationChecked(false);
    setIsDictationCorrect(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', gap: '16px' }}>
        <div style={{ fontSize: '2rem' }}>🔄</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Загрузка карточек для изучения...</p>
        <button 
          onClick={handleBack} 
          className="btn-neon btn-secondary" 
          style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', marginTop: '12px' }}
        >
          <ArrowLeft size={16} /> Назад
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px' }}>
        <div style={{
          background: 'rgba(255, 51, 102, 0.1)',
          border: '1px solid rgba(255, 51, 102, 0.3)',
          color: '#ff668c',
          padding: '20px',
          borderRadius: '16px',
          textAlign: 'center'
        }}>
          <p>{error}</p>
          <button onClick={handleBack} className="btn-neon btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', marginTop: '16px' }}>
            <ArrowLeft size={16} /> Назад
          </button>
        </div>
      </div>
    );
  }

  // Если карточек нет (особенно в режиме интервальных повторений)
  if (cards.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '80px auto', padding: '20px' }}>
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '16px', color: 'var(--neon-green)' }}>
            🎉 Все карточки повторены!
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: '1.5' }}>
            {spaced 
              ? 'На сегодня у вас нет карточек к повторению в этом модуле. Отличная работа! Вы можете продолжить в режиме просмотра всех карточек подряд или пройти тест/диктант.' 
              : 'В этом модуле отсутствуют карточки. Добавьте новые слова в настройках модуля.'}
          </p>
          <button onClick={handleBack} className="btn-neon btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}>
            <ArrowLeft size={16} /> Назад
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progressPercent = Math.round(((currentIndex) / cards.length) * 100);

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '40px 20px 100px 20px' }}>
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
            onClick={handleBack}
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
          
          {/* Режим тренировки */}
          <span style={{
            fontSize: '0.8rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '4px 12px',
            color: 'var(--neon-cyan)',
            fontWeight: '600'
          }}>
            {currentMode === 'cards' && (isSpaced ? '⏰ Интервальные карточки' : '🗂️ Карточки (Все)')}
            {currentMode === 'quiz' && '🎯 Викторина'}
            {currentMode === 'dictation' && '✍️ Диктант'}
          </span>
        </div>

        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
          Сессия: {currentIndex + 1} из {cards.length}
        </span>
      </div>

      {!sessionCompleted ? (
        <>
          {/* Прогресс-бар сессии */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', marginBottom: '40px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'var(--neon-cyan)',
              boxShadow: '0 0 8px rgba(0, 242, 254, 0.5)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* 1. РЕЖИМ КАРТОЧЕК */}
          {currentMode === 'cards' && (
            <>
              {/* Переключатель направления перевода */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCardDirection(cardDirection === 'zh-to-ru' ? 'ru-to-zh' : 'zh-to-ru');
                  }}
                  className="btn-neon btn-secondary"
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '600',
                    border: '1px solid rgba(255,255,255,0.08)'
                  }}
                >
                  🔁 Направление: {cardDirection === 'zh-to-ru' ? '🇨🇳 Китайский ➡️ 🇷🇺 Русский' : '🇷🇺 Русский ➡️ 🇨🇳 Китайский'}
                </button>
              </div>

              <div className={`flip-card ${isFlipped ? 'flipped' : ''}`} onClick={handleCardFlip}>
                <div className="flip-card-inner">
                  {/* Лицевая сторона */}
                  <div className="flip-card-front" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '16px' }}>
                      {cardDirection === 'zh-to-ru' ? (
                        <>
                          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--neon-cyan)', letterSpacing: '3px', fontWeight: '600' }}>
                            {displayMode === 'pinyin' ? 'Транскрипция (Пиньинь)' : 'Китайский язык'}
                          </span>
                          {/* Контейнер для центрирования иероглифа/пиньиня и кнопки озвучки */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '8px 0' }}>
                            {displayMode === 'pinyin' ? (
                              <span style={{ fontSize: '3.4rem', fontWeight: '700', color: 'var(--neon-cyan)', textShadow: '0 0 20px rgba(0, 242, 254, 0.4)', letterSpacing: '1px' }}>
                                {currentCard.pinyin}
                              </span>
                            ) : (
                              <span className="chinese-char" style={{ fontSize: '4.2rem' }}>{currentCard.characters}</span>
                            )}
                            <AudioPlayer text={currentCard.characters} style={{ width: '48px', height: '48px' }} />
                          </div>
                        </>
                      ) : (
                        <>
                          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--neon-cyan)', letterSpacing: '3px', fontWeight: '600' }}>
                            Перевод на русский
                          </span>
                          <div style={{ fontSize: '2.4rem', fontWeight: '700', color: '#fff', textAlign: 'center', padding: '0 20px', lineHeight: '1.3' }}>
                            {currentCard.translation}
                          </div>
                        </>
                      )}
                      {Boolean(currentCard?.box && currentCard.box > 0) && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          📦 Коробка Лейтнера: {currentCard.box}
                        </span>
                      )}
                    </div>

                    <span style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--text-secondary)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      padding: '8px 20px',
                      borderRadius: '30px',
                      border: '1px solid var(--border-color)',
                      marginTop: '12px'
                    }}>
                      Нажмите для перевода
                    </span>
                  </div>

                  {/* Обратная сторона */}
                  <div className="flip-card-back" style={{ padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '100%' }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '12px' }}>
                      <div className="chinese-char-sm" style={{ color: '#fff', fontSize: '3.2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px' }}>
                        {currentCard.characters}
                        <AudioPlayer text={currentCard.characters} style={{ width: '44px', height: '44px' }} />
                      </div>
                      <div style={{
                        fontSize: '1.6rem',
                        color: 'var(--neon-cyan)',
                        fontWeight: '700',
                        letterSpacing: '1px',
                        textShadow: '0 0 12px rgba(0, 242, 254, 0.3)'
                      }}>
                        {currentCard.pinyin}
                      </div>
                      <div style={{ 
                        fontSize: '1.6rem', 
                        fontWeight: '600', 
                        color: '#fff',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        paddingTop: '16px',
                        maxWidth: '90%',
                        margin: '8px auto 0 auto',
                        textAlign: 'center'
                      }}>
                        {currentCard.translation}
                      </div>
                    </div>

                    {/* Блок с примерами */}
                    {currentCard.examples && currentCard.examples.length > 0 && (
                      <div style={{
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderRadius: '16px',
                        padding: '16px',
                        textAlign: 'left',
                        maxHeight: '130px',
                        overflowY: 'auto',
                        marginBottom: '8px'
                      }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                          <span>Пример использования:</span>
                          <AudioPlayer text={currentCard.examples[0].chinese} />
                        </span>
                        {currentCard.examples.map((ex, idx) => (
                          <div key={idx} style={{ fontSize: '0.95rem', lineHeight: '1.4' }}>
                            <div style={{ fontFamily: 'Noto Sans SC', color: '#fff', fontSize: '1.1rem', fontWeight: '500' }}>{ex.chinese}</div>
                            <div style={{ color: 'var(--neon-cyan)', fontSize: '0.85rem' }}>{ex.pinyin}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{ex.translation}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Кликните, чтобы скрыть ответ
                    </span>
                  </div>
                </div>
              </div>

              {/* Кнопки оценки знаний */}
              <div style={{
                display: 'flex',
                gap: '20px',
                marginTop: '40px',
                justifyContent: 'center',
                height: '60px',
                visibility: isFlipped ? 'visible' : 'hidden',
                opacity: isFlipped ? 1 : 0,
                transition: 'opacity 0.2s ease, visibility 0.2s'
              }}>
                <button 
                  onClick={() => handleAnswer(false)}
                  className="btn-neon btn-red"
                  style={{ flex: 1, padding: '12px 24px', fontSize: '1rem', fontWeight: '600' }}
                >
                  <X size={20} /> Не помню
                </button>
                <button 
                  onClick={() => handleAnswer(true)}
                  className="btn-neon btn-green"
                  style={{ flex: 1, padding: '12px 24px', fontSize: '1rem', fontWeight: '600' }}
                >
                  <Check size={20} /> Помню
                </button>
              </div>

              {/* Панель тренировки письма */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '500px', margin: '20px auto 0 auto' }}>
                <button 
                  onClick={() => setShowWriting(!showWriting)} 
                  className="btn-neon btn-secondary"
                  style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', borderRadius: '10px', fontSize: '0.85rem' }}
                >
                  ✍️ {showWriting ? 'Скрыть тренажер письма' : 'Потренироваться писать иероглиф'}
                </button>
                
                {showWriting && (
                  <div className="glass-panel" style={{ width: '100%', marginTop: '16px', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <WritingTrainer word={currentCard.characters} />
                  </div>
                )}
              </div>
            </>
          )}

          {/* 2. РЕЖИМ ВИКТОРИНЫ (QUIZ) */}
          {currentMode === 'quiz' && (
            <div className="glass-panel" style={{ padding: '36px 30px', borderRadius: '24px', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px', display: 'block', marginBottom: '16px' }}>
                  Выберите правильный перевод для:
                </span>
                
                {/* Иероглиф с кнопкой звука */}
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                  <span className="chinese-char-sm" style={{ fontSize: '3rem', color: '#fff' }}>{currentCard.characters}</span>
                  <AudioPlayer text={currentCard.characters} />
                </div>
                
                {/* Подсказка пиньиня (показывается только после выбора ответа) */}
                <div style={{ height: '24px', color: 'var(--neon-cyan)', fontWeight: '600', opacity: selectedOption ? 1 : 0, transition: 'opacity 0.3s ease' }}>
                  {currentCard.pinyin}
                </div>
              </div>

              {/* Варианты ответов */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                {quizOptions.map((option, idx) => {
                  const isSelected = selectedOption === option;
                  const isCorrectAnswer = option === currentCard.translation;
                  
                  let btnStyle = 'btn-secondary';
                  let customShadow = 'none';
                  
                  if (selectedOption !== null) {
                    if (isCorrectAnswer) {
                      btnStyle = 'btn-green';
                      customShadow = 'var(--glow-green)';
                    } else if (isSelected) {
                      btnStyle = 'btn-red';
                      customShadow = 'var(--glow-red)';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectQuizOption(option)}
                      disabled={selectedOption !== null}
                      className={`btn-neon ${btnStyle}`}
                      style={{
                        width: '100%',
                        padding: '14px 20px',
                        borderRadius: '12px',
                        fontSize: '0.95rem',
                        justifyContent: 'center',
                        boxShadow: customShadow,
                        transition: 'all 0.2s ease',
                        opacity: selectedOption !== null && !isSelected && !isCorrectAnswer ? 0.4 : 1
                      }}
                    >
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. РЕЖИМ ДИКТАНТА (DICTATION) */}
          {currentMode === 'dictation' && (
            <div className="glass-panel" style={{ padding: '36px 30px', borderRadius: '24px', minHeight: '380px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px', display: 'block', marginBottom: '16px' }}>
                  Прослушайте слово и напишите транскрипцию (Пиньинь):
                </span>
                
                {/* Озвучка */}
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
                  <span style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '500' }}>Слово:</span>
                  <AudioPlayer text={currentCard.characters} className="btn-cyan" style={{ width: '50px', height: '50px' }} />
                </div>
                
                {/* Подсказка в виде перевода */}
                <div style={{ 
                  fontSize: '1.15rem', 
                  color: 'var(--text-secondary)', 
                  fontWeight: '500', 
                  background: 'rgba(255,255,255,0.02)',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  display: 'inline-block',
                  border: '1px solid rgba(255,255,255,0.05)',
                  marginTop: '10px'
                }}>
                  Значение: {currentCard.translation}
                </div>
              </div>

              {/* Форма ввода диктанта */}
              <form onSubmit={handleCheckDictation} style={{ width: '100%' }}>
                <div style={{ marginBottom: '24px' }}>
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="Введите пиньинь (например, ni hao)"
                    value={dictationInput}
                    onChange={(e) => setDictationInput(e.target.value)}
                    disabled={isDictationChecked}
                    style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5px' }}
                    autoFocus
                    required
                  />
                </div>

                {/* Результаты проверки */}
                {isDictationChecked && (
                  <div style={{
                    background: isDictationCorrect ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 51, 102, 0.08)',
                    border: `1px solid ${isDictationCorrect ? 'rgba(0, 255, 136, 0.25)' : 'rgba(255, 51, 102, 0.25)'}`,
                    color: isDictationCorrect ? 'var(--neon-green)' : 'var(--neon-red)',
                    padding: '16px',
                    borderRadius: '12px',
                    marginBottom: '24px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '4px' }}>
                      {isDictationCorrect ? '🎉 Правильно!' : '❌ Неправильно'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#fff' }}>
                      Иероглиф: <span className="chinese-char-sm" style={{ fontSize: '1.2rem', marginLeft: '4px' }}>{currentCard.characters}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Верный пиньинь: <strong style={{ color: 'var(--neon-cyan)' }}>{currentCard.pinyin}</strong>
                    </div>
                  </div>
                )}

                {/* Кнопка отправки формы или перехода к следующему */}
                {!isDictationChecked ? (
                  <button
                    type="submit"
                    className="btn-neon btn-cyan"
                    style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: '600' }}
                  >
                    Проверить ответ
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextDictation}
                    className="btn-neon btn-green"
                    style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: '600' }}
                  >
                    Продолжить
                  </button>
                )}
              </form>
            </div>
          )}
        </>
      ) : (
        /* Экран результатов сессии */
        (() => {
          const totalAnswers = sessionStats.know + sessionStats.dontKnow;
          const successRatio = totalAnswers > 0 ? sessionStats.know / totalAnswers : 0;
          
          let titleZh = '太棒了!';
          let titleRu = 'Идеально!';
          let titleGradient = 'linear-gradient(45deg, var(--neon-cyan), var(--neon-green))';
          let subtitle = 'Потрясающий результат! Вы ответили правильно на все вопросы.';

          if (successRatio < 0.4) {
            titleZh = '再接再厉!';
            titleRu = 'Нужно повторить!';
            titleGradient = 'linear-gradient(45deg, #ff3366, #ff9900)';
            subtitle = 'Много ошибок. Попробуйте повторить сессию заново!';
          } else if (successRatio < 0.7) {
            titleZh = '加油!';
            titleRu = 'Неплохая попытка!';
            titleGradient = 'linear-gradient(45deg, #f39c12, var(--neon-cyan))';
            subtitle = 'Почти получилось! Повторите слабые карточки.';
          } else if (successRatio < 1.0) {
            titleZh = '很好!';
            titleRu = 'Отличный результат!';
            titleGradient = 'linear-gradient(45deg, var(--neon-cyan), var(--neon-green))';
            subtitle = 'Хорошая работа! Вы уверенно знаете материал.';
          }

          return (
            <div className="glass-panel" style={{ padding: '40px 24px', textAlign: 'center', borderRadius: '24px' }}>
              <h3 className="chinese-char-sm" style={{ 
                fontSize: '2.4rem', 
                background: titleGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '12px'
              }}>
                {titleZh} ({titleRu})
              </h3>
              <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', marginBottom: '32px' }}>{subtitle}</p>

              {/* Блок статистики сессии */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-around',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '40px'
              }}>
                <div>
                  <div style={{ fontSize: '2.2rem', fontWeight: '700', color: 'var(--neon-green)', textShadow: '0 0 10px rgba(0, 255, 136, 0.2)' }}>
                    {sessionStats.know}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Успешно</div>
                </div>
                <div style={{ borderRight: '1px solid var(--border-color)' }} />
                <div>
                  <div style={{ fontSize: '2.2rem', fontWeight: '700', color: 'var(--neon-red)', textShadow: '0 0 10px rgba(255, 51, 102, 0.2)' }}>
                    {sessionStats.dontKnow}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Ошибок</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <button 
                  onClick={restartSession}
                  className="btn-neon btn-cyan"
                  style={{ flex: 1, padding: '12px 20px', fontWeight: '600', minWidth: '160px' }}
                >
                  <RefreshCw size={16} /> Повторить сессию
                </button>
                <button 
                  onClick={handleBack}
                  className="btn-neon btn-secondary"
                  style={{ flex: 1, padding: '12px 20px', fontWeight: '600', minWidth: '160px' }}
                >
                  В главное меню
                </button>
              </div>
            </div>
          );
        })()
      )}
    </div>
  );
}
