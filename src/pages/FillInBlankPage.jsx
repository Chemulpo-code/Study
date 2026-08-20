import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, X } from '../components/Icons';
import AudioPlayer from '../components/AudioPlayer';
import { API_BASE } from '../config';

const DEFAULT_FILL_DATA = [
  { fullChinese: "我在学习汉语。", blankChinese: "我在 ___ 汉语。", targetWord: "学习", targetPinyin: "xuéxí", options: ["学习", "吃", "看", "去"], translation: "Я учу китайский язык." },
  { fullChinese: "这个多少钱？", blankChinese: "这个 ___ 钱？", targetWord: "多少", targetPinyin: "duōshao", options: ["多少", "什么", "做", "是"], translation: "Сколько это стоит?" },
  { fullChinese: "今天天气很好。", blankChinese: "今天 ___ 很好。", targetWord: "天气", targetPinyin: "tiānqì", options: ["天气", "人", "钱", "名字"], translation: "Сегодня хорошая погода." },
  { fullChinese: "我很喜欢吃苹果。", blankChinese: "我很喜欢 ___ 苹果。", targetWord: "吃", targetPinyin: "chī", options: ["吃", "听", "去", "买"], translation: "Мне очень нравится есть яблоки." }
];

export default function FillInBlankPage({ token, displayMode, onBack }) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [selectedOpt, setSelectedOpt] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
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
        
        // Попытка сформировать вопросы из пользовательских карточек
        const generatedQs = [];
        mergedCards.forEach(c => {
          if (c.characters && c.translation && c.characters.length >= 2) {
            // Формируем синтетический контекстный вопрос
            const target = c.characters;
            const distractorPool = mergedCards.filter(other => other.id !== c.id).map(other => other.characters);
            if (distractorPool.length >= 3) {
              const shuffledDistractors = [...distractorPool].sort(() => Math.random() - 0.5).slice(0, 3);
              const opts = [...shuffledDistractors, target].sort(() => Math.random() - 0.5);
              
              generatedQs.push({
                fullChinese: `我是 ${target}。`,
                blankChinese: `我是 [ ___ ]。`,
                targetWord: target,
                targetPinyin: c.pinyin,
                options: opts,
                translation: c.translation
              });
            }
          }
        });

        const finalQuestions = generatedQs.length >= 3 ? generatedQs : DEFAULT_FILL_DATA;
        const shuffled = [...finalQuestions].sort(() => Math.random() - 0.5);
        setQuestions(shuffled);
      } catch (err) {
        console.error('Ошибка создания контекстных вопросов:', err);
        setQuestions(DEFAULT_FILL_DATA);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [token]);

  const handleSelectOption = (opt) => {
    if (isChecked) return;
    const current = questions[currentIndex];
    setSelectedOpt(opt);
    const correct = opt === current.targetWord;
    setIsCorrect(correct);
    setIsChecked(true);

    if (correct) {
      setScore(prev => prev + 1);
    }
  };

  const handleNext = () => {
    setIsChecked(false);
    setSelectedOpt(null);
    setIsCorrect(false);
    setCurrentIndex(prev => (prev + 1) % questions.length);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#fff' }}>
        <div className="loader" style={{ borderTopColor: 'var(--neon-cyan)' }} />
        <span style={{ marginLeft: '12px' }}>Загрузка контекстного тренажера...</span>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

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
            🕵️‍♂️ Контекстный пропуск
          </h2>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Верно: <span style={{ color: 'var(--neon-green)', fontWeight: '700' }}>{score}</span>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '40px 30px', borderRadius: '24px', textAlign: 'center' }}>
        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--neon-cyan)', letterSpacing: '1px', display: 'block', marginBottom: '16px' }}>
          🕵️‍♂️ Заполните пропущенное слово:
        </span>

        {/* Задание */}
        <div style={{
          fontSize: '2.2rem',
          fontFamily: 'Noto Sans SC, sans-serif',
          fontWeight: '600',
          color: '#fff',
          marginBottom: '16px',
          background: 'rgba(255,255,255,0.02)',
          padding: '24px',
          borderRadius: '20px',
          border: '1px solid rgba(255,255,255,0.05)'
        }}>
          {currentQ.blankChinese}
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '32px' }}>
          Перевод: <span style={{ color: '#fff', fontWeight: '500' }}>{currentQ.translation}</span>
        </p>

        {/* 4 Варианта выбора */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {currentQ.options.map((opt, idx) => {
            const isSelected = selectedOpt === opt;
            let btnClass = "btn-secondary";
            let border = "1px solid rgba(255,255,255,0.08)";

            if (isChecked) {
              if (opt === currentQ.targetWord) {
                btnClass = "btn-green";
                border = "2px solid var(--neon-green)";
              } else if (isSelected && !isCorrect) {
                btnClass = "btn-red";
                border = "2px solid var(--neon-red)";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(opt)}
                disabled={isChecked}
                className={`btn-neon ${btnClass}`}
                style={{
                  padding: '18px 16px',
                  borderRadius: '16px',
                  fontSize: '1.3rem',
                  fontFamily: 'Noto Sans SC, sans-serif',
                  fontWeight: '600',
                  border: border
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {/* Результат проверки */}
        {isChecked && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: isCorrect ? 'var(--neon-green)' : 'var(--neon-red)' }}>
                {isCorrect ? 'Верно! 🎉' : `Правильный ответ: ${currentQ.targetWord}`}
              </span>
              <AudioPlayer text={currentQ.fullChinese} />
            </div>
            <button
              onClick={handleNext}
              className="btn-neon btn-cyan"
              style={{ padding: '12px 36px', fontSize: '1rem', fontWeight: '600', borderRadius: '12px' }}
            >
              Следующий вопрос ➔
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
