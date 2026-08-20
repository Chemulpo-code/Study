import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Check, X } from '../components/Icons';

// Слог-пул для тренировок
const practiceSyllables = [
  'ma', 'ba', 'di', 'lu', 'fei', 'hao', 'ren', 'guo', 'chi', 'zhao', 
  'qian', 'xiao', 'long', 'bei', 'kan', 'men', 'tian', 'shang', 'wen', 'lü'
];

// Копии функции знаков тонов для независимости страницы
const addToneMark = (syllable, tone) => {
  if (tone === 5 || tone === 0) return syllable;
  
  const toneMarks = {
    a: ['ā', 'á', 'ǎ', 'à'],
    o: ['ō', 'ó', 'ǒ', 'ò'],
    e: ['ē', 'é', 'ě', 'è'],
    i: ['ī', 'í', 'ǐ', 'ì'],
    u: ['ū', 'ú', 'ǔ', 'ù'],
    ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  };

  let cleaned = syllable.replace('v', 'ü');
  let chars = cleaned.split('');
  
  let indexToMark = -1;
  
  if (cleaned.includes('a')) {
    indexToMark = cleaned.indexOf('a');
  } else if (cleaned.includes('o')) {
    indexToMark = cleaned.indexOf('o');
  } else if (cleaned.includes('e')) {
    indexToMark = cleaned.indexOf('e');
  } else if (cleaned.includes('ui')) {
    indexToMark = cleaned.indexOf('i');
  } else if (cleaned.includes('iu')) {
    indexToMark = cleaned.indexOf('u');
  } else if (cleaned.includes('i')) {
    indexToMark = cleaned.indexOf('i');
  } else if (cleaned.includes('u')) {
    indexToMark = cleaned.indexOf('u');
  } else if (cleaned.includes('ü')) {
    indexToMark = cleaned.indexOf('ü');
  }

  if (indexToMark !== -1) {
    const vowel = chars[indexToMark];
    if (toneMarks[vowel]) {
      chars[indexToMark] = toneMarks[vowel][tone - 1];
    }
  }

  return chars.join('');
};

