import React from 'react';

const navigation = [
  ['today', 'Сегодня', '今'],
  ['modules', 'Модули', '书'],
  ['trainers', 'Тренажёры', '练']
];

export default function AppShell({ children }) {
  const scrollTo = (id) => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <div className="app-shell">
      <main id="main-content" className="app-shell__content">{children}</main>
      <nav className="mobile-nav" aria-label="Разделы главной страницы">
        {navigation.map(([id, label, mark]) => (
          <button key={id} type="button" onClick={() => scrollTo(id)}>
            <span aria-hidden="true">{mark}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
