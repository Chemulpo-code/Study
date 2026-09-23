import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash } from '../components/Icons';
import { API_BASE } from '../config';
import { useToast } from '../components/ToastContext';
import { PageHeader } from '../components/UI';
import Modal from '../components/Modal';
import AudioPlayer from '../components/AudioPlayer';
import { deconstructCharacter } from '../utils/radicalsData';

import { cacheCardsLocally, getCachedCardsLocally } from '../utils/offlineStorage';

export default function ManageCardsPage({ token, moduleId, onBackToDashboard, onBack }) {
  const { showToast } = useToast();
  const handleBack = onBackToDashboard || onBack;
  const [module, setModule] = useState(null);
  const [allModules, setAllModules] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Просмотр карточки в модальном окне
  const [viewingCard, setViewingCard] = useState(null);

  // Состояния для формы (добавление / редактирование карточки)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCardId, setEditingCardId] = useState(null);
  const [targetModuleId, setTargetModuleId] = useState(moduleId);
  const [characters, setCharacters] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [translation, setTranslation] = useState('');
  
  // Дополнительные поля для одного примера предложения
  const [exampleChinese, setExampleChinese] = useState('');
  const [examplePinyin, setExamplePinyin] = useState('');
  const [exampleTranslation, setExampleTranslation] = useState('');
  const [usedTatoebaSentences, setUsedTatoebaSentences] = useState([]);
  
  const [formLoading, setFormLoading] = useState(false);
  const [isTatoebaLoading, setIsTatoebaLoading] = useState(false);

  const handleFetchTatoebaExample = async () => {
    if (!characters.trim()) {
      showToast('Сначала введите иероглифы!', 'warning');
      return;
    }

    setIsTatoebaLoading(true);

    try {
      // Собираем текущий список исключений (текущие и ранее загруженные в рамках этой формы предложения)
      const currentExcludes = [...usedTatoebaSentences];
      if (exampleChinese.trim() && !currentExcludes.includes(exampleChinese.trim())) {
        currentExcludes.push(exampleChinese.trim());
      }

      const excludeParam = encodeURIComponent(JSON.stringify(currentExcludes));
      const translationParam = encodeURIComponent(translation.trim());
      const response = await fetch(`${API_BASE}/api/tatoeba/example?word=${encodeURIComponent(characters.trim())}&translation=${translationParam}&exclude=${excludeParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Пример предложения не найден в базе Tatoeba');

      if (data.example) {
        setExampleChinese(data.example.chinese || '');
        setExamplePinyin(data.example.pinyin || '');
        setExampleTranslation(data.example.translation || '');

        if (data.example.chinese && !usedTatoebaSentences.includes(data.example.chinese)) {
          setUsedTatoebaSentences(prev => [...prev, data.example.chinese]);
        }
        showToast('Пример из Tatoeba успешно подтянут!', 'success');
      }
    } catch (err) {
      showToast(err.message, 'warning');
    } finally {
      setIsTatoebaLoading(false);
    }
  };

  // Загрузка модуля и его карточек
  const loadData = useCallback(async () => {
    try {
      // 1. Получаем модули для поиска нужного названия
      const moduleRes = await fetch(`${API_BASE}/api/modules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const modulesData = await moduleRes.json();
      const modulesList = Array.isArray(modulesData) ? modulesData : [];
      setAllModules(modulesList);
      const currentModule = modulesList.find(m => m.id === moduleId);
      setModule(currentModule || null);

      // 2. Получаем карточки модуля
      const cardsRes = await fetch(`${API_BASE}/api/modules/${moduleId}/cards`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const cardsData = await cardsRes.json();
      const validCards = Array.isArray(cardsData) ? cardsData : [];
      setCards(validCards);
      cacheCardsLocally(moduleId, validCards);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
      setError(err.message);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, [moduleId, token]);

  useEffect(() => {
    const cached = getCachedCardsLocally(moduleId);
    if (cached && cached.length > 0) {
      setCards(cached);
      setLoading(false);
    }
    loadData();
  }, [moduleId, loadData]);

  const handleOpenCreateForm = () => {
    setEditingCardId(null);
    setTargetModuleId(moduleId);
    setCharacters('');
    setPinyin('');
    setTranslation('');
    setExampleChinese('');
    setExamplePinyin('');
    setExampleTranslation('');
    setUsedTatoebaSentences([]);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (card) => {
    setEditingCardId(card.id);
    setTargetModuleId(card.module_id || moduleId);
    setCharacters(card.characters);
    setPinyin(card.pinyin);
    setTranslation(card.translation);
    setUsedTatoebaSentences(card.examples ? card.examples.map(e => e.chinese).filter(Boolean) : []);
    
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

  const handleMoveCard = async (cardId, destinationModuleId) => {
    const destMod = allModules.find(m => m.id === destinationModuleId);
    const destTitle = destMod ? destMod.title : 'другой модуль';

    try {
      const response = await fetch(`${API_BASE}/api/cards/${cardId}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetModuleId: destinationModuleId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при перемещении карточки');

      const updatedCards = cards.filter(c => c.id !== cardId);
      setCards(updatedCards);
      cacheCardsLocally(moduleId, updatedCards);
      showToast(`Карточка перенесена в модуль «${destTitle}» 🚚`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
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

    const selectedModuleId = targetModuleId || moduleId;
    const endpoint = editingCardId ? `/api/cards/${editingCardId}` : `/api/modules/${selectedModuleId}/cards`;
    const method = editingCardId ? 'PUT' : 'POST';

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ characters, pinyin, translation, examples, targetModuleId: selectedModuleId })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при сохранении карточки');

      setIsFormOpen(false);
      if (selectedModuleId !== moduleId) {
        const destMod = allModules.find(m => m.id === selectedModuleId);
        showToast(`Карточка перенесена в модуль «${destMod?.title || ''}» 🚚`, 'success');
      } else {
        showToast('Карточка успешно сохранена!', 'success');
      }
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
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
      showToast('Карточка удалена', 'info');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleFavorite = async (cardId) => {
    try {
      const response = await fetch(`${API_BASE}/api/cards/${cardId}/favorite`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось обновить избранное.');
      setCards(items => items.map(card => card.id === cardId ? { ...card, favorite: data.favorite } : card));
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Фильтрация карточек по поисковому запросу
  const safeCards = Array.isArray(cards) ? cards : [];
  const filteredCards = safeCards.filter(card => 
    (card.characters || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (card.pinyin || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (card.translation || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Загрузка слов...</p>
      </div>
    );
  }

  return (
    <div className="page-container manage-page">
      <div className="manage-sticky-controls">
        <PageHeader title={module?.title || 'Слова модуля'} eyebrow="Библиотека" meta={`${cards.length} карточек`} onBack={handleBack} />
        <div className="manage-page__search">
          <input
            type="text"
            placeholder="Поиск по иероглифам, пиньиню или переводу..."
            aria-label="Поиск карточек"
            className="input-glass"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
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

      {/* Список слов в виде карточек */}
      {filteredCards.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          {searchQuery ? 'Ничего не найдено по вашему запросу.' : 'В этом модуле пока нет слов. Нажмите кнопку «Добавить слово», чтобы создать карточку.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredCards.map(card => (
            <div
              key={card.id}
              className="glass-panel card-row-interactive"
              onClick={() => setViewingCard(card)}
              style={{
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                cursor: 'pointer'
              }}
            >
              {/* Левый блок: Иероглифы и пиньинь + Кнопка быстрой озвучки */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flex: 1, minWidth: '250px' }}>
                <div className="chinese-char-sm" style={{ 
                  fontSize: '1.8rem', 
                  color: '#fff', 
                  minWidth: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <span>{card.characters}</span>
                  <AudioPlayer text={card.characters} style={{ width: '32px', height: '32px' }} />
                </div>
                <div>
                  <div style={{ color: 'var(--neon-cyan)', fontWeight: '600', fontSize: '0.95rem' }}>{card.pinyin}</div>
                  <div style={{ fontSize: '1rem', color: '#fff', marginTop: '2px' }}>{card.translation}</div>
                </div>
              </div>

              {/* Средний блок: Примеры + Кнопка озвучки примера */}
              <div style={{ flex: 1.5, minWidth: '280px' }}>
                {card.examples && card.examples.length > 0 ? (
                  <div style={{ 
                    fontSize: '0.8rem', 
                    padding: '8px 12px', 
                    background: 'rgba(255,255,255,0.02)', 
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.04)' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', textTransform: 'uppercase' }}>
                        Пример:
                      </span>
                      <AudioPlayer text={card.examples[0].chinese} style={{ width: '26px', height: '26px' }} />
                    </div>
                    <div style={{ fontFamily: 'Noto Sans SC', color: '#fff' }}>{card.examples[0].chinese}</div>
                    <div style={{ color: 'var(--neon-cyan)', fontSize: '0.75rem' }}>{card.examples[0].pinyin}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{card.examples[0].translation}</div>
                  </div>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontStyle: 'italic' }}>Без примера</span>
                )}
              </div>

              {/* Правый блок: Кнопки действий */}
              <div style={{ display: 'flex', gap: '12px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleToggleFavorite(card.id); }}
                  className="btn-neon btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  aria-label={card.favorite ? `Убрать ${card.characters} из избранного` : `Добавить ${card.characters} в избранное`}
                >
                  {card.favorite ? '★' : '☆'}
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleOpenEditForm(card); }}
                  className="btn-neon btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <Edit size={14} /> Изменить
                </button>
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteCard(card.id, card.characters); }}
                  className="btn-neon btn-red"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  aria-label={`Удалить карточку ${card.characters}`}
                >
                  <Trash size={14} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно подробного просмотра карточки */}
      <Modal
        open={Boolean(viewingCard)}
        title="Просмотр карточки"
        onClose={() => setViewingCard(null)}
        className="card-detail-modal"
      >
        {viewingCard && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Главный иероглиф и транскрипция с кнопкой озвучки */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 16px',
              background: 'rgba(0, 242, 254, 0.03)',
              border: '1px solid rgba(0, 242, 254, 0.15)',
              borderRadius: '18px',
              textAlign: 'center'
            }}>
              <div className="chinese-char-sm" style={{
                fontSize: '3.6rem',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
                marginBottom: '8px'
              }}>
                <span>{viewingCard.characters}</span>
                <AudioPlayer text={viewingCard.characters} style={{ width: '48px', height: '48px' }} />
              </div>

              <div style={{
                fontSize: '1.4rem',
                fontWeight: '700',
                color: 'var(--neon-cyan)',
                letterSpacing: '1px',
                marginBottom: '8px'
              }}>
                {viewingCard.pinyin}
              </div>

              <div style={{
                fontSize: '1.3rem',
                fontWeight: '600',
                color: '#fff'
              }}>
                {viewingCard.translation}
              </div>
            </div>

            {/* Разбор ключей */}
            {(() => {
              const radicals = deconstructCharacter(viewingCard.characters);
              if (radicals.length === 0) return null;
              return (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '14px',
                  padding: '12px 16px',
                  fontSize: '0.88rem'
                }}>
                  <span style={{ color: 'var(--neon-cyan)', fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                    🧱 Иероглифические ключи (составные части):
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                    {radicals.map((r, i) => (
                      <span key={i} style={{ color: '#fff' }}>
                        <strong>{r.char}</strong> — {r.name} ({r.meaning})
                      </span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Примеры предложений */}
            <div>
              <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                💬 Примеры предложений:
              </h4>
              {viewingCard.examples && viewingCard.examples.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {viewingCard.examples.map((ex, idx) => (
                    <div key={idx} style={{
                      padding: '14px 16px',
                      background: 'rgba(0, 242, 254, 0.04)',
                      border: '1px solid rgba(0, 242, 254, 0.15)',
                      borderRadius: '14px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ fontFamily: 'Noto Sans SC', color: '#fff', fontSize: '1.15rem', fontWeight: '500' }}>
                          {ex.chinese}
                        </div>
                        <AudioPlayer text={ex.chinese} style={{ width: '36px', height: '36px' }} />
                      </div>
                      <div style={{ color: 'var(--neon-cyan)', fontSize: '0.9rem' }}>{ex.pinyin}</div>
                      <div style={{ color: 'var(--paper-muted)', fontSize: '0.9rem' }}>{ex.translation}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic', padding: '12px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                  Для этой карточки пока нет примеров. Вы можете добавить пример через редактирование.
                </div>
              )}
            </div>

            {/* Быстрое перемещение карточки в другой модуль */}
            {allModules.length > 1 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                  🚚 Переместить в другой модуль:
                </span>
                <select
                  className="input-glass"
                  style={{ padding: '6px 12px', fontSize: '0.85rem', maxWidth: '220px', background: 'rgba(20, 20, 35, 0.9)', color: '#fff', cursor: 'pointer' }}
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      const targetCardId = viewingCard.id;
                      const newModId = e.target.value;
                      setViewingCard(null);
                      handleMoveCard(targetCardId, newModId);
                    }
                  }}
                >
                  <option value="" disabled>Выберите модуль...</option>
                  {allModules.filter(m => m.id !== moduleId).map(m => (
                    <option key={m.id} value={m.id} style={{ background: '#181828', color: '#fff' }}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Панель действий */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <button
                type="button"
                onClick={() => {
                  handleToggleFavorite(viewingCard.id);
                  setViewingCard(prev => prev ? { ...prev, favorite: !prev.favorite } : null);
                }}
                className="btn-neon btn-secondary"
                style={{ padding: '8px 16px', fontSize: '0.85rem' }}
              >
                {viewingCard.favorite ? '★ В избранном' : '☆ В избранное'}
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    const targetCard = viewingCard;
                    setViewingCard(null);
                    handleOpenEditForm(targetCard);
                  }}
                  className="btn-neon btn-cyan"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <Edit size={14} /> Изменить
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetCard = viewingCard;
                    setViewingCard(null);
                    handleDeleteCard(targetCard.id, targetCard.characters);
                  }}
                  className="btn-neon btn-red"
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  <Trash size={14} /> Удалить
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Модальное окно формы карточки */}
      <Modal
        open={isFormOpen}
        title={editingCardId ? 'Редактировать карточку' : 'Добавить новую карточку'}
        onClose={() => setIsFormOpen(false)}
        className="manage-card-modal"
      >
            <form onSubmit={handleSaveCard}>
              {allModules.length > 1 && (
                <div style={{ marginBottom: '14px' }}>
                  <label htmlFor="card-target-module" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Модуль
                  </label>
                  <select 
                    id="card-target-module"
                    name="targetModuleId"
                    className="input-glass"
                    value={targetModuleId || moduleId}
                    onChange={(e) => setTargetModuleId(e.target.value)}
                    style={{ width: '100%', background: 'rgba(20, 20, 35, 0.9)', color: '#fff', cursor: 'pointer' }}
                  >
                    {allModules.map(m => (
                      <option key={m.id} value={m.id} style={{ background: '#181828', color: '#fff' }}>
                        {m.title} {m.id === moduleId ? '(Текущий)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div style={{ marginBottom: '14px' }}>
                <label htmlFor="card-characters" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Китайские иероглифы (упрощенные)
                </label>
                <input 
                  id="card-characters"
                  name="characters"
                  type="text" 
                  className="input-glass"
                  placeholder="например, 苹果"
                  value={characters}
                  onChange={(e) => setCharacters(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label htmlFor="card-pinyin" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Пиньинь (транскрипция)
                </label>
                <input 
                  id="card-pinyin"
                  name="pinyin"
                  type="text" 
                  className="input-glass"
                  placeholder="Автогенерация (можно оставить пустым)"
                  value={pinyin}
                  onChange={(e) => setPinyin(e.target.value)}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label htmlFor="card-translation" style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Перевод на русский
                </label>
                <input 
                  id="card-translation"
                  name="translation"
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: '500', color: 'var(--neon-cyan)' }}>
                    Пример предложения (необязательно)
                  </span>
                  
                  <button
                    type="button"
                    onClick={handleFetchTatoebaExample}
                    disabled={isTatoebaLoading || !characters.trim()}
                    className="btn-neon btn-secondary"
                    style={{
                      padding: '4px 12px',
                      fontSize: '0.75rem',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(0, 242, 254, 0.1)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      color: 'var(--neon-cyan)',
                      cursor: isTatoebaLoading || !characters.trim() ? 'not-allowed' : 'pointer',
                      opacity: !characters.trim() ? 0.5 : 1
                    }}
                  >
                    {isTatoebaLoading ? '⌛ Поиск...' : '✨ Найти пример (Tatoeba)'}
                  </button>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <input 
                    aria-label="Пример на китайском"
                    name="exampleChinese"
                    type="text" 
                    className="input-glass"
                    placeholder="Пример на китайском (например, 我喜欢吃苹果。)"
                    value={exampleChinese}
                    onChange={(e) => setExampleChinese(e.target.value)}
                  />
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <input 
                    aria-label="Пиньинь примера"
                    name="examplePinyin"
                    type="text" 
                    className="input-glass"
                    placeholder="Пиньинь примера (например, wǒ xǐhuan chī píngguǒ.)"
                    value={examplePinyin}
                    onChange={(e) => setExamplePinyin(e.target.value)}
                  />
                </div>
                
                <div>
                  <input 
                    aria-label="Перевод примера"
                    name="exampleTranslation"
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
      </Modal>

      {/* Прикрепленная внизу экрана по центру кнопка "Добавить слово / фразу" (Sticky FAB) */}
      <div className="manage-add-card">
        <button 
          onClick={handleOpenCreateForm}
          className="btn-neon btn-cyan"
          style={{ 
            padding: '14px 28px', 
            fontSize: '0.95rem', 
            fontWeight: '600',
            borderRadius: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Plus size={20} /> Добавить слово / фразу
        </button>
      </div>
    </div>
  );
}