export default function ToneTrainerPage({ onBack }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedTone, setSelectedTone] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);

  // Инициализация раунда (10 случайных вопросов)
  const startNewRound = () => {
    const roundQuestions = [];
    const shuffledSyllables = [...practiceSyllables].sort(() => Math.random() - 0.5);
    
    // Берем первые 10 слогов и вешаем случайный тон
    for (let i = 0; i < 10; i++) {
      const syllable = shuffledSyllables[i];
      const correctTone = Math.floor(Math.random() * 4) + 1; // 1, 2, 3, 4
      roundQuestions.push({ syllable, correctTone });
    }

    setQuestions(roundQuestions);
    setCurrentIndex(0);
    setSelectedTone(null);
    setIsAnswered(false);
    setScore(0);
    setGameCompleted(false);
  };

  useEffect(() => {
    startNewRound();
  }, []);

  const currentQuestion = questions[currentIndex];

  const playSound = (syllable, tone) => {
    // Преобразуем ü в v для соответствия именам файлов
    const cleanSyllable = syllable.toLowerCase().replace('ü', 'v');
    const url = `https://cdn.jsdelivr.net/gh/davinfifield/mp3-chinese-pinyin-sound@master/mp3/${cleanSyllable}${tone}.mp3`;
    
    if (window.activeAudio) {
      try {
        window.activeAudio.pause();
        window.activeAudio.currentTime = 0;
      } catch (e) {}
    }
    
    const audio = new Audio(url);
    window.activeAudio = audio;
    
    audio.play().catch(err => {
      console.warn('Ошибка воспроизведения MP3, пробуем Google TTS:', err);
      const tonedWord = addToneMark(syllable, tone);
      const ttsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=zh-CN&client=tw-ob&q=${encodeURIComponent(tonedWord)}`;
      
      if (window.activeAudio) {
        try {
          window.activeAudio.pause();
          window.activeAudio.currentTime = 0;
        } catch (e) {}
      }
      
      const fallbackAudio = new Audio(ttsUrl);
      window.activeAudio = fallbackAudio;
      fallbackAudio.play();
    });
  };

  // Автопроигрывание звука при смене вопроса
  useEffect(() => {
    if (currentQuestion && !gameCompleted) {
      setTimeout(() => {
        playSound(currentQuestion.syllable, currentQuestion.correctTone);
      }, 400);
    }
  }, [currentQuestion, gameCompleted]);

  const handleSelectTone = (tone) => {
    if (isAnswered) return;

    setSelectedTone(tone);
    setIsAnswered(true);

    const isCorrect = tone === currentQuestion.correctTone;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedTone(null);
      setIsAnswered(false);
    } else {
      setGameCompleted(true);
    }
  };

  if (questions.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Подготовка тренировки...</p>
      </div>
    );
  }

  const progressPercent = Math.round((currentIndex / questions.length) * 100);

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
            🎧 Тренажер тонов
          </h2>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Вопрос: {currentIndex + 1} из {questions.length}
        </span>
      </div>

      {!gameCompleted ? (
        <>
          {/* Шкала прогресса */}
          <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '2px', marginBottom: '40px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'var(--neon-cyan)',
              boxShadow: '0 0 8px rgba(0, 242, 254, 0.5)',
              transition: 'width 0.3s ease'
            }} />
          </div>

          {/* Карточка вопроса */}
          <div className="glass-panel" style={{
            padding: '40px 30px',
            borderRadius: '24px',
            textAlign: 'center',
            marginBottom: '32px',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)'
          }}>
            <h3 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>
              Прослушайте слог и определите его тон:
            </h3>

            {/* Кнопка повтора звука */}
            <button
              onClick={() => playSound(currentQuestion.syllable, currentQuestion.correctTone)}
              className="btn-neon btn-cyan"
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--glow-cyan)',
                border: 'none',
                cursor: 'pointer',
                marginBottom: '24px'
              }}
              title="Повторить произношение"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            </button>

            {/* Отображение базового слога без тона */}
            <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#fff', letterSpacing: '1px', marginBottom: '8px' }}>
              {currentQuestion.syllable}
            </div>

            {/* Блок результата */}
            {isAnswered && (
              <div style={{
                marginTop: '16px',
                padding: '16px',
                borderRadius: '16px',
                background: selectedTone === currentQuestion.correctTone ? 'rgba(0, 255, 136, 0.08)' : 'rgba(255, 51, 102, 0.08)',
                border: `1px solid ${selectedTone === currentQuestion.correctTone ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 51, 102, 0.2)'}`,
                color: selectedTone === currentQuestion.correctTone ? 'var(--neon-green)' : 'var(--neon-red)',
                animation: 'fadeIn 0.3s ease'
              }}>
                <span style={{ fontWeight: '600', fontSize: '1.05rem', display: 'block', marginBottom: '4px' }}>
                  {selectedTone === currentQuestion.correctTone ? '🎉 Абсолютно верно!' : '❌ Ошибка в тоне'}
                </span>
                <span style={{ color: '#fff' }}>
                  Правильный слог: <strong style={{ fontSize: '1.25rem', color: 'var(--neon-cyan)', marginLeft: '4px' }}>
                    {addToneMark(currentQuestion.syllable, currentQuestion.correctTone)}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Варианты тонов (кнопки) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginBottom: '32px'
          }}>
            {[1, 2, 3, 4].map(tone => {
              const tonedRepresentation = addToneMark(currentQuestion.syllable, tone);
              
              let toneName = '';
              let toneArrow = '';
              if (tone === 1) { toneName = 'Ровный'; toneArrow = 'ā ➔'; }
              if (tone === 2) { toneName = 'Восходящий'; toneArrow = 'á ↗'; }
              if (tone === 3) { toneName = 'Нисходяще-восх.'; toneArrow = 'ǎ ↘↗'; }
              if (tone === 4) { toneName = 'Нисходящий'; toneArrow = 'à ↘'; }

              const isSelected = selectedTone === tone;
              const isCorrectAnswer = tone === currentQuestion.correctTone;
              
              let btnStyle = 'btn-secondary';
              let shadow = 'none';

              if (isAnswered) {
                if (isCorrectAnswer) {
                  btnStyle = 'btn-green';
                  shadow = 'var(--glow-green)';
                } else if (isSelected) {
                  btnStyle = 'btn-red';
                  shadow = 'var(--glow-red)';
                }
              }

              return (
                <button
                  key={tone}
                  onClick={() => handleSelectTone(tone)}
                  disabled={isAnswered}
                  className={`btn-neon ${btnStyle}`}
                  style={{
                    padding: '16px 10px',
                    borderRadius: '16px',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: shadow,
                    transition: 'all 0.2s ease',
                    opacity: isAnswered && !isSelected && !isCorrectAnswer ? 0.4 : 1
                  }}
                >
                  <span style={{ fontSize: '1.7rem', fontWeight: '700', color: isAnswered && (isCorrectAnswer || isSelected) ? 'inherit' : 'var(--neon-cyan)' }}>
                    {tonedRepresentation}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', marginTop: '2px' }}>
                    {toneArrow}
                  </span>
                  <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                    Тон {tone} ({toneName})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Кнопка "Дальше" */}
          {isAnswered && (
            <button
              onClick={handleNext}
              className="btn-neon btn-cyan"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '1rem',
                fontWeight: '600',
                boxShadow: 'var(--glow-cyan)'
              }}
            >
              Продолжить
            </button>
          )}
        </>
      ) : (
        /* Результаты игры */
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)' }}>
          <h3 className="chinese-char-sm" style={{ 
            fontSize: '2.3rem', 
            background: 'linear-gradient(45deg, var(--neon-cyan), var(--neon-violet))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '16px'
          }}>
            Результаты раунда
          </h3>
          
          <div style={{
            fontSize: '1.3rem',
            color: '#fff',
            marginBottom: '32px'
          }}>
            Вы определили правильно <strong style={{ color: 'var(--neon-green)', fontSize: '1.6rem' }}>{score}</strong> тонов из 10.
          </div>

          {/* Оценка успехов */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid var(--border-color)',
            padding: '20px',
            borderRadius: '16px',
            marginBottom: '40px',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: '1.5'
          }}>
            {score === 10 && '🌟 Потрясающе! У вас абсолютный музыкальный слух на китайские тоны! Вы отлично чувствуете разницу.'}
            {score >= 8 && score < 10 && '✨ Замечательный результат! Вы очень хорошо различаете китайские тоны на слух. Продолжайте в том же духе!'}
            {score >= 5 && score < 8 && '👍 Неплохо! Ваше ухо начинает привыкать к тонам, но нужно еще немного практики.'}
            {score < 5 && '💪 Пока тяжеловато, но это нормально для старта! Китайские тоны требуют времени на адаптацию слуха. Попробуйте еще раз!'}
          </div>

          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={startNewRound}
              className="btn-neon btn-cyan"
              style={{ flex: 1, padding: '12px 20px', fontWeight: '600' }}
            >
              <RefreshCw size={16} /> Начать заново
            </button>
            <button 
              onClick={onBack}
              className="btn-neon btn-secondary"
              style={{ flex: 1, padding: '12px 20px', fontWeight: '600' }}
            >
              В главное меню
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
