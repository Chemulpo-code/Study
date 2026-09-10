import React from 'react';
import { BookOpen, Edit, RefreshCw, Trash } from './Icons';
import { Button, Panel, ProgressBar } from './UI';

export function TodayPanel({ module, onContinue, onCreate }) {
  return (
    <Panel className="today-panel" id="today">
      <div className="today-panel__copy">
        <span className="eyebrow">Сегодня · 今日</span>
        <h1>{module ? 'Продолжите с того места, где остановились.' : 'Начните первую короткую практику.'}</h1>
        <p>{module ? `${module.title} · ${module.totalCards} карточек · ${module.learnedPercentage || 0}% изучено` : 'Создайте модуль — достаточно нескольких слов, чтобы начать.'}</p>
        <Button variant="primary" size="lg" onClick={module ? () => onContinue(module.id) : onCreate}>
          <BookOpen size={18} aria-hidden="true" />
          {module ? 'Продолжить занятие' : 'Создать первый модуль'}
        </Button>
      </div>
      <div className="today-panel__path" aria-hidden="true">
        <span>温</span><i /><span>故</span><i /><span>知</span><i /><span>新</span>
      </div>
    </Panel>
  );
}

export function StatsStrip({ progress, modules, cards, streak }) {
  const items = [
    ['Освоено', `${progress}%`],
    ['Модулей', modules],
    ['Карточек', cards],
    ['Серия', `${streak || 0} дн.`]
  ];
  return (
    <section className="stats-strip" aria-label="Статистика обучения">
      {items.map(([label, value]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
    </section>
  );
}

export function ModuleCard({ module, onLearn, onManage, onEdit, onReset, onDelete }) {
  const isVirtual = module.id === 'error-box';
  return (
    <Panel as="article" className="module-card">
      <div className="module-card__top">
        <div className="module-card__mark" aria-hidden="true">{isVirtual ? '错' : '书'}</div>
        {!isVirtual && (
          <details className="module-menu">
            <summary aria-label={`Действия модуля ${module.title}`}>•••</summary>
            <div className="module-menu__items">
              <button type="button" onClick={() => onEdit(module)}><Edit size={15} aria-hidden="true" />Редактировать</button>
              <button type="button" onClick={() => onReset(module.id, module.title)}><RefreshCw size={15} aria-hidden="true" />Сбросить прогресс</button>
              <button type="button" className="is-danger" onClick={() => onDelete(module.id, module.title)}><Trash size={15} aria-hidden="true" />Удалить</button>
            </div>
          </details>
        )}
      </div>
      <div className="module-card__copy">
        <h3>{module.title}</h3>
        <p>{module.description || (isVirtual ? 'Карточки, которым стоит уделить внимание.' : 'Описание пока не добавлено.')}</p>
      </div>
      <div className="module-card__progress">
        <div><span>{module.totalCards || 0} карточек</span><strong>{module.learnedPercentage || 0}%</strong></div>
        <ProgressBar value={module.learnedPercentage} label={`Прогресс модуля ${module.title}`} />
      </div>
      <div className="module-card__actions">
        <Button variant="primary" onClick={() => onLearn(module.id)} disabled={!module.totalCards}>Учить</Button>
        {!isVirtual && <Button variant="secondary" onClick={() => onManage(module.id)}>Слова</Button>}
      </div>
    </Panel>
  );
}

export function TrainerGrid({ trainers }) {
  const groups = ['Произношение', 'Слова', 'Предложения', 'Игры'];
  return (
    <div className="trainer-groups">
      {groups.map((group) => (
        <section key={group} className="trainer-group">
          <h3>{group}</h3>
          <div className="trainer-grid">
            {trainers.filter((trainer) => trainer.group === group).map((trainer) => (
              <button type="button" className="trainer-card" key={trainer.title} onClick={trainer.onClick}>
                <span className="trainer-card__mark" aria-hidden="true">{trainer.mark}</span>
                <span><strong>{trainer.title}</strong><small>{trainer.description}</small></span>
                <b aria-hidden="true">→</b>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
