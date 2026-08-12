import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit, Trash, RefreshCw } from '../components/Icons';
import { API_BASE } from '../config';

export default function ManageCardsPage({ token, moduleId, onBackToDashboard }) {
  const [module, setModule] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Состояния для формы (добавление / редактирование карточки)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [characters, setCharacters] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [translation, setTranslation] = useState('');
  
  // Дополнительные поля для одного примера предложения
  const [exampleChinese, setExampleChinese] = useState('');
  const [examplePinyin, setExamplePinyin] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  
  const [formLoading, setFormLoading] = useState(false);

  // Загрузка модуля и его карточек
  const loadData = async () => {
    try {
      // 1. Получаем модули для поиска нужного названия
      const moduleRes = await fetch(`${API_BASE}/api/modules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const modules = await moduleRes.json();
      const currentModule = modules.find(m => m.id === moduleId);
      setModule(currentModule);

      // 2. Получаем карточки модуля
      const cardsRes = await fetch(`${API_BASE}/api/modules/${moduleId}/cards`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cardsData = await cardsRes.json();
      setCards(cardsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [moduleId]);

  const handleOpenCreateForm = () => {
    setEditingCardId(null);
    setCharacters('');
    setPinyin('');
    setTranslation('');
    setExampleChinese('');
    setExamplePinyin('');
    setExampleTranslation('');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (card) => {
    setEditingCardId(card.id);
    setCharacters(card.characters);
    setPinyin(card.pinyin);
    setTranslation(card.translation);
    
    if (card.examples && card.examples.length > 0) {
      setExampleChinese(card.examples[0].chinese || '');
      setExamplePinyin(card.examples[0].pinyin || '');
      setExampleTranslation(card.examples[0].translation || '');
    } else {
      setExampleChinese('');
      setExamplePinyin('');
      setExampleTranslation('');
    }
    
    setIsFormOpen(true);
  };

  const handleSaveCard = async (e) => {
    e.preventDefault();
    if (!characters.trim() || !translation.trim()) return;

    setFormLoading(true);
    
    // Формируем массив примеров, если заполнены поля
    const examples = [];
    if (exampleChinese.trim()) {
      examples.push({
        chinese: exampleChinese.trim(),
        pinyin: examplePinyin.trim(),
        translation: exampleTranslation.trim()
      });
    }

    const endpoint = editingCardId ? `/api/cards/${editingCardId}` : `/api/modules/${moduleId}/cards`;
    const method = editingCardId ? 'PUT' : 'POST';

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ characters, pinyin, translation, examples })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при сохранении карточки');

      setIsFormOpen(false);
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCard = async (id, word) => {
    if (!window.confirm(`Удалить карточку "${word}"?`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/cards/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при удалении');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Фильтрация карточек по поисковому запросу
  const filteredCards = cards.filter(card => 
    card.characters.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    card.translation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка слов...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Шапка страницы */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '32px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            onClick={onBackToDashboard}
            className="btn-neon btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} /> Назад
          </button>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '600' }}>
              Модуль: <span style={{ color: 'var(--neon-cyan)' }}>{module?.title}</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Управление словами и предложениями</p>
          </div>
        </div>

        <button 
          onClick={handleOpenCreateForm}
          className="btn-neon btn-cyan"
          style={{ padding: '10px 20px', fontSize: '0.9rem' }}
        >
          <Plus size={18} /> Добавить слово / фразу
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(255, 51, 102, 0.1)',
          border: '1px solid rgba(255, 51, 102, 0.3)',
          color: '#ff668c',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {/* Панель поиска */}
      <div style={{ marginBottom: '24px' }}>
        <input 
          type="text" 
          placeholder="Поиск по иероглифам, пиньиню или переводу..."
          className="input-glass"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Список слов в виде таблицы */}
      {filteredCards.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {searchQuery ? 'Ничего не найдено по вашему запросу.' : 'В этом модуле пока нет слов. Нажмите кнопку «Добавить слово», чтобы создать карточку.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredCards.map(card => (
            <div key={card.id} className="glass-panel" style={{
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              {/* Левый блок: Иероглифы и пиньинь */}
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1, minWidth: '250px' }}>
                <div className="chinese-char-sm" style={{ 
                  fontSize: '1.8rem', 
                  color: '#fff', 
                  minWidth: '90px'
                }}>
                  {card.characters}
                </div>
                <div>
                  <div style={{ color: 'var(--neon-cyan)', fontWeight: '600', fontSize: '0.95rem' }}>{card.pinyin}</div>
                  <div style={{ fontSize: '1rem', color: '#fff', marginTop: '2px' }}>{card.translation}</div>
                </div>
              </div>

              {/* Средний блок: Примеры (если есть) */}
              <div style={{ flex: 1.5, minWidth: '280px' }}>
                {card.examples && card.examples.length > 0 ? (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    padding: '8px 12px', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.04)' 
                  }}>
                    <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '2px' }}>
                      Пример:
                    </span>
                    <div style={{ fontFamily: 'Noto Sans SC', color: '#fff' }}>{card.examples[0].chinese}</div>
                    <div style={{ color: 'var(--neon-cyan)', fontSize: '0.75rem' }}>{card.examples[0].pinyin}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{card.examples[0].translation}</div>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>Без примера</span>
                )}
              </div>

              {/* Правый блок: Кнопки действий */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={() => handleOpenEditForm(card)}
                  className="btn-neon btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <Edit size={14} /> Изменить
                </button>
                <button 
                  onClick={() => handleDeleteCard(card.id, card.characters)}
                  className="btn-neon btn-red"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно формы карточки */}
      {isFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '520px',
            padding: '30px',
            borderRadius: '20px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600' }}>
                {editingCardId ? 'Редактировать карточку' : 'Добавить новую карточку'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveCard}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Китайские иероглифы (упрощенные)
                </label>
                <input 
                  type="text" 
                  className="input-glass"
                  placeholder="например, 苹果"
                  value={characters}
                  onChange={(e) => setCharacters(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Пиньинь (транскрипция)
                </label>
                <input 
                  type="text" 
                  className="input-glass"
                  placeholder="Автогенерация (можно оставить пустым)"
                  value={pinyin}
                  onChange={(e) => setPinyin(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Перевод на русский
                </label>
                <input 
                  type="text" 
                  className="input-glass"
                  placeholder="например, яблоко"
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  required
                />
              </div>

              {/* Секция Примера */}
              <div style={{ 
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                paddingTop: '16px',
                marginBottom: '24px'
              }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '500', display: 'block', marginBottom: '12px', color: 'var(--neon-cyan)' }}>
                  Пример предложения (необязательно)
                </span>
                
                <div style={{ marginBottom: '10px' }}>
                  <input 
                    type="text" 
                    className="input-glass"
                    placeholder="Пример на китайском (например, 我喜欢吃苹果。)"
                    value={exampleChinese}
                    onChange={(e) => setExampleChinese(e.target.value)}
                  />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <input 
                    type="text" 
                    className="input-glass"
                    placeholder="Пиньинь примера (например, wǒ xǐhuan chī píngguǒ.)"
                    value={examplePinyin}
                    onChange={(e) => setExamplePinyin(e.target.value)}
                  />
                </div>
                
                <div>
                  <input 
                    type="text" 
                    className="input-glass"
                    placeholder="Перевод примера (например, Я люблю есть яблоки.)"
                    value={exampleTranslation}
                    onChange={(e) => setExampleTranslation(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsFormOpen(false)}
                  className="btn-neon btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="btn-neon btn-cyan"
                  style={{ padding: '8px 20px' }}
                >
                  {formLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
