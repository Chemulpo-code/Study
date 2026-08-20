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

  const [modulesList, setModulesList] = useState([]);
  const [selectedModuleIds, setSelectedModuleIds] = useState([]);

  // Загружаем все карточки пользователя из всех его модулей
  useEffect(() => {
    const fetchAllCards = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/modules`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const modules = await response.json();
        if (!response.ok) throw new Error('Не удалось загрузить модули');
        
        const validModules = Array.isArray(modules) ? modules : [];
        
        // Для каждого модуля запрашиваем его карточки
        const moduleCardPairs = await Promise.all(validModules.map(async (m) => {
          const res = await fetch(`${API_BASE}/api/modules/${m.id}/cards`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const cardsData = res.ok ? await res.json() : [];
          const cardsWithModule = (Array.isArray(cardsData) ? cardsData : []).map(c => ({ ...c, moduleId: m.id }));
          return { module: m, cards: cardsWithModule };
        }));
        
        const mods = moduleCardPairs.map(p => ({ id: p.module.id, title: p.module.title, count: p.cards.length }));
        setModulesList(mods);

        const mergedCards = moduleCardPairs.flatMap(p => p.cards);
        setAllCards(mergedCards);

        // Загружаем выбранные модули из localStorage или выбираем все по умолчанию
        const savedSelected = localStorage.getItem('match_game_selected_modules');
        if (savedSelected) {
          try {
            const parsed = JSON.parse(savedSelected);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setSelectedModuleIds(parsed);
            } else {
              setSelectedModuleIds(mods.map(m => m.id));
            }
          } catch {
            setSelectedModuleIds(mods.map(m => m.id));
          }
        } else {
          setSelectedModuleIds(mods.map(m => m.id));
        }
        
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

  const handleToggleModule = (id) => {
    setSelectedModuleIds(prev => {
      const next = prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id];
      localStorage.setItem('match_game_selected_modules', JSON.stringify(next));
      return next;
    });
  };

  const handleSelectAllModules = () => {
    const allIds = modulesList.map(m => m.id);
    setSelectedModuleIds(allIds);
    localStorage.setItem('match_game_selected_modules', JSON.stringify(allIds));
  };

  const handleDeselectAllModules = () => {
    setSelectedModuleIds([]);
    localStorage.setItem('match_game_selected_modules', JSON.stringify([]));
  };

  // Запуск игры
  const startNewGame = () => {
    const playableCards = allCards.filter(c => selectedModuleIds.includes(c.moduleId));
    if (playableCards.length < 8) return;
    
    // Выбираем 8 случайных карточек из выбранных модулей
    const shuffledCards = [...playableCards].sort(() => Math.random() - 0.5);
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
        <button onClick={onBack} className="btn-neon btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '6px', borderRadius: '10px', marginBottom: '32px' }}>
          <ArrowLeft size={16} /> Назад
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
            🎮 Игра «Найди пару»
          </h2>
        </div>
        
        {gameStarted ? (
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="glass-panel" style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.85rem', color: '#fff', border: '1px solid rgba(255,255,255,0.08)' }}>
              ⏱️ Время: <span style={{ color: 'var(--neon-cyan)', fontWeight: '700' }}>{formatTime(timer)}</span>
            </div>
            {bestTime && (
              <div className="glass-panel" style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}>
                🏆 Рекорд: <span style={{ color: 'var(--neon-green)', fontWeight: '700' }}>{formatTime(bestTime)}</span>
              </div>
            )}
          </div>
        ) : (
          bestTime && (
            <div className="glass-panel" style={{ padding: '6px 14px', borderRadius: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', border: '1px solid rgba(255,255,255,0.08)' }}>
              🏆 Рекорд: <span style={{ color: 'var(--neon-green)', fontWeight: '700' }}>{formatTime(bestTime)}</span>
            </div>
          )
        )}
      </div>

      {!gameStarted ? (
        // Экран старта
        <div className="glass-panel" style={{ padding: '40px 30px', borderRadius: '24px', textAlign: 'center', border: '1px solid rgba(0, 242, 254, 0.2)', boxShadow: '0 0 30px rgba(0, 242, 254, 0.05)' }}>
          <span style={{ fontSize: '3.5rem', display: 'block', marginBottom: '16px' }}>🎮</span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', marginBottom: '12px', color: '#fff' }}>
            Игра «Найди пару» (Match Game)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.5', maxWidth: '540px', margin: '0 auto 24px auto' }}>
            Сопоставьте 8 китайских иероглифов с их переводами на скорость. Выберите модули, из которых будут формироваться слова:
          </p>

          {/* Блок выбора модулей */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '18px',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontWeight: '600', color: '#fff', fontSize: '0.95rem' }}>
                📚 Выберите модули ({selectedModuleIds.length} из {modulesList.length})
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={handleSelectAllModules}
                  style={{
                    background: 'rgba(0, 242, 254, 0.1)',
                    border: '1px solid rgba(0, 242, 254, 0.3)',
                    color: 'var(--neon-cyan)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  ✓ Выбрать все
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllModules}
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: 'var(--text-secondary)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    cursor: 'pointer'
                  }}
                >
                  Снять все
                </button>
              </div>
            </div>

            {/* Сетка модулей с чекбоксами */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '10px',
              maxHeight: '220px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {modulesList.map(mod => {
                const isSelected = selectedModuleIds.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => handleToggleModule(mod.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? 'rgba(0, 242, 254, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ cursor: 'pointer', accentColor: 'var(--neon-cyan)' }}
                    />
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: isSelected ? '600' : '400', color: isSelected ? '#fff' : 'var(--text-secondary)' }}>
                        {mod.title}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--neon-cyan)' : 'rgba(255, 255, 255, 0.4)' }}>
                        {mod.count} слов
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Проверка минимального количества слов */}
          {(() => {
            const playableCards = allCards.filter(c => selectedModuleIds.includes(c.moduleId));
            const isValid = playableCards.length >= 8;

            return (
              <div>
                <div style={{ marginBottom: '16px', fontSize: '0.85rem', color: isValid ? 'var(--neon-green)' : '#ff668c' }}>
                  {isValid
                    ? `Всего слов в выбранных модулях: ${playableCards.length}`
                    : `⚠️ Выбрано мало слов (${playableCards.length} из 8 необходимых). Отметьте еще модули!`}
                </div>

                <button
                  onClick={startNewGame}
                  disabled={!isValid}
                  className="btn-neon btn-cyan"
                  style={{
                    padding: '14px 40px',
                    fontSize: '1.1rem',
                    fontWeight: '700',
                    opacity: isValid ? 1 : 0.4,
                    cursor: isValid ? 'pointer' : 'not-allowed'
                  }}
                >
                  Начать игру
                </button>
              </div>
            );
          })()}
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
