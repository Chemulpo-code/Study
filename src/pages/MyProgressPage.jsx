import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE } from '../config';
import { Button, EmptyState, PageHeader, Panel, ProgressBar } from '../components/UI';
import { useToast } from '../components/ToastContext';

const achievementMarks = { 'first-card': '一', 'streak-7': '七', 'learned-100': '百', 'daily-plan': '今', 'travel-ready': '行' };

function urlBase64ToUint8Array(value) {
  const padding = '='.repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
}

export default function MyProgressPage({ token, modules, onBack, onManageModule, onOpenTravel }) {
  const { showToast } = useToast();
  const [summary, setSummary] = useState(null);
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({ moduleId: '', status: '', favoriteOnly: false });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [permission, setPermission] = useState(() => typeof Notification === 'undefined' ? 'unsupported' : Notification.permission);

  const auth = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/my-progress`, { headers: auth });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось загрузить прогресс.');
      setSummary(data);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [auth, showToast]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ q: query });
        if (filters.moduleId) params.set('moduleId', filters.moduleId);
        if (filters.status) params.set('status', filters.status);
        if (filters.favoriteOnly) params.set('favorite', 'true');
        const response = await fetch(`${API_BASE}/api/cards/search?${params}`, { headers: auth });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Поиск недоступен.');
        setResults(data.results || []);
        setSearchError('');
      } catch (error) {
        setSearchError(error.message);
        showToast(error.message, 'error');
      } finally {
        setSearching(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query, filters, auth, showToast]);

  const toggleFavorite = async (card) => {
    const response = await fetch(`${API_BASE}/api/cards/${card.id}/favorite`, { method: 'POST', headers: auth });
    const data = await response.json();
    if (!response.ok) return showToast(data.error || 'Не удалось обновить избранное.', 'error');
    setResults(items => items.map(item => item.id === card.id ? { ...item, favorite: data.favorite } : item));
    loadSummary();
  };

  const saveSettings = async (next) => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/push/settings`, { method: 'PUT', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось сохранить настройки.');
      setSummary(current => ({ ...current, notificationSettings: data.settings, pushConfigured: data.configured }));
      return data;
    } catch (error) {
      showToast(error.message, 'error');
      return null;
    } finally { setSaving(false); }
  };

  const enablePush = async () => {
    if (!summary?.pushConfigured) return showToast('На сервере пока не заданы VAPID-ключи.', 'warning');
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return showToast('Этот браузер не поддерживает push-уведомления.', 'warning');
    try {
      const nextPermission = await Notification.requestPermission();
      setPermission(nextPermission);
      if (nextPermission !== 'granted') return showToast('Разрешение на уведомления не получено.', 'warning');
      const configResponse = await fetch(`${API_BASE}/api/push/config`, { headers: auth });
      const config = await configResponse.json();
      if (!configResponse.ok || !config.publicKey) throw new Error('Push пока не настроен на сервере.');
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(config.publicKey) });
      const response = await fetch(`${API_BASE}/api/push/subscribe`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось подключить push.');
      await saveSettings({ enabled: true, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      showToast('Напоминания подключены.', 'success');
    } catch (error) {
      showToast(error.message || 'Не удалось подключить push.', 'error');
    }
  };

  if (loading) return <div className="page-loader" role="status"><span className="loader" />Загружаем прогресс…</div>;
  const plan = summary?.plan || { cardsAnswered: 0, cardsRemaining: 10, trainerCompleted: false, complete: false };

  return <main className="page-container progress-page">
    <PageHeader title="Мой прогресс" eyebrow="Ритм обучения · 进度" onBack={onBack} actions={<Button variant="secondary" size="sm" onClick={onOpenTravel}>Перед поездкой</Button>} />
    <Panel className="daily-plan">
      <div><span className="eyebrow">Сегодня</span><h2>{plan.complete ? 'План выполнен. Отличная работа.' : 'Небольшой шаг — каждый день.'}</h2><p>{plan.cardsRemaining ? `Осталось ${plan.cardsRemaining} карточек.` : 'Карточки завершены.'} {plan.trainerCompleted ? 'Тренажёр пройден.' : 'Остался один тренажёр.'}</p></div>
      <div className="daily-plan__metrics"><strong>{plan.cardsAnswered}/10</strong><span>Карточки</span><strong>{plan.trainerCompleted ? '✓' : '—'}</strong><span>Тренажёр</span></div>
      <ProgressBar value={(plan.cardsAnswered / 10) * 70 + (plan.trainerCompleted ? 30 : 0)} label="План на сегодня" />
    </Panel>

    <section className="progress-section"><div className="section-heading"><div><span className="eyebrow">Найти нужное</span><h2>Поиск слов</h2></div></div>
      <div className="search-controls"><input className="field-control" value={query} onChange={event => setQuery(event.target.value)} placeholder="Иероглифы, пиньинь или перевод" aria-label="Поиск по карточкам" /><select className="field-control" value={filters.moduleId} onChange={event => setFilters(value => ({ ...value, moduleId: event.target.value }))} aria-label="Модуль"><option value="">Все модули</option>{modules.map(module => <option key={module.id} value={module.id}>{module.title}</option>)}</select><select className="field-control" value={filters.status} onChange={event => setFilters(value => ({ ...value, status: event.target.value }))} aria-label="Статус"><option value="">Все статусы</option><option value="new">Новые</option><option value="know">Изученные</option><option value="dont_know">Повторить</option></select><label className="checkbox-field"><input type="checkbox" checked={filters.favoriteOnly} onChange={event => setFilters(value => ({ ...value, favoriteOnly: event.target.checked }))} /> Только избранное</label></div>
      <div className="search-results">{searching && <div className="dashboard-loading"><span className="loader" />Ищем карточки…</div>}{searchError && <div className="inline-alert" role="alert">{searchError}</div>}{!searching && !searchError && results.map(card => <Panel key={card.id} as="article" className="search-card"><div><strong className="search-card__hanzi">{card.characters}</strong><span>{card.pinyin}</span><p>{card.translation}</p><small>{card.moduleTitle}</small></div><div className="search-card__actions"><Button variant={card.favorite ? 'primary' : 'secondary'} size="sm" onClick={() => toggleFavorite(card)} aria-label={card.favorite ? 'Убрать из избранного' : 'Добавить в избранное'}>{card.favorite ? '★' : '☆'}</Button><Button variant="ghost" size="sm" onClick={() => onManageModule(card.moduleId)}>Открыть</Button></div></Panel>)}{!searching && !searchError && !results.length && <EmptyState title="Карточек не найдено" description="Измените запрос или фильтры." />}</div>
    </section>

    <section className="progress-section"><div className="section-heading"><div><span className="eyebrow">Дорога вперёд</span><h2>Достижения</h2></div></div><div className="achievement-grid">{summary?.catalog?.map(item => { const unlocked = summary.achievements?.some(value => value.id === item.id); return <Panel key={item.id} className={`achievement ${unlocked ? 'achievement--unlocked' : ''}`}><span className="achievement__mark">{achievementMarks[item.id]}</span><strong>{item.title}</strong><p>{item.description}</p></Panel>; })}</div></section>

    <section className="progress-section"><div className="section-heading"><div><span className="eyebrow">Ритм</span><h2>Напоминания</h2></div></div><Panel className="notification-settings"><div><strong>Ежедневное напоминание</strong><p>{summary?.pushConfigured ? 'Пришлём только если план ещё не выполнен.' : 'Добавьте VAPID-ключи в Portainer, чтобы включить push.'} {permission === 'granted' ? 'Браузер разрешил уведомления.' : permission === 'denied' ? 'Браузер заблокировал уведомления — разрешите их в настройках сайта.' : permission === 'unsupported' ? 'Этот браузер не поддерживает push.' : 'Разрешение браузера ещё не запрошено.'}</p></div><label>Время <input className="field-control" type="time" value={summary?.notificationSettings?.time || '20:00'} onChange={event => saveSettings({ time: event.target.value })} disabled={saving} /></label><Button variant="primary" onClick={enablePush} disabled={saving || summary?.notificationSettings?.enabled || permission === 'unsupported'}>{summary?.notificationSettings?.enabled ? 'Подключено' : 'Включить push'}</Button></Panel></section>
  </main>;
}
