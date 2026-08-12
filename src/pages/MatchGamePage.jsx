import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, RefreshCw } from '../components/Icons';
import { API_BASE } from '../config';

export default function MatchGamePage({ token, displayMode, onBack }) {
  const [loading, setLoading] = useState(true);
  const [allCards, setAllCards] = useState([]);
  const [gameItems, setGameItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null); // ID выбранного элемента
  const [mismatchIds, setMismatchIds] = useState([]); // пары ID с несовпадением
  const [isChecking, setIsChecking] = useState(false);
  
  const [timer, setTimer] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [bestTime, setBestTime] = useState(null);
  
  const timerIntervalRef = useRef(null);

  // Загружаем все карточки пользователя из всех его модулей
  useEffect(() => {
    const fetchAllCards = async () => {
      try {
        const response = await fetch('${API_BASE}/api/modules', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const modules = await response.json();
        if (!response.ok) throw new Error('Не удалось загрузить модули');
        
        // Для каждого модуля запрашиваем его карточки
        const allCardsPromises = modules.map(async (m) => {
          const res = await fetch(`${API_BASE}/api/modules/${m.id}/cards`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          return res.ok ? await res.json() : [];
        });
        
        const results = await Promise.all(allCardsPromises);
        const mergedCards = results.flat();
        setAllCards(mergedCards);
        
        // Загружаем лучшее время из localStorage
        const storedBest = localStorage.getItem('match_game_best_time');
        if (storedBest) {
          setBestTime(parseInt(storedBest, 10));
        }
      } catch (err) {
        console.error('Ошибка загрузки карточек для игры:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllCards();
  }, [token]);

  // Запуск игры
  const startNewGame = () => {
    if (allCards.length < 8) return;
    
    // Выбираем 8 случайных карточек
    const shuffledCards = [...allCards].sort(() => Math.random() - 0.5);
    const selected = shuffledCards.slice(0, 8);
    
    // Создаем 16 парных элементов
    const items = [];
    selected.forEach(c => {
      items.push({
        id: `${c.id}-zh`,
        cardId: c.id,
        text: displayMode === 'pinyin' ? c.pinyin : c.characters,
        type: 'zh',
        isMatched: false
      });
      items.push({
        id: `${c.id}-ru`,
        cardId: c.id,
        text: c.translation,
        type: 'ru',
        isMatched: false
      });
    });
    
    // Перемешиваем пары
    setGameItems(items.sort(() => Math.random() - 0.5));
    setSelectedId(null);
    setMismatchIds([]);
    setIsChecking(false);
    setTimer(0);
    setGameStarted(true);
    setGameCompleted(false);
    
    // Запуск таймера
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);
  };

  // Очистка таймера при размонтировании
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const handleCardClick = (item) => {
    if (isChecking || item.isMatched || item.id === selectedId) return;
    
    // Если первый выбор
    if (!selectedId) {
      setSelectedId(item.id);
      return;
    }
    
    const prevItem = gameItems.find(i => i.id === selectedId);
    
    // Проверка совпадения
    if (prevItem.cardId === item.cardId && prevItem.type !== item.type) {
      // СОВПАДЕНИЕ!
      setGameItems(prev => prev.map(i => {
        if (i.cardId === item.cardId) {
          return { ...i, isMatched: true };
        }
        return i;
      }));
      setSelectedId(null);
      
      // Проверяем окончание игры
      const checkWin = gameItems.every(i => {
        if (i.cardId === item.cardId) return true; // они уже совпали в стейте, но на рендере еще старые
        return i.isMatched;
      });
      
      if (checkWin) {
        clearInterval(timerIntervalRef.current);
        setGameCompleted(true);
        
        // Проверка рекорда времени
        if (!bestTime || timer < bestTime) {
          setBestTime(timer);
          localStorage.setItem('match_game_best_time', timer.toString());
        }
      }
    } else {
      // НЕ СОВПАДЕНИЕ
      setIsChecking(true);
      setMismatchIds([selectedId, item.id]);
      
      setTimeout(() => {
        setSelectedId(null);
        setMismatchIds([]);
        setIsChecking(false);
      }, 900);
    }
  };

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#fff' }}>
        <div className="loader" style={{ borderTopColor: 'var(--neon-cyan)' }} />
        <span style={{ marginLeft: '12px' }}>Загрузка игры...</span>
      </div>
    );
  }

  // Если у пользователя мало карточек
  if (allCards.length < 8) {
    return (
      <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px', textAlign: 'center' }}>
        <button onClick={onBack} className="btn-neon btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Назад на дашборд
        </button>
        <div className="glass-panel" style={{ padding: '40px 30px', borderRadius: '24px' }}>
          <h2 style={{ fontSize: '1.6rem', fontWeight: '700', marginBottom: '16px', color: 'var(--neon-red)' }}>
            ⚠️ Недостаточно карточек
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Для игры «Найди пару» требуется как минимум **8 карточек** во всех ваших учебных модулях вместе взятых.
            Сейчас у вас создано всего карточек: **{allCards.length}**.
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Создайте недостающие слова и возвращайтесь выбивать рекорды!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Шапка управления */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <button onClick={onBack} className="btn-neon btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> Назад
        </button>
        
        {gameStarted && (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.9rem', color: '#fff', border: '1px solid rgba(255,255,255,0.05)' }}>
              ⏱️ Время: <span style={{ color: 'var(--neon-cyan)', fontWeight: '700' }}>{formatTime(timer)}</span>
            </div>
            {bestTime && (
              <div className="glass-panel" style={{ padding: '8px 16px', borderRadius: '10px', fontSize: '0.9rem', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.05)' }}>
                🏆 Рекорд: <span style={{ color: 'var(--neon-green)', fontWeight: '700' }}>{formatTime(bestTime)}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {!gameStarted ? (
        // Экран старта
        <div className="glass-panel" style={{ padding: '50px 40px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(0, 242, 254, 0.2)', boxShadow: '0 0 30px rgba(0, 242, 254, 0.05)' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '20px' }}>🎮</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '16px', color: '#fff' }}>
            Игра «Найди пару» (Match Game)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto 32px auto' }}>
            На поле будут разложены 8 китайских иероглифов и 8 соответствующих им переводов на русский язык.
            Ваша задача — как можно быстрее сопоставить пары. Готовы проверить зрительную память?
          </p>
          <button onClick={startNewGame} className="btn-neon btn-cyan" style={{ padding: '14px 40px', fontSize: '1.1rem', fontWeight: '700' }}>
            Начать игру
          </button>
        </div>
      ) : gameCompleted ? (
        // Экран победы
        <div className="glass-panel" style={{ padding: '50px 40px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(0, 255, 136, 0.3)', boxShadow: '0 0 30px rgba(0, 255, 136, 0.1)' }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '20px' }}>🎉</span>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '16px', color: 'var(--neon-green)' }}>
            Отличный результат!
          </h2>
          <p style={{ color: '#fff', fontSize: '1.15rem', marginBottom: '10px' }}>
            Вы нашли все пары за время: <span style={{ color: 'var(--neon-cyan)', fontWeight: '700' }}>{formatTime(timer)}</span>
          </p>
          {bestTime === timer && (
            <p style={{ color: 'var(--neon-green)', fontWeight: '600', fontSize: '0.95rem', marginBottom: '32px' }}>
              🔥 Это ваш НОВЫЙ рекорд! Поздравляем!
            </p>
          )}
          {! (bestTime === timer) && bestTime && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '32px' }}>
              Ваш рекорд: {formatTime(bestTime)}
            </p>
          )}
          <button onClick={startNewGame} className="btn-neon btn-cyan" style={{ padding: '14px 40px', fontSize: '1.1rem', fontWeight: '700' }}>
            Играть снова
          </button>
        </div>
      ) : (
        // Игровое поле
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', maxWidth: '640px', margin: '0 auto' }}>
          {gameItems.map((item) => {
            const isSelected = selectedId === item.id;
            const isMismatched = mismatchIds.includes(item.id);
            const isMatched = item.isMatched;

            let border = '1px solid rgba(255,255,255,0.06)';
            let bg = 'rgba(255, 255, 255, 0.02)';
            let color = '#fff';
            let shadow = 'none';

            if (isSelected) {
              border = item.type === 'zh' ? '1px solid var(--neon-cyan)' : '1px solid var(--neon-violet)';
              bg = item.type === 'zh' ? 'rgba(0, 242, 254, 0.15)' : 'rgba(185, 0, 254, 0.15)';
              shadow = item.type === 'zh' ? 'var(--glow-cyan)' : 'var(--glow-violet)';
            } else if (isMismatched) {
              border = '1px solid var(--neon-red)';
              bg = 'rgba(255, 51, 102, 0.15)';
              shadow = '0 0 10px rgba(255, 51, 102, 0.3)';
            } else if (isMatched) {
              border = '1px solid transparent';
              bg = 'rgba(255, 255, 255, 0.005)';
              color = 'rgba(255, 255, 255, 0.05)';
            }

            return (
              <button
                key={item.id}
                onClick={() => handleCardClick(item)}
                disabled={isMatched}
                className="glass-panel"
                style={{
                  height: '110px',
                  borderRadius: '16px',
                  border: border,
                  background: bg,
                  boxShadow: shadow,
                  color: color,
                  cursor: isMatched ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '8px',
                  textAlign: 'center',
                  fontSize: item.type === 'zh' ? '1.4rem' : '0.9rem',
                  fontFamily: item.type === 'zh' ? 'Noto Sans SC, sans-serif' : 'inherit',
                  fontWeight: item.type === 'zh' ? '600' : '500',
                  opacity: isMatched ? 0.05 : 1,
                  transform: isSelected || isMismatched ? 'scale(1.02)' : 'scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                {item.text}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
