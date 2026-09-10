import React from 'react';
import { ArrowLeft } from './Icons';

export function Button({ variant = 'secondary', size = 'md', iconOnly = false, className = '', children, ...props }) {
  return (
    <button
      className={`ui-button ui-button--${variant} ui-button--${size}${iconOnly ? ' ui-button--icon' : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function Panel({ as: Component = 'section', interactive = false, className = '', children, ...props }) {
  return (
    <Component className={`ui-panel${interactive ? ' ui-panel--interactive' : ''} ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}

export function ProgressBar({ value = 0, label = 'Прогресс', className = '' }) {
  const safeValue = Math.min(100, Math.max(0, Number(value) || 0));

  return (
    <div className={`progress ${className}`.trim()}>
      <div className="progress__track" role="progressbar" aria-label={label} aria-valuemin="0" aria-valuemax="100" aria-valuenow={safeValue}>
        <span className="progress__value" style={{ width: `${safeValue}%` }} />
      </div>
    </div>
  );
}

export function EmptyState({ eyebrow = 'Начало пути', title, description, action }) {
  return (
    <Panel className="empty-state">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </Panel>
  );
}

export function PageHeader({ title, eyebrow, meta, onBack, actions, className = '' }) {
  return (
    <header className={`page-header ${className}`.trim()}>
      <div className="page-header__main">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack} aria-label="Вернуться назад">
            <ArrowLeft size={17} aria-hidden="true" />
            <span>Назад</span>
          </Button>
        )}
        <div className="page-header__title">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
        </div>
      </div>
      {(meta || actions) && (
        <div className="page-header__aside">
          {meta && <span className="page-header__meta">{meta}</span>}
          {actions}
        </div>
      )}
    </header>
  );
}

