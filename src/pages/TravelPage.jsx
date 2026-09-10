import React, { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { Button, EmptyState, PageHeader, Panel, ProgressBar } from '../components/UI';
import AudioPlayer from '../components/AudioPlayer';
import { useToast } from '../components/ToastContext';

export default function TravelPage({ token, onBack }) {
  const { showToast } = useToast();
  const [packs, setPacks] = useState([]);
  const [active, setActive] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/travel-packs`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => { setPacks(data); setError(''); })
      .catch(() => { setError('Не удалось загрузить сценарии поездки.'); showToast('Не удалось загрузить сценарии поездки.', 'error'); })
      .finally(() => setLoading(false));
  }, [token, showToast]);

  const openPack = (pack) => { setActive(pack); setIndex(0); };
  const complete = async () => {
    const response = await fetch(`${API_BASE}/api/travel-packs/${active.id}/complete`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    const data = await response.json();
    if (!response.ok) return showToast(data.error || 'Не удалось сохранить сценарий.', 'error');
    setPacks(items => items.map(item => item.id === active.id ? { ...item, completed: true } : item));
    showToast('Сценарий завершён. Вы готовы к поездке!', 'success');
    setActive(null);
  };

  if (!active) return <main className="page-container travel-page"><PageHeader title="Перед поездкой" eyebrow="Китайский в пути · 行" onBack={onBack} /><p className="page-lead">Короткие фразы для самых частых ситуаций. Выберите сценарий и пройдите его за пару минут.</p>{loading ? <div className="dashboard-loading"><span className="loader" />Загружаем сценарии…</div> : error ? <div className="inline-alert" role="alert">{error}</div> : packs.length ? <div className="travel-grid">{packs.map(pack => <Panel key={pack.id} interactive className="travel-pack"><span className="travel-pack__mark">{pack.mark}</span><h2>{pack.title}</h2><p>{pack.description}</p><span>{pack.cards.length} фразы {pack.completed && '· пройдено'}</span><Button variant={pack.completed ? 'secondary' : 'primary'} onClick={() => openPack(pack)}>{pack.completed ? 'Повторить' : 'Начать'}</Button></Panel>)}</div> : <EmptyState title="Сценариев пока нет" description="Обновите страницу немного позже." />}</main>;

  const card = active.cards[index];
  const isLast = index === active.cards.length - 1;
  return <main className="page-container travel-page"><PageHeader title={active.title} eyebrow="Перед поездкой · 行" meta={`${index + 1} из ${active.cards.length}`} onBack={() => setActive(null)} /><ProgressBar value={((index + 1) / active.cards.length) * 100} label="Прогресс сценария" /><Panel className="travel-card"><span className="eyebrow">Скажите</span><div className="travel-card__hanzi">{card.characters}</div><AudioPlayer text={card.characters} /><strong>{card.pinyin}</strong><p>{card.translation}</p></Panel><div className="travel-actions"><Button variant="secondary" onClick={() => setIndex(value => Math.max(0, value - 1))} disabled={index === 0}>Назад</Button><Button variant="primary" onClick={() => isLast ? complete() : setIndex(value => value + 1)}>{isLast ? 'Завершить сценарий' : 'Дальше'}</Button></div></main>;
}
