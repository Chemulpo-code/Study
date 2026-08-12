import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Edit, Trash, BookOpen, Book, RefreshCw } from '../components/Icons';
import { API_BASE } from '../config';

export default function DashboardPage({ token, user, displayMode, onToggleDisplayMode, onLogout, onSelectModuleStudy, onSelectModuleManage, onGoToPinyinChart, onGoToToneTrainer, onGoToMatchGame, onGoToSpeedSprint, onGoToSentenceBuilder, onGoToFillInBlank }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Состояния для HSK 1 и выбора режимов тренировки
  const [importLoading, setImportLoading] = useState(false);
  const [selectedModuleIdForStudy, setSelectedModuleIdForStudy] = useState(null);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);

  // Состояния для модального окна создания/редактирования модуля
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const handleImportHsk1 = async () => {
    setImportLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/modules/import-hsk1`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при импорте');
      fetchModules();
      fetchStats();
    } catch (err) {
      alert(err.message);
    } finally {
      setImportLoading(false);
    }
  };

  // Загрузка модулей
  const fetchModules = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/modules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при загрузке модулей');
      setModules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const [stats, setStats] = useState({ boxCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, activity: {} });

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setStats(data);
      }
    } catch (err) {
      console.error('Ошибка загрузки статистики:', err);
    }
  };

  useEffect(() => {
    fetchModules();
    fetchStats();
  }, []);

  // Открытие модального окна для создания нового модуля
  const handleOpenCreateModal = () => {
    setEditingModuleId(null);
    setModalTitle('');
    setModalDescription('');
    setIsModalOpen(true);
  };

  // Открытие модального окна для редактирования модуля
  const handleOpenEditModal = (module) => {
    setEditingModuleId(module.id);
    setModalTitle(module.title);
    setModalDescription(module.description || '');
    setIsModalOpen(true);
  };

  const handleOpenStudyMode = (moduleId) => {
    setSelectedModuleIdForStudy(moduleId);
    setIsModeModalOpen(true);
  };

  // Создание/сохранение модуля
  const handleSaveModule = async (e) => {
    e.preventDefault();
    if (!modalTitle.trim()) return;

    setActionLoading(true);
    const endpoint = editingModuleId ? `/api/modules/${editingModuleId}` : '/api/modules';
    const method = editingModuleId ? 'PUT' : 'POST';

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: modalTitle, description: modalDescription })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при сохранении');

      setIsModalOpen(false);
      fetchModules();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Удаление модуля
  const handleDeleteModule = async (id, title) => {
    if (!window.confirm(`Вы уверены, что хотите удалить модуль "${title}" и все его карточки?`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/modules/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при удалении');
      fetchModules();
    } catch (err) {
      alert(err.message);
    }
  };

  // Сброс прогресса модуля
  const handleResetProgress = async (id, title) => {
    if (!window.confirm(`Вы уверены, что хотите сбросить прогресс изучения для модуля "${title}"?`)) return;

    try {
      const response = await fetch(`${API_BASE}/api/modules/${id}/reset-progress`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Ошибка при сбросе прогресса');
      fetchModules();
      fetchStats();
    } catch (err) {
      alert(err.message);
    }
  };

  const renderActivityCalendar = () => {
    const cells = [];
    const today = new Date();
    
    // Сдвигаемся на 83 дня назад (12 недель * 7 дней - 1)
    const startDate = new Date();
    startDate.setDate(today.getDate() - 83);
    
    // Генерируем 84 ячейки (ровно 12 недель по 7 дней)
    for (let i = 0; i < 84; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = stats.activity[dateStr] || 0;
      
      let bg = 'rgba(255, 255, 255, 0.03)';
      let border = '1px solid rgba(255, 255, 255, 0.05)';
      let shadow = 'none';
      
      if (count > 0 && count <= 2) {
        bg = 'rgba(0, 242, 254, 0.2)';
        border = '1px solid rgba(0, 242, 254, 0.4)';
      } else if (count > 2 && count <= 5) {
        bg = 'rgba(0, 242, 254, 0.5)';
        border = '1px solid rgba(0, 242, 254, 0.7)';
        shadow = '0 0 8px rgba(0, 242, 254, 0.3)';
      } else if (count > 5) {
        bg = 'rgba(0, 242, 254, 0.8)';
        border = '1px solid #00f2fe';
        shadow = '0 0 12px rgba(0, 242, 254, 0.6)';
      }
      
      cells.push(
        <div 
          key={i} 
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '3px',
            background: bg,
            border: border,
            boxShadow: shadow,
            transition: 'all 0.2s ease'
          }}
          title={`${dateStr}: изучено ${count} слов`}
        />
      );
    }
    
    return (
      <div className="mobile-scroll-x" style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 12px)',
          gridTemplateRows: 'repeat(7, 12px)',
          gridAutoFlow: 'column',
          gap: '4px',
          justifyContent: 'center',
          padding: '10px 0'
        }}>
          {cells}
        </div>
      </div>
    );
  };

  const renderLeitnerProgress = () => {
    const boxColors = {
      1: 'rgba(255, 51, 102, 0.85)',   // Коробка 1: Красный (сложные/новые)
      2: 'rgba(255, 153, 0, 0.85)',   // Коробка 2: Оранжевый
      3: 'rgba(255, 204, 0, 0.85)',   // Коробка 3: Желтый
      4: 'rgba(157, 78, 221, 0.85)',  // Коробка 4: Фиолетовый
      5: 'rgba(0, 255, 136, 0.85)'    // Коробка 5: Зеленый (выучено)
    };
    
    const boxShadows = {
      1: '0 0 10px rgba(255, 51, 102, 0.3)',
      2: '0 0 10px rgba(255, 153, 0, 0.3)',
      3: '0 0 10px rgba(255, 204, 0, 0.3)',
      4: '0 0 10px rgba(157, 78, 221, 0.3)',
      5: '0 0 10px rgba(0, 255, 136, 0.3)'
    };

    const maxCount = Math.max(...Object.values(stats.boxCounts), 1);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[1, 2, 3, 4, 5].map(boxNum => {
          const count = stats.boxCounts[boxNum] || 0;
          const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={boxNum} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '0.8rem', width: '70px', textAlign: 'left', color: 'var(--text-secondary)' }}>
                Коробка {boxNum}
              </span>
              <div style={{
                flex: 1,
                height: '14px',
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: '7px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
                position: 'relative'
              }}>
                <div style={{
                  width: `${percentage}%`,
                  height: '100%',
                  background: boxColors[boxNum],
                  boxShadow: boxShadows[boxNum],
                  borderRadius: '7px',
                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
                }} />
              </div>
              <span style={{ fontSize: '0.85rem', width: '30px', textAlign: 'right', fontWeight: '600', color: '#fff' }}>
                {count}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Расчет общей статистики
  const totalModules = modules.length;
  const totalCards = modules.reduce((acc, curr) => acc + (curr.totalCards || 0), 0);
  const totalLearnedCards = modules.reduce((acc, curr) => acc + (curr.knownCards || 0), 0);
  const overallProgress = totalCards > 0 ? Math.round((totalLearnedCards / totalCards) * 100) : 0;
  const hasHsk1 = modules.some(m => m.title === 'Словарь HSK 1');

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Шапка дашборда */}
      <header className="glass-panel dashboard-header">
        <div className="dashboard-user-info">
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '600' }}>
              Привет, <span style={{ color: 'var(--neon-cyan)', textShadow: '0 0 10px rgba(0, 242, 254, 0.2)' }}>{user.username}</span>!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>
              Давай продолжим изучать китайский
            </p>
          </div>
          {/* Стрик дней */}
          <div style={{
            background: 'rgba(255, 102, 0, 0.1)',
            border: '1px solid rgba(255, 102, 0, 0.3)',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#ff6600',
            fontWeight: '600',
            fontSize: '0.85rem',
            boxShadow: '0 0 10px rgba(255, 102, 0, 0.1)'
          }} title="Серия дней ежедневных занятий">
            <span>🔥</span>
            <span>{user.streak || 0} дней подряд</span>
          </div>
        </div>
        
        <div className="dashboard-actions">
          <button
            onClick={() => onToggleDisplayMode(displayMode === 'hanzi' ? 'pinyin' : 'hanzi')}
            className="btn-neon btn-secondary"
            style={{
              padding: '8px 14px',
              borderRadius: '12px',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: '600',
              border: displayMode === 'pinyin' ? '1px solid var(--neon-cyan)' : '1px solid rgba(255,255,255,0.1)',
              background: displayMode === 'pinyin' ? 'rgba(0,242,254,0.1)' : 'rgba(255,255,255,0.03)'
            }}
            title="Переключить режим между Иероглифами и Пиньинем для новичков"
          >
            <span>🔤</span>
            <span>{displayMode === 'pinyin' ? 'Режим: Пиньинь' : 'Режим: Иероглифы'}</span>
          </button>

          <button 
            onClick={onLogout}
            className="btn-neon btn-red"
            style={{ padding: '8px 16px', fontSize: '0.9rem' }}
          >
            <LogOut size={16} /> Выйти
          </button>
        </div>
      </header>

      {/* Секция статистики */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {/* Карточка 1: Прогресс */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '14px',
            background: 'rgba(0, 242, 254, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--neon-cyan)',
            boxShadow: 'var(--glow-cyan)'
          }}>
            <BookOpen size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{overallProgress}%</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Общий прогресс</div>
          </div>
        </div>

        {/* Карточка 2: Всего модулей */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '14px',
            background: 'rgba(185, 0, 254, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#d156ff',
            boxShadow: 'var(--glow-violet)'
          }}>
            <Book size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{totalModules}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Модулей создано</div>
          </div>
        </div>

        {/* Карточка 3: Всего карточек */}
        <div className="glass-panel" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '14px',
            background: 'rgba(0, 255, 136, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--neon-green)',
            boxShadow: 'var(--glow-green)'
          }}>
            <Plus size={28} />
          </div>
          <div>
            <div style={{ fontSize: '1.8rem', fontWeight: '700' }}>{totalCards}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Всего слов и фраз</div>
          </div>
        </div>
      </div>

      {/* Секция детальной аналитики */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {/* Панель коробок Лейтнера */}
        <div className="glass-panel" style={{ padding: '24px 30px' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '20px', color: '#fff' }}>
            📦 Распределение по коробкам Лейтнера
          </h3>
          {renderLeitnerProgress()}
        </div>

        {/* Панель календаря активности */}
        <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '6px', color: '#fff' }}>
              📅 Календарь активности
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '16px' }}>
              История изученных карточек за последние 12 недель
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
            {renderActivityCalendar()}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            marginTop: '10px'
          }}>
            <span>Меньше</span>
            <div style={{ width: '10px', height: '10px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '2px' }} />
            <div style={{ width: '10px', height: '10px', background: 'rgba(0, 242, 254, 0.2)', borderRadius: '2px' }} />
            <div style={{ width: '10px', height: '10px', background: 'rgba(0, 242, 254, 0.5)', borderRadius: '2px' }} />
            <div style={{ width: '10px', height: '10px', background: 'rgba(0, 242, 254, 0.8)', borderRadius: '2px', boxShadow: '0 0 5px rgba(0, 242, 254, 0.5)' }} />
            <span>Больше</span>
          </div>
        </div>
      </div>

      {/* Секция тренажеров и игр */}
      <div style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '600', marginBottom: '20px' }}>Тренажеры и Игры</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '20px'
        }}>
          {/* Кнопка 1: Таблица пиньиня */}
          <div 
            onClick={onGoToPinyinChart}
            className="glass-panel" 
            style={{ 
              padding: '20px 24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05), rgba(255, 255, 255, 0.02))'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(0, 242, 254, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--neon-cyan)',
              fontSize: '1.4rem',
              boxShadow: 'var(--glow-cyan)'
            }}>
              拼
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff' }}>Таблица слогов</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Интерактивная сетка произношения всех 4 тонов
              </p>
            </div>
          </div>

          {/* Кнопка 2: Тренажер тонов */}
          <div 
            onClick={onGoToToneTrainer}
            className="glass-panel" 
            style={{ 
              padding: '20px 24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(185, 0, 254, 0.05), rgba(255, 255, 255, 0.02))'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(185, 0, 254, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d156ff',
              fontSize: '1.4rem',
              boxShadow: 'var(--glow-violet)'
            }}>
              🎧
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff' }}>Тренажер тонов</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Различение тонов на слух (игровой тест)
              </p>
            </div>
          </div>

          {/* Кнопка 3: Игра «Найди пару» */}
          <div 
            onClick={onGoToMatchGame}
            className="glass-panel" 
            style={{ 
              padding: '20px 24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.05), rgba(255, 255, 255, 0.02))'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(0, 255, 136, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--neon-green)',
              fontSize: '1.4rem',
              boxShadow: 'var(--glow-green)'
            }}>
              🎮
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff' }}>Игра «Найди пару»</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Сопоставление иероглифов и перевода на скорость
              </p>
            </div>
          </div>

          {/* Кнопка 4: Неоновый Спринт */}
          <div 
            onClick={onGoToSpeedSprint}
            className="glass-panel" 
            style={{ 
              padding: '20px 24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(255, 51, 102, 0.05), rgba(255, 255, 255, 0.02))'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 51, 102, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--neon-red)',
              fontSize: '1.4rem',
              boxShadow: '0 0 12px rgba(255, 51, 102, 0.3)'
            }}>
              🚀
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff' }}>Неоновый Спринт</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Скоростной аркадный тест с множителями комбо
              </p>
            </div>
          </div>

          {/* Кнопка 5: Конструктор предложений */}
          <div 
            onClick={onGoToSentenceBuilder}
            className="glass-panel" 
            style={{ 
              padding: '20px 24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(255, 204, 0, 0.05), rgba(255, 255, 255, 0.02))'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(255, 204, 0, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffcc00',
              fontSize: '1.4rem',
              boxShadow: '0 0 12px rgba(255, 204, 0, 0.3)'
            }}>
              🧩
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff' }}>Конструктор фраз</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Сборка китайских предложений из слов на слух
              </p>
            </div>
          </div>

          {/* Кнопка 6: Шпионский пропуск */}
          <div 
            onClick={onGoToFillInBlank}
            className="glass-panel" 
            style={{ 
              padding: '20px 24px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px', 
              cursor: 'pointer',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05), rgba(255, 255, 255, 0.02))'
            }}
          >
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'rgba(0, 242, 254, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--neon-cyan)',
              fontSize: '1.4rem',
              boxShadow: 'var(--glow-cyan)'
            }}>
              🕵️‍♂️
            </div>
            <div>
              <h4 style={{ fontSize: '1.05rem', fontWeight: '600', color: '#fff' }}>Контекстный пропуск</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '2px' }}>
                Вставка недостающего слова в контекст предложения
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Заголовок списка модулей */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h3 style={{ fontSize: '1.4rem', fontWeight: '600' }}>Мои модули</h3>
        <button 
          onClick={handleOpenCreateModal}
          className="btn-neon btn-cyan"
          style={{ padding: '10px 20px', fontSize: '0.95rem' }}
        >
          <Plus size={18} /> Создать модуль
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

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Загрузка модулей...
        </div>
      ) : modules.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '16px' }}>У вас пока нет ни одного модуля.</p>
          <button 
            onClick={handleOpenCreateModal}
            className="btn-neon btn-cyan"
            style={{ padding: '8px 16px' }}
          >
            <Plus size={16} /> Создать первый модуль
          </button>
        </div>
      ) : (
        /* Сетка модулей */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '24px'
        }}>
          {modules.map(module => (
            <div key={module.id} className="glass-panel" style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '240px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Верхняя часть: Название и Меню редактирования */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '8px', paddingRight: '40px' }}>
                    {module.title}
                  </h4>
                  {/* Иконки редактирования/удаления */}
                  <div style={{ display: 'flex', gap: '8px', position: 'absolute', top: '20px', right: '20px' }}>
                    <button 
                      onClick={() => handleOpenEditModal(module)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      title="Редактировать"
                    >
                      <Edit size={16} className="btn-edit-hover" />
                    </button>
                    <button 
                      onClick={() => handleResetProgress(module.id, module.title)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                      title="Сбросить прогресс"
                    >
                      <RefreshCw size={14} className="btn-edit-hover" />
                    </button>
                    <button 
                      onClick={() => handleDeleteModule(module.id, module.title)}
                      style={{ background: 'none', border: 'none', color: 'var(--neon-red)', cursor: 'pointer' }}
                      title="Удалить"
                    >
                      <Trash size={16} className="btn-edit-hover" />
                    </button>
                  </div>
                </div>
                <p style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  display: '-webkit-box',
                  WebkitLineClamp: '2',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  marginBottom: '16px'
                }}>
                  {module.description || 'Нет описания'}
                </p>
              </div>

              {/* Нижняя часть: Прогресс и Кнопки */}
              <div>
                {/* Карточки и Прогресс-бар */}
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>{module.totalCards} карточек</span>
                    <span style={{ color: module.learnedPercentage > 0 ? 'var(--neon-green)' : 'var(--text-secondary)' }}>
                      {module.learnedPercentage}% изучено
                    </span>
                  </div>
                  {/* Контейнер прогресс-бара */}
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${module.learnedPercentage}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--neon-cyan), var(--neon-green))',
                      boxShadow: '0 0 8px rgba(0, 255, 136, 0.5)',
                      borderRadius: '3px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                </div>

                {/* Действия */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button 
                    onClick={() => handleOpenStudyMode(module.id)}
                    className="btn-neon btn-green"
                    disabled={module.totalCards === 0}
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem', opacity: module.totalCards === 0 ? 0.5 : 1 }}
                  >
                    <BookOpen size={14} /> Учить
                  </button>
                  <button 
                    onClick={() => onSelectModuleManage(module.id)}
                    className="btn-neon btn-secondary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                  >
                    <Edit size={14} /> Слова
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно создания / редактирования */}
      {isModalOpen && (
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
            maxWidth: '480px',
            padding: '30px',
            borderRadius: '20px',
            position: 'relative'
          }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '20px' }}>
              {editingModuleId ? 'Редактировать модуль' : 'Создать новый модуль'}
            </h3>

            <form onSubmit={handleSaveModule}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Название модуля
                </label>
                <input 
                  type="text" 
                  className="input-glass"
                  placeholder="например, Овощи и Фрукты"
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  maxLength={40}
                  required
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Описание модуля
                </label>
                <textarea 
                  className="input-glass"
                  placeholder="Небольшое описание или грамматическая тема..."
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                  maxLength={150}
                  rows={3}
                  style={{ resize: 'none', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn-neon btn-secondary"
                  style={{ padding: '8px 16px' }}
                >
                  Отмена
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="btn-neon btn-cyan"
                  style={{ padding: '8px 20px' }}
                >
                  {actionLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Модальное окно выбора режима изучения */}
      {isModeModalOpen && (
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
            maxWidth: '440px',
            padding: '30px',
            borderRadius: '24px',
            position: 'relative',
            textAlign: 'center'
          }}>
            <button 
              onClick={() => setIsModeModalOpen(false)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>

            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '8px', color: '#fff' }}>
              Выберите режим тренировки
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Как именно вы хотите повторять слова этого модуля?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Режим 1: Интервальные карточки */}
              <button 
                onClick={() => {
                  setIsModeModalOpen(false);
                  onSelectModuleStudy(selectedModuleIdForStudy, 'cards', true);
                }}
                className="btn-neon btn-cyan"
                style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'flex-start', textAlign: 'left' }}
              >
                <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>⏰ Интервальное повторение</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px', fontWeight: '400' }}>
                  Показ только карточек, пришедших к сроку повторения
                </div>
              </button>

              {/* Режим 2: Все карточки */}
              <button 
                onClick={() => {
                  setIsModeModalOpen(false);
                  onSelectModuleStudy(selectedModuleIdForStudy, 'cards', false);
                }}
                className="btn-neon btn-secondary"
                style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'flex-start', textAlign: 'left' }}
              >
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff' }}>🗂️ Все карточки подряд</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px', fontWeight: '400' }}>
                  Пролистать все слова модуля по очереди
                </div>
              </button>

              {/* Режим 3: Тест */}
              <button 
                onClick={() => {
                  setIsModeModalOpen(false);
                  onSelectModuleStudy(selectedModuleIdForStudy, 'quiz', false);
                }}
                className="btn-neon btn-violet"
                style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'flex-start', textAlign: 'left' }}
              >
                <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>🎯 Тест (Викторина)</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px', fontWeight: '400' }}>
                  Выбор правильного варианта перевода из 4 предложенных
                </div>
              </button>

              {/* Режим 4: Диктант */}
              <button 
                onClick={() => {
                  setIsModeModalOpen(false);
                  onSelectModuleStudy(selectedModuleIdForStudy, 'dictation', false);
                }}
                className="btn-neon btn-green"
                style={{ width: '100%', padding: '14px', borderRadius: '14px', justifyContent: 'flex-start', textAlign: 'left' }}
              >
                <div style={{ fontSize: '0.95rem', fontWeight: '600' }}>✍️ Письменный диктант</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px', fontWeight: '400' }}>
                  Написание пиньиня на слух по голосовому произношению
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
