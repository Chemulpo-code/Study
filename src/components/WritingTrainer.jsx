import React, { useRef, useState, useEffect } from 'react';
import { RefreshCw } from './Icons';

export default function WritingTrainer({ word }) {
  const canvasRef = useRef(null);
  const [selectedChar, setSelectedChar] = useState('');
  const [showOutline, setShowOutline] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#00f2fe');

  // Фильтруем только иероглифы (убираем знаки препинания и пробелы)
  const characters = word ? word.split('').filter(char => /\p{Script=Han}/u.test(char)) : [];

  useEffect(() => {
    if (characters.length > 0) {
      setSelectedChar(characters[0]);
    } else {
      setSelectedChar('');
    }
  }, [word]);

  useEffect(() => {
    drawInit();
  }, [selectedChar, showOutline]);

  const drawInit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Рисуем сетку Тяньцзигэ (田字格)
    ctx.strokeStyle = 'rgba(255, 51, 102, 0.2)'; // Красная традиционная разметка
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

    ctx.setLineDash([4, 4]);
    // Горизонтальный пунктир
    ctx.beginPath();
    ctx.moveTo(5, canvas.height / 2);
    ctx.lineTo(canvas.width - 5, canvas.height / 2);
    ctx.stroke();

    // Вертикальный пунктир
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 5);
    ctx.lineTo(canvas.width / 2, canvas.height - 5);
    ctx.stroke();

    // Диагональный пунктир
    ctx.strokeStyle = 'rgba(255, 51, 102, 0.08)';
    ctx.beginPath();
    ctx.moveTo(5, 5);
    ctx.lineTo(canvas.width - 5, canvas.height - 5);
    ctx.moveTo(canvas.width - 5, 5);
    ctx.lineTo(5, canvas.height - 5);
    ctx.stroke();
    
    ctx.setLineDash([]); // сброс пунктира

    // 2. Рисуем фоновую подсказку
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
    
    // Рисуем маленькую точку при клике
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    // Предотвращаем скроллинг страницы на мобилках при рисовании
    if (e.cancelable) e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const getPos = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Touch event
    if (e.touches && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    // Mouse event
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  if (characters.length === 0) {
    return (
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '10px', textAlign: 'center' }}>
        В этой карточке нет китайских иероглифов для написания.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Выбор символа */}
      {characters.length > 1 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {characters.map((char, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedChar(char)}
              style={{
                width: '36px',
                height: '36px',
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

      {/* Холст и сетка */}
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

      {/* Инструменты */}
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '240px', marginTop: '12px', gap: '8px' }}>
        <button
          onClick={() => {
            setShowOutline(!showOutline);
          }}
          className="btn-neon btn-secondary"
          style={{ flex: 1, padding: '6px 0', fontSize: '0.75rem', borderRadius: '8px' }}
        >
          {showOutline ? 'Скрыть контур' : 'Показать контур'}
        </button>

        <button
          onClick={drawInit}
          className="btn-neon btn-secondary"
          style={{ width: '40px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', padding: 0 }}
          title="Очистить"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Палитра цветов */}
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
  );
}
