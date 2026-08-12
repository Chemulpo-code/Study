import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, RefreshCw } from '../components/Icons';
import AudioPlayer from '../components/AudioPlayer';
import { API_BASE } from '../config';

// Фолбек-банк базовых грамматических фраз
const DEFAULT_SENTENCES = [
  { chinese: "你在做什么？", pinyin: "nǐ zài zuò shénme?", translation: "Что ты делаешь?" },
  { chinese: "我是俄罗斯人。", pinyin: "wǒ shì éluósī rén.", translation: "Я из России (русский)." },
  { chinese: "我在学习汉语。", pinyin: "wǒ zài xuéxí hànyǔ.", translation: "Я учу китайский язык." },
  { chinese: "这个多少钱？", pinyin: "zhège duōshao qián?", translation: "Сколько это стоит?" },
  { chinese: "很高兴认识你。", pinyin: "hěn gāoxìng rènshi nǐ.", translation: "Очень рад познакомиться с тобой." },
  { chinese: "今天天气非常好。", pinyin: "jīntiān tiānqì fēicháng hǎo.", translation: "Сегодня очень хорошая погода." }
];

export default function SentenceBuilderPage({ token, displayMode, onBack }) {
  const [loading, setLoading] = useState(true);
  const [sentences, setSentences] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [poolBlocks, setPoolBlocks] = useState([]); // доступные для клика фишки
  const [builtBlocks, setBuiltBlocks] = useState([]); // собранные фишки
  
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchSentences = async () => {
      try {
        const resModules = await fetch(`${API_BASE}/api/modules`, {
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
        const mergedCards = results.flat();
        
        // Собираем все примеры из карточек
        const userExamples = [];
        mergedCards.forEach(c => {
          if (c.examples && c.examples.length > 0) {
            c.examples.forEach(ex => {
              if (ex.chinese && ex.translation) {
                userExamples.push(ex);
              }
            });
          }
        });

        // Объединяем пользовательские примеры с дефолтными
        const allSentences = userExamples.length >= 3 ? userExamples : [...userExamples, ...DEFAULT_SENTENCES];
        // Перемешиваем список предложений
        const shuffled = [...allSentences].sort(() => Math.random() - 0.5);
        setSentences(shuffled);
        if (shuffled.length > 0) {
          loadSentence(shuffled[0]);
        }
      } catch (err) {
        console.error('Ошибка загрузки предложений:', err);
        setSentences(DEFAULT_SENTENCES);
        loadSentence(DEFAULT_SENTENCES[0]);
      } finally {
        setLoading(false);
      }
    };

    fetchSentences();
  }, [token]);

  const loadSentence = (sentenceObj) => {
    setIsChecked(false);
    setIsCorrect(false);
    setBuiltBlocks([]);

    // Разбиваем китайское предложение на отдельный массив знаков (символов)
    const rawChars = sentenceObj.chinese.split('');
    const blocks = rawChars.map((char, index) => ({
      id: `${char}-${index}-${Math.random()}`,
      char
    }));

    // Перемешиваем блоки в пуле
    const shuffledBlocks = [...blocks].sort(() => Math.random() - 0.5);
    setPoolBlocks(shuffledBlocks);
  };

  const handleBlockClickFromPool = (block) => {
    if (isChecked) return;
    setPoolBlocks(prev => prev.filter(b => b.id !== block.id));
    setBuiltBlocks(prev => [...prev, block]);
  };

  const handleBlockClickFromBuilt = (block) => {
    if (isChecked) return;
    setBuiltBlocks(prev => prev.filter(b => b.id !== block.id));
    setPoolBlocks(prev => [...prev, block]);
  };

  const handleCheck = () => {
    const current = sentences[currentIndex];
    const userString = builtBlocks.map(b => b.char).join('');
    const correctString = current.chinese;

    const correct = userString === correctString;
    setIsCorrect(correct);
    setIsChecked(true);

    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    const nextIdx = (currentIndex + 1) % sentences.length;
    setCurrentIndex(nextIdx);
    loadSentence(sentences[nextIdx]);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#fff' }}>
        <div className="loader" style={{ borderTopColor: 'var(--neon-cyan)' }} />
        <span style={{ marginLeft: '12px' }}>Загрузка конструктора предложений...</span>
      </div>
    );
  }

  const currentSentence = sentences[currentIndex];

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Шапка */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <button onClick={onBack} className="btn-neon btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          <ArrowLeft size={16} /> В меню
        </button>
        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Собрано верно: <span style={{ color: 'var(--neon-green)', fontWeight: '700' }}>{score}</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '36px 30px', borderRadius: '24px' }}>
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--neon-cyan)', letterSpacing: '1px', display: 'block', marginBottom: '12px' }}>
          Соберите предложение по смыслу:
        </span>
        
        {/* Перевод на русский */}
        <h3 style={{ fontSize: '1.4rem', fontWeight: '600', color: '#fff', marginBottom: '24px', lineHeight: '1.4' }}>
          {currentSentence.translation}
        </h3>

        {/* Линия сборки предложения */}
        <div style={{
          minHeight: '80px',
          background: 'rgba(0, 0, 0, 0.3)',
          border: isChecked 
            ? (isCorrect ? '2px solid var(--neon-green)' : '2px solid var(--neon-red)') 
            : '2px dashed rgba(255, 255, 255, 0.15)',
          borderRadius: '16px',
          padding: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'center',
          marginBottom: '32px',
          boxShadow: isChecked && isCorrect ? 'var(--glow-green)' : (isChecked ? '0 0 12px rgba(255,51,102,0.3)' : 'none'),
          transition: 'all 0.3s ease'
        }}>
          {builtBlocks.length === 0 ? (
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontStyle: 'italic' }}>
              Кликайте по фишкам ниже, чтобы собрать предложение...
            </span>
          ) : (
            builtBlocks.map(block => (
              <button
                key={block.id}
                onClick={() => handleBlockClickFromBuilt(block)}
                className="btn-neon btn-cyan"
                style={{
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontSize: '1.3rem',
                  fontFamily: 'Noto Sans SC, sans-serif',
                  fontWeight: '600'
                }}
              >
                {block.char}
              </button>
            ))
          )}
        </div>

        {/* Пул доступных фишек */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '32px', minHeight: '60px' }}>
          {poolBlocks.map(block => (
            <button
              key={block.id}
              onClick={() => handleBlockClickFromPool(block)}
              className="btn-neon btn-secondary"
              style={{
                padding: '12px 18px',
                borderRadius: '12px',
                fontSize: '1.3rem',
                fontFamily: 'Noto Sans SC, sans-serif',
                fontWeight: '600',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              {block.char}
            </button>
          ))}
        </div>

        {/* Блок результата после проверки */}
        {isChecked && (
          <div style={{ marginBottom: '24px', padding: '16px 20px', borderRadius: '16px', background: isCorrect ? 'rgba(0,255,136,0.1)' : 'rgba(255,51,102,0.1)', border: isCorrect ? '1px solid rgba(0,255,136,0.3)' : '1px solid rgba(255,51,102,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '1rem', fontWeight: '700', color: isCorrect ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                {isCorrect ? 'Правильно! 🎉' : 'Ошибка, попробуйте еще раз!'}
              </span>
              <AudioPlayer text={currentSentence.chinese} />
            </div>
            <div style={{ fontSize: '1.2rem', fontFamily: 'Noto Sans SC', color: '#fff', marginBottom: '4px' }}>
              {currentSentence.chinese}
            </div>
            <div style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem' }}>
              {currentSentence.pinyin}
            </div>
          </div>
        )}

        {/* Кнопка управления */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {!isChecked ? (
            <button
              onClick={handleCheck}
              disabled={builtBlocks.length === 0}
              className="btn-neon btn-cyan"
              style={{ padding: '14px 40px', fontSize: '1rem', fontWeight: '700', width: '100%', maxWidth: '300px' }}
            >
              Проверить
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="btn-neon btn-green"
              style={{ padding: '14px 40px', fontSize: '1rem', fontWeight: '700', width: '100%', maxWidth: '300px' }}
            >
              Следующее предложение ➔
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
