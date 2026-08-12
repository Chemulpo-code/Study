import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw } from './Icons';

export default function WritingTrainer({ word }) {
  const canvasRef = useRef(null);
  const hanziContainerRef = useRef(null);
  const writerRef = useRef(null);
  const feedbackTimerRef = useRef(null);

  const [selectedChar, setSelectedChar] = useState('');
  const [mode, setMode] = useState('check'); // 'check' (проверка порядка черт) | 'free' (свободная пропись)
  const [showOutline, setShowOutline] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#00f2fe');
  const [quizStatus, setQuizStatus] = useState('ready'); // 'ready' | 'correct' | 'mistake' | 'success'
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  // Фильтруем только иероглифы (убираем знаки препинания и пробелы)
  const characters = word ? word.split('').filter(char => /\p{Script=Han}/u.test(char)) : [];

  useEffect(() => {
    if (characters.length > 0) {
      setSelectedChar(characters[0]);
    } else {
      setSelectedChar('');
    }
  }, [word]);

  // Загружаем внешнюю библиотеку HanziWriter для анимации и проверки порядка черт
  useEffect(() => {
    if (window.HanziWriter) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hanzi-writer@3.5/dist/hanzi-writer.min.js';
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    document.head.appendChild(script);
  }, []);

  // Инициализация HanziWriter для режима проверки порядка черт
  useEffect(() => {
    if (mode !== 'check' || !selectedChar || !isScriptLoaded || !hanziContainerRef.current) return;

    if (hanziContainerRef.current) {
      hanziContainerRef.current.innerHTML = '';
    }

    try {
      const writer = window.HanziWriter.create(hanziContainerRef.current, selectedChar, {
        width: 240,
        height: 240,
        padding: 15,
        strokeColor: '#00f2fe',
        outlineColor: 'rgba(255, 255, 255, 0.12)',
        drawingColor: '#00ff88',
        showOutline: showOutline,
        showHintAfterMisses: 2,
        highlightOnComplete: true,
        strokeAnimationSpeed: 1.2,
        delayBetweenStrokes: 150
      });

      writerRef.current = writer;
      startQuiz(writer);
    } catch (err) {
      console.error('Ошибка инициализации HanziWriter:', err);
    }
  }, [selectedChar, mode, isScriptLoaded, showOutline]);

  const startQuiz = (writer = writerRef.current) => {
    if (!writer) return;
    setQuizStatus('ready');
    writer.quiz({
      onCorrectStroke: () => {
        setQuizStatus('correct');
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => {
          setQuizStatus('ready');
        }, 1000);
      },
      onMistake: () => {
        setQuizStatus('mistake');
        if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
        feedbackTimerRef.current = setTimeout(() => {
          setQuizStatus('ready');
        }, 1200);
      },
      onComplete: () => {
        setQuizStatus('success');
      }
    });
  };

  const handleAnimate = () => {
    if (writerRef.current) {
      writerRef.current.animateCharacter({
        onComplete: () => startQuiz()
      });
    }
  };

  const handleHint = () => {
    if (writerRef.current) {
      writerRef.current.showHint();
    }
  };

  // --- Код для свободного режима рисования (Canvas) ---
  useEffect(() => {
    if (mode === 'free') {
      drawInit();
    }
  }, [selectedChar, showOutline, mode]);

  const drawInit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Сетка Тяньцзигэ (田字格)
    ctx.strokeStyle = 'rgba(255, 51, 102, 0.2)';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(5, canvas.height / 2);
    ctx.lineTo(canvas.width - 5, canvas.height / 2);
    ctx.moveTo(canvas.width / 2, 5);
    ctx.lineTo(canvas.width / 2, canvas.height - 5);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 51, 102, 0.08)';
    ctx.beginPath();
    ctx.moveTo(5, 5);
    ctx.lineTo(canvas.width - 5, canvas.height - 5);
    ctx.moveTo(canvas.width - 5, 5);
    ctx.lineTo(5, canvas.height - 5);
    ctx.stroke();
    ctx.setLineDash([]);

    if (showOutline && selectedChar) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
      ctx.font = '160px "Noto Sans SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(selectedChar, canvas.width / 2, canvas.height / 2 + 10);
    }
  };

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = strokeColor;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => setIsDrawing(false);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  if (characters.length === 0) {
    return (
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '10px', textAlign: 'center' }}>
        В этой карточке нет китайских иероглифов для написания.
      </div>
    );
  }

  // Расчет динамической подсветки контейнера
  const getContainerBorderStyle = () => {
    if (quizStatus === 'mistake') return '2px solid var(--neon-red)';
    if (quizStatus === 'correct' || quizStatus === 'success') return '2px solid var(--neon-green)';
    return '1px solid rgba(255,255,255,0.1)';
  };

  const getContainerGlowStyle = () => {
    if (quizStatus === 'mistake') return '0 0 25px rgba(255, 51, 102, 0.8), inset 0 0 15px rgba(255, 51, 102, 0.15)';
    if (quizStatus === 'correct') return '0 0 25px rgba(0, 255, 136, 0.8), inset 0 0 15px rgba(0, 255, 136, 0.15)';
    if (quizStatus === 'success') return '0 0 35px rgba(0, 255, 136, 0.9), inset 0 0 20px rgba(0, 255, 136, 0.2)';
    return 'none';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Выбор режима тренажера */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => setMode('check')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            background: mode === 'check' ? 'var(--neon-cyan)' : 'transparent',
            color: mode === 'check' ? '#000' : 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
        >
          🎯 Проверка черт
        </button>

        <button
          onClick={() => setMode('free')}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            fontWeight: '600',
            border: 'none',
            cursor: 'pointer',
            background: mode === 'free' ? 'var(--neon-cyan)' : 'transparent',
            color: mode === 'free' ? '#000' : 'var(--text-secondary)',
            transition: 'all 0.2s ease'
          }}
        >
          🖌️ Свободная пропись
        </button>
      </div>

      {/* Выбор иероглифа если в слове больше одного знака */}
      {characters.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {characters.map((char, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedChar(char)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                border: selectedChar === char ? '2px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.1)',
                background: selectedChar === char ? 'rgba(0,242,254,0.15)' : 'rgba(255,255,255,0.02)',
                color: selectedChar === char ? '#fff' : 'var(--text-secondary)',
                fontSize: '1.1rem',
                fontFamily: 'Noto Sans SC',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
            >
              {char}
            </button>
          ))}
        </div>
      )}

      {/* 🎯 РЕЖИМ 1: ПРОВЕРКА ПОРЯДКА ЧЕРТ (HanziWriter) */}
      {mode === 'check' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{
            position: 'relative',
            width: '240px',
            height: '240px',
            background: '#0d131f',
            borderRadius: '12px',
            overflow: 'hidden',
            border: getContainerBorderStyle(),
            boxShadow: getContainerGlowStyle(),
            animation: quizStatus === 'mistake' ? 'shake 0.3s cubic-bezier(.36,.07,.19,.97) both' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {/* Сетка Тяньцзигэ на фоне */}
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <rect x="5" y="5" width="230" height="230" fill="none" stroke="rgba(255, 51, 102, 0.2)" strokeWidth="1" />
              <line x1="5" y1="120" x2="235" y2="120" stroke="rgba(255, 51, 102, 0.2)" strokeDasharray="4 4" />
              <line x1="120" y1="5" x2="120" y2="235" stroke="rgba(255, 51, 102, 0.2)" strokeDasharray="4 4" />
              <line x1="5" y1="5" x2="235" y2="235" stroke="rgba(255, 51, 102, 0.08)" strokeDasharray="4 4" />
              <line x1="235" y1="5" x2="5" y2="235" stroke="rgba(255, 51, 102, 0.08)" strokeDasharray="4 4" />
            </svg>

            {/* Контейнер для врисовки векторного иероглифа HanziWriter */}
            <div ref={hanziContainerRef} style={{ width: '240px', height: '240px', touchAction: 'none' }} />
          </div>

          {/* Яркая плашка статуса проверки с цветной подсветкой */}
          <div style={{ minHeight: '36px', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {quizStatus === 'correct' && (
              <div style={{ background: 'rgba(0, 255, 136, 0.15)', border: '1px solid rgba(0, 255, 136, 0.4)', color: '#00ff88', padding: '5px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700', boxShadow: '0 0 12px rgba(0, 255, 136, 0.2)' }}>
                ✅ Верная черта!
              </div>
            )}
            {quizStatus === 'mistake' && (
              <div style={{ background: 'rgba(255, 51, 102, 0.15)', border: '1px solid rgba(255, 51, 102, 0.4)', color: '#ff3366', padding: '5px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700', boxShadow: '0 0 12px rgba(255, 51, 102, 0.2)' }}>
                ❌ Неверный порядок или направление!
              </div>
            )}
            {quizStatus === 'success' && (
              <div style={{ background: 'rgba(0, 255, 136, 0.2)', border: '1px solid #00ff88', color: '#00ff88', padding: '5px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: '700', boxShadow: '0 0 15px rgba(0, 255, 136, 0.3)' }}>
                🎉 Иероглиф полностью и правильно написан!
              </div>
            )}
            {quizStatus === 'ready' && (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                Обведите черту пальцем или мышкой по порядку
              </div>
            )}
          </div>

          {/* Панель инструментов проверки */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px', width: '240px' }}>
            <button
              onClick={handleAnimate}
              className="btn-neon btn-secondary"
              style={{ flex: 1, padding: '6px 0', fontSize: '0.78rem', borderRadius: '8px' }}
              title="Показать порядок черт в движении"
            >
              ▶️ Анимация
            </button>

            <button
              onClick={handleHint}
              className="btn-neon btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.78rem', borderRadius: '8px' }}
              title="Показать следующую черту"
            >
              💡 Подсказка
            </button>

            <button
              onClick={() => startQuiz()}
              className="btn-neon btn-secondary"
              style={{ width: '36px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', padding: 0 }}
              title="Заново"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 🖌️ РЕЖИМ 2: СВОБОДНАЯ ПРОПИСЬ (Canvas) */}
      {mode === 'free' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div style={{ position: 'relative', width: '240px', height: '240px', background: '#0d131f', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
            <canvas
              ref={canvasRef}
              width={240}
              height={240}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              style={{ cursor: 'crosshair', display: 'block', touchAction: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', width: '240px', marginTop: '10px', gap: '8px' }}>
            <button
              onClick={() => setShowOutline(!showOutline)}
              className="btn-neon btn-secondary"
              style={{ flex: 1, padding: '6px 0', fontSize: '0.75rem', borderRadius: '8px' }}
            >
              {showOutline ? 'Скрыть контур' : 'Показать контур'}
            </button>

            <button
              onClick={drawInit}
              className="btn-neon btn-secondary"
              style={{ width: '36px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', padding: 0 }}
              title="Очистить холст"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px', justifyContent: 'center' }}>
            {['#00f2fe', '#00ff88', '#9d4ede', '#ff3366'].map(color => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  background: color,
                  border: strokeColor === color ? '2px solid #fff' : 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
