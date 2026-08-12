import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw, Check, X } from '../components/Icons';
import AudioPlayer from '../components/AudioPlayer';
import { API_BASE } from '../config';

export default function SpeedSprintPage({ token, displayMode, onBack }) {
  const [loading, setLoading] = useState(true);
  const [allCards, setAllCards] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  
  const [currentCard, setCurrentCard] = useState(null);
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [timeLeft, setTimeLeft] = useState(100); // % полосы времени (100% -> 0%)
  const [bestScore, setBestScore] = useState(0);

  const timerRef = useRef(null);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const resModules = await fetch('${API_BASE}/api/modules', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const modules = await resModules.json();
        
        const cardPromises = modules.map(async (m) => {
          const res = await fetch(`${API_BASE}/api/modules/${m.id}/cards`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return res.ok ? await res.json() : [];
        });
        
        const results = await Promise.all(cardPromises);
        const merged = results.flat();
        setAllCards(merged);

        const savedBest = localStorage.getItem('sprint_best_score');
        if (savedBest) setBestScore(parseInt(savedBest, 10));
      } catch (err) {
        console.error('Ошибка загрузки слов:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCards();
  }, [token]);

  const startGame = () => {
    if (allCards.length < 4) return;
    setScore(0);
    setCombo(0);
    setLives(3);
    setGameOver(false);
    setGameStarted(true);
    nextQuestion(allCards, 0, 3);
  };

  const nextQuestion = (cardsList, currentScore, currentLives) => {
    if (currentLives <= 0) {
      endGame(currentScore);
      return;
    }

    // Случайный выбор текущего слова
    const targetIndex = Math.floor(Math.random() * cardsList.length);
    const target = cardsList[targetIndex];
    setCurrentCard(target);

    // Подбор 3 дистракторов
    const distractors = cardsList.filter(c => c.id !== target.id);
    const shuffledDistractors = [...distractors].sort(() => Math.random() - 0.5).slice(0, 3);
    const allOpts = [...shuffledDistractors, target].sort(() => Math.random() - 0.5);
    setOptions(allOpts);

    // Сброс таймера (каждый вопрос дается раунд в зависимости от комбо)
    setTimeLeft(100);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Таймер убывания: 6 секунд на вопрос
    const intervalTime = 60; // мс
    const decrement = 100 / (6000 / intervalTime);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timerRef.current);
          handleTimeOut(cardsList, currentScore, currentLives);
          return 0;
        }
        return prev - decrement;
      });
    }, intervalTime);
  };

  const handleTimeOut = (cardsList, currentScore, currentLives) => {
    const newLives = currentLives - 1;
    setLives(newLives);
    setCombo(0);
    if (newLives <= 0) {
      endGame(currentScore);
    } else {
      nextQuestion(cardsList, currentScore, newLives);
    }
  };

  const handleSelectOption = (opt) => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (opt.id === currentCard.id) {
      // ПРАВИЛЬНО
      const multiplier = Math.min(Math.floor(combo / 3) + 1, 4);
      const points = 10 * multiplier;
      const newScore = score + points;
      const newCombo = combo + 1;
      
      setScore(newScore);
      setCombo(newCombo);
      
      if (newScore > bestScore) {
        setBestScore(newScore);
        localStorage.setItem('sprint_best_score', newScore.toString());
      }

      nextQuestion(allCards, newScore, lives);
    } else {
      // НЕПРАВИЛЬНО
      const newLives = lives - 1;
      setLives(newLives);
      setCombo(0);
      
      if (newLives <= 0) {
        endGame(score);
      } else {
        nextQuestion(allCards, score, newLives);
      }
    }
  };

  const endGame = (finalScore) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setGameOver(true);
    setGameStarted(false);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#fff' }}>
        <div className="loader" style={{ borderTopColor: 'var(--neon-cyan)' }} />
        <span style={{ marginLeft: '12px' }}>Загрузка спринта...</span>
      </div>
    );
  }

  if (allCards.length < 4) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <button onClick={onBack} className="btn-neon btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Назад
        </button>
        <div className="glass-panel" style={{ padding: '40px 30px', borderRadius: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--neon-red)', marginBottom: '16px' }}>⚠️ Недостаточно слов</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Для режима «Неоновый Спринт» нужно иметь минимум **4 карточки** в базе.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <button onClick={onBack} className="btn-neon btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> В меню
        </button>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          🏆 Рекорд: <span style={{ color: 'var(--neon-green)', fontWeight: '700' }}>{bestScore}</span>
        </div>
      </div>

      {!gameStarted && !gameOver && (
        <div className="glass-panel" style={{ padding: '50px 30px', borderRadius: '24px', textAlign: 'center' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}>🚀</span>
          <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '16px' }}>Неоновый Спринт</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 32px auto', lineHeight: '1.6' }}>
            Успевайте выбирать правильный перевод, пока убывает полоса времени! Каждые 3 правильных ответа подряд увеличивают множитель очков. У вас 3 жизни.
          </p>
          <button onClick={startGame} className="btn-neon btn-cyan" style={{ padding: '14px 40px', fontSize: '1.1rem', fontWeight: '700' }}>
            Старт Спринта
          </button>
        </div>
      )}

      {gameOver && (
        <div className="glass-panel" style={{ padding: '50px 30px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(255,51,102,0.3)' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}>🏁</span>
          <h2 style={{ fontSize: '2rem', color: '#fff', marginBottom: '12px' }}>Спринт Завершен!</h2>
          <p style={{ fontSize: '1.4rem', color: 'var(--neon-cyan)', fontWeight: '700', marginBottom: '8px' }}>
            Заработано очков: {score}
          </p>
          {score === bestScore && score > 0 && (
            <p style={{ color: 'var(--neon-green)', fontWeight: '600', marginBottom: '24px' }}>🔥 Новый рекорд очков!</p>
          )}
          <button onClick={startGame} className="btn-neon btn-cyan" style={{ padding: '12px 36px', fontSize: '1rem', fontWeight: '600', marginTop: '16px' }}>
            Сыграть снова
          </button>
        </div>
      )}

      {gameStarted && currentCard && (
        <div>
          {/* Индикаторы жизней, счета и комбо */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[1, 2, 3].map(heartIdx => (
                <span key={heartIdx} style={{ fontSize: '1.4rem', opacity: heartIdx <= lives ? 1 : 0.2 }}>
                  ❤️
                </span>
              ))}
            </div>

            {combo >= 3 && (
              <div className="animate-pulse" style={{
                background: 'rgba(255, 204, 0, 0.15)',
                border: '1px solid rgba(255, 204, 0, 0.4)',
                color: '#ffcc00',
                padding: '4px 12px',
                borderRadius: '20px',
                fontWeight: '700',
                fontSize: '0.85rem'
              }}>
                🔥 COMBO x{Math.min(Math.floor(combo / 3) + 1, 4)}!
              </div>
            )}

            <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--neon-cyan)' }}>
              {score} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>очков</span>
            </div>
          </div>

          {/* Полоса времени */}
          <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden', marginBottom: '32px' }}>
            <div style={{
              width: `${timeLeft}%`,
              height: '100%',
              background: timeLeft > 30 ? 'var(--neon-cyan)' : 'var(--neon-red)',
              boxShadow: timeLeft > 30 ? '0 0 10px rgba(0,242,254,0.5)' : '0 0 10px rgba(255,51,102,0.5)',
              transition: 'width 0.06s linear'
            }} />
          </div>

          {/* Главное слово вопроса */}
          <div className="glass-panel" style={{ padding: '40px 20px', borderRadius: '24px', textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>
              Выберите верный перевод:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
              {displayMode === 'pinyin' ? (
                <span style={{ fontSize: '2.4rem', fontWeight: '700', color: 'var(--neon-cyan)' }}>
                  {currentCard.pinyin}
                </span>
              ) : (
                <span className="chinese-char" style={{ fontSize: '3rem' }}>
                  {currentCard.characters}
                </span>
              )}
              <AudioPlayer text={currentCard.characters} />
            </div>
          </div>

          {/* 4 варианта ответа */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelectOption(opt)}
                className="btn-neon btn-secondary"
                style={{
                  padding: '20px 16px',
                  borderRadius: '16px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.08)',
                  textAlign: 'center'
                }}
              >
                {opt.translation}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
