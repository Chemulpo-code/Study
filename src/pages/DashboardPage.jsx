import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LogOut, Plus, RefreshCw } from '../components/Icons';
import { API_BASE, APP_VERSION } from '../config';
import { useToast } from '../components/ToastContext';
import { cacheModulesLocally, getCachedModulesLocally } from '../utils/offlineStorage';
import AppShell from '../components/AppShell';
import Modal from '../components/Modal';
import { Button, EmptyState, Panel, ProgressBar } from '../components/UI';
import { ModuleCard, StatsStrip, TodayPanel, TrainerGrid } from '../components/DashboardSections';
import { selectContinueModule } from '../utils/dashboard';

export default function DashboardPage({
  token,
  user,
  displayMode,
  lastModuleId,
  onToggleDisplayMode,
  onLogout,
  onSelectModuleStudy,
  onSelectModuleManage,
  onOpenPinyinChart,
  onOpenToneTrainer,
  onOpenMatchGame,
  onOpenSpeedSprint,
  onOpenSentenceBuilder,
  onOpenFillBlank,
  onSelectHandsFree,
  onSelectDialogues,
  onOpenProgress,
  onOpenTravel
}) {
  const { showToast } = useToast();
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [serverInfo, setServerInfo] = useState(null);
  const [dailyPlan, setDailyPlan] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [isModeModalOpen, setIsModeModalOpen] = useState(false);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchModules = useCallback(async () => {
    try {
      const [response, errorBoxResponse] = await Promise.all([
        fetch(`${API_BASE}/api/modules`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/modules/error-box`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => null)
      ]);
      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) throw new Error(data.error || 'Не удалось загрузить модули. Обновите страницу.');

      let nextModules = [...data];
      if (errorBoxResponse?.ok) {
        const errorBox = await errorBoxResponse.json().catch(() => null);
        if (errorBox?.totalCards > 0) nextModules = [errorBox, ...nextModules];
      }
      setModules(nextModules);
      setError('');
      cacheModulesLocally(data);
    } catch (requestError) {
      const cached = getCachedModulesLocally();
      if (cached?.length) setModules(cached);
      else setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const cached = getCachedModulesLocally();
    if (cached?.length) {
      setModules(cached);
      setLoading(false);
    }
    fetchModules();
    fetch(`${API_BASE}/api/version`)
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then(setServerInfo)
      .catch(() => setServerInfo({ version: 'офлайн' }));
    fetch(`${API_BASE}/api/my-progress`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => setDailyPlan(data.plan))
      .catch(() => setDailyPlan(null));
  }, [fetchModules, token]);

  const openCreateModal = () => {
    setEditingModuleId(null);
    setModalTitle('');
    setModalDescription('');
    setIsModuleModalOpen(true);
  };

  const openEditModal = (module) => {
    setEditingModuleId(module.id);
    setModalTitle(module.title);
    setModalDescription(module.description || '');
    setIsModuleModalOpen(true);
  };

  const openStudyMode = (moduleId) => {
    setSelectedModuleId(moduleId);
    setIsModeModalOpen(true);
  };

  const saveModule = async (event) => {
    event.preventDefault();
    if (!modalTitle.trim()) return;
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}${editingModuleId ? `/api/modules/${editingModuleId}` : '/api/modules'}`, {
        method: editingModuleId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: modalTitle.trim(), description: modalDescription.trim() })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось сохранить модуль.');
      setIsModuleModalOpen(false);
      showToast('Модуль сохранён', 'success');
      fetchModules();
    } catch (requestError) {
      showToast(requestError.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteModule = async (id, title) => {
    if (!window.confirm(`Удалить модуль «${title}» и все его карточки?`)) return;
    try {
      const response = await fetch(`${API_BASE}/api/modules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось удалить модуль.');
      showToast('Модуль удалён', 'info');
      fetchModules();
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };

  const resetProgress = async (id, title) => {
    if (!window.confirm(`Сбросить прогресс модуля «${title}»? Карточки сохранятся.`)) return;
    try {
      const response = await fetch(`${API_BASE}/api/modules/${id}/reset-progress`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось сбросить прогресс.');
      showToast('Прогресс модуля сброшен', 'info');
      fetchModules();
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };

  const resetAllProgress = async () => {
    if (!window.confirm('Сбросить весь прогресс? Слова и модули сохранятся.')) return;
    try {
      const response = await fetch(`${API_BASE}/api/progress/reset-all`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось сбросить прогресс.');
      showToast('Весь прогресс сброшен', 'info');
      fetchModules();
    } catch (requestError) {
      showToast(requestError.message, 'error');
    }
  };

  const regularModules = modules.filter((module) => module.id !== 'error-box');
  const totalCards = regularModules.reduce((sum, module) => sum + (module.totalCards || 0), 0);
  const learnedCards = regularModules.reduce((sum, module) => sum + (module.knownCards || 0), 0);
  const overallProgress = totalCards ? Math.round((learnedCards / totalCards) * 100) : 0;
  const continueModule = selectContinueModule(modules, lastModuleId);

  const trainers = useMemo(() => [
    { group: 'Произношение', mark: '音', title: 'Таблица пиньиня', description: 'Слоги и 4 тона', onClick: onOpenPinyinChart },
    { group: 'Произношение', mark: '声', title: 'Тренажёр тонов', description: 'Различайте речь на слух', onClick: onOpenToneTrainer },
    { group: 'Произношение', mark: '听', title: 'Слушай на ходу', description: 'Практика без экрана', onClick: onSelectHandsFree },
    { group: 'Слова', mark: '配', title: 'Найди пару', description: 'Иероглиф и перевод', onClick: onOpenMatchGame },
    { group: 'Предложения', mark: '句', title: 'Конструктор фраз', description: 'Соберите верный порядок', onClick: onOpenSentenceBuilder },
    { group: 'Предложения', mark: '填', title: 'Контекстный пропуск', description: 'Найдите слово по смыслу', onClick: onOpenFillBlank },
    { group: 'Предложения', mark: '谈', title: 'Микро-диалоги', description: 'Фразы в живом контексте', onClick: onSelectDialogues },
    { group: 'Игры', mark: '速', title: 'Скоростной спринт', description: 'Ответы на время', onClick: onOpenSpeedSprint }
  ], [onOpenFillBlank, onOpenMatchGame, onOpenPinyinChart, onOpenSentenceBuilder, onOpenSpeedSprint, onOpenToneTrainer, onSelectDialogues, onSelectHandsFree]);

  const chooseMode = (mode, spaced = false) => {
    setIsModeModalOpen(false);
    onSelectModuleStudy(selectedModuleId, mode, spaced);
  };

  return (
    <AppShell>
      <header className="dashboard-topbar">
        <a className="skip-link" href="#main-content">Перейти к содержанию</a>
        <div className="brand-lockup"><span className="seal" aria-hidden="true">学</span><div><strong>Учебный кабинет</strong><small>你好, {user.username}</small></div></div>
        <div className="dashboard-topbar__actions">
          <Button variant="ghost" size="sm" onClick={onOpenProgress}>Мой прогресс</Button>
          <Button variant="secondary" size="sm" onClick={() => onToggleDisplayMode(displayMode === 'hanzi' ? 'pinyin' : 'hanzi')}>{displayMode === 'pinyin' ? 'Пиньинь' : 'Иероглифы'}</Button>
          <Button variant="ghost" size="sm" onClick={onLogout} aria-label="Выйти из аккаунта"><LogOut size={17} aria-hidden="true" /><span>Выйти</span></Button>
        </div>
      </header>

      <div id="main-dashboard">
        <TodayPanel module={continueModule} onContinue={openStudyMode} onCreate={openCreateModal} />
        {dailyPlan && <Panel className="dashboard-daily-plan">
          <div><span className="eyebrow">Сегодня · ежедневный план</span><strong>{dailyPlan.complete ? 'План выполнен' : `Осталось ${dailyPlan.cardsRemaining} карточек и ${dailyPlan.trainerCompleted ? 'всё готово' : 'один тренажёр'}`}</strong></div>
          <ProgressBar value={(dailyPlan.cardsAnswered / 10) * 70 + (dailyPlan.trainerCompleted ? 30 : 0)} label={`${dailyPlan.cardsAnswered}/10 карточек`} />
          <Button variant="secondary" size="sm" onClick={onOpenProgress}>Открыть прогресс</Button>
        </Panel>}
        <StatsStrip progress={overallProgress} modules={regularModules.length} cards={totalCards} streak={user.streak} />

        <section id="modules" className="dashboard-section">
          <div className="section-heading"><div><span className="eyebrow">Ваша библиотека</span><h2>Модули</h2></div><Button variant="primary" onClick={openCreateModal}><Plus size={17} aria-hidden="true" />Создать модуль</Button></div>
          {error && <div className="inline-alert" role="alert">{error}</div>}
          {loading ? <div className="dashboard-loading"><span className="loader" /><span>Загружаем модули…</span></div> : modules.length ? (
            <div className="module-grid">{modules.map((module) => <ModuleCard key={module.id} module={module} onLearn={openStudyMode} onManage={onSelectModuleManage} onEdit={openEditModal} onReset={resetProgress} onDelete={deleteModule} />)}</div>
          ) : <EmptyState title="Модулей пока нет" description="Соберите первую небольшую тему и начните заниматься." action={<Button variant="primary" onClick={openCreateModal}>Создать модуль</Button>} />}
        </section>

        <section id="trainers" className="dashboard-section">
          <div className="section-heading"><div><span className="eyebrow">Практика навыков</span><h2>Тренажёры</h2></div></div>
          <TrainerGrid trainers={trainers} />
        </section>

        <section className="dashboard-section dashboard-quick-links" aria-label="Дополнительные возможности">
          <Button variant="secondary" onClick={onOpenProgress}>⌕ Поиск и избранное</Button>
          <Button variant="secondary" onClick={onOpenTravel}>行 Перед поездкой</Button>
        </section>

        <footer className="app-footer"><span>Клиент v{APP_VERSION}</span><span className={serverInfo?.buildHash ? 'status-ok' : ''}>{serverInfo?.buildHash ? `Сервер v${serverInfo.version}` : 'Сервер офлайн'}</span><Button variant="ghost" size="sm" onClick={resetAllProgress}><RefreshCw size={15} aria-hidden="true" />Сбросить весь прогресс</Button></footer>
      </div>

      <Modal open={isModuleModalOpen} title={editingModuleId ? 'Редактировать модуль' : 'Создать модуль'} onClose={() => setIsModuleModalOpen(false)} footer={<><Button type="button" onClick={() => setIsModuleModalOpen(false)}>Отмена</Button><Button type="submit" form="module-form" variant="primary" disabled={actionLoading}>{actionLoading ? 'Сохраняем…' : 'Сохранить'}</Button></>}>
        <form id="module-form" onSubmit={saveModule}>
          <div className="field"><label className="field-label" htmlFor="module-title">Название</label><input id="module-title" name="title" className="field-control" value={modalTitle} onChange={(event) => setModalTitle(event.target.value)} maxLength={40} autoComplete="off" placeholder="Например, Путешествие" required /></div>
          <div className="field"><label className="field-label" htmlFor="module-description">Описание</label><textarea id="module-description" name="description" className="field-control" value={modalDescription} onChange={(event) => setModalDescription(event.target.value)} maxLength={150} rows={3} autoComplete="off" placeholder="Коротко опишите тему…" /></div>
        </form>
      </Modal>

      <Modal open={isModeModalOpen} title="Как будем заниматься?" onClose={() => setIsModeModalOpen(false)}>
        <div className="study-mode-list">
          <button type="button" onClick={() => chooseMode('cards', true)}><strong>Интервальное повторение</strong><span>Только карточки, которые пора повторить</span></button>
          <button type="button" onClick={() => chooseMode('cards')}><strong>Все карточки</strong><span>Пройти модуль по порядку</span></button>
          <button type="button" onClick={() => chooseMode('quiz')}><strong>Тест</strong><span>Выбрать правильный перевод</span></button>
          <button type="button" onClick={() => chooseMode('dictation')}><strong>Диктант</strong><span>Записать пиньинь на слух</span></button>
        </div>
      </Modal>
    </AppShell>
  );
}
