# Техническое задание (ТЗ): Реализация iOS PWA Swipe-Back и адаптация под челку iPhone

Документ содержит исчерпывающее руководство, архитектуру и готовый рабочий код для реализации жеста возврата назад (Swipe-Back) и корректных отступов под статус-бар / челку (Dynamic Island / Notch) на iOS в режиме PWA (Standalone mode).

---

## 1. Проблемы и архитектурное решение

### 1.1. Отступы под челку iPhone (Safe Area Top)
В PWA-приложениях с мета-тегом `apple-mobile-web-app-status-bar-style: black-translucent` системная строка (часы, Wi-Fi, заряд) накладывается прямо поверх шапки веб-приложения.
- **Решение**: Использование правил `env(safe-area-inset-top)` с принудительными минимальными фолбэками (`max(68px, calc(28px + env(safe-area-inset-top, 44px)))`), чтобы кнопки шапки всегда находились строго ниже часов и динамического острова.

### 1.2. Жест Swipe-Back для iOS Safari / PWA
Обычные события React `onTouchStart` / `onTouchMove` регистрируются как пассивные на вложенных DOM-элементах. При горизонтальном свайпе пальцем встроенный скролл страницы браузера отменяет тач-событие (`touchcancel`), и свайп перестает работать.
- **Решение**:
  1. Подписка на глобальные события `window.addEventListener('touchmove', ..., { passive: false })`.
  2. Вызов `e.preventDefault()` при преобладании горизонтального движения (`deltaX > deltaY`), сдерживающий нативный скролл страницы.
  3. Плавный визуальный сдвиг содержимого страницы (`translate3d`) вслед за пальцем пользователя.
  4. Отображение плавающего индикатора `←` точно на высоте тача пользователя (`top: ${touchY}px`).

---

## 2. Готовый код компонента `SwipeBackHandler.jsx`

Создайте файл `src/components/SwipeBackHandler.jsx`:

```jsx
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from './Icons';

const TRIGGER_DISTANCE = 75; // Расстояние свайпа в px для срабатывания возврата
const MAX_VERTICAL_DEVIATION = 80; // Максимальное отклонение по вертикали в px

export default function SwipeBackHandler({ onBack, children, disabled = false }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [touchY, setTouchY] = useState(250);
  const [isSwiping, setIsSwiping] = useState(false);

  const activeRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const pullDistanceRef = useRef(0);
  const isSwipingRef = useRef(false);
  const hasVibratedRef = useRef(false);
  const onBackRef = useRef(onBack);

  useEffect(() => {
    onBackRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (disabled) return;

    const handleTouchStart = (e) => {
      if (!onBackRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;

      // Активация жеста при таче в зоне первых 90px от левого края (или 22% ширины экрана)
      const maxEdge = Math.min(90, window.innerWidth * 0.22);
      if (touch.clientX <= maxEdge) {
        activeRef.current = true;
        startPosRef.current = { x: touch.clientX, y: touch.clientY };
        pullDistanceRef.current = 0;
        isSwipingRef.current = false;
        hasVibratedRef.current = false;
        setTouchY(touch.clientY);
      }
    };

    const handleTouchMove = (e) => {
      if (!activeRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;

      const deltaX = touch.clientX - startPosRef.current.x;
      const deltaY = Math.abs(touch.clientY - startPosRef.current.y);

      // Если свайп идет резко по вертикали — отменяем жест
      if (deltaY > MAX_VERTICAL_DEVIATION && deltaX < TRIGGER_DISTANCE * 0.4) {
        activeRef.current = false;
        if (isSwipingRef.current) {
          isSwipingRef.current = false;
          setIsSwiping(false);
        }
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }

      if (deltaX > 0) {
        // Блокируем системный вертикальный скролл при горизонтальном свайпе
        if (e.cancelable && deltaX > deltaY) {
          e.preventDefault();
        }

        if (!isSwipingRef.current) {
          isSwipingRef.current = true;
          setIsSwiping(true);
        }

        pullDistanceRef.current = deltaX;
        setPullDistance(deltaX);
        setTouchY(touch.clientY);

        // Легкий тактильный отклик при достижении порога срабатывания
        if (deltaX >= TRIGGER_DISTANCE && !hasVibratedRef.current) {
          hasVibratedRef.current = true;
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            try { navigator.vibrate(14); } catch {}
          }
        } else if (deltaX < TRIGGER_DISTANCE) {
          hasVibratedRef.current = false;
        }
      }
    };

    const handleTouchEnd = () => {
      if (!activeRef.current) return;
      activeRef.current = false;

      const finalDistance = pullDistanceRef.current;
      if (finalDistance >= TRIGGER_DISTANCE && onBackRef.current) {
        onBackRef.current();
      }

      isSwipingRef.current = false;
      setIsSwiping(false);
      pullDistanceRef.current = 0;
      setPullDistance(0);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [disabled]);

  const progress = Math.min(1, pullDistance / TRIGGER_DISTANCE);
  const contentTranslateX = isSwiping ? Math.min(pullDistance * 0.4, 120) : 0;
  const indicatorTranslateX = Math.min(pullDistance * 0.5, 55);

  return (
    <div className="swipe-back-wrapper">
      <div
        className="swipe-back-content"
        style={{
          transform: `translate3d(${contentTranslateX}px, 0, 0)`,
          transition: isSwiping ? 'none' : 'transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1)',
          willChange: isSwiping ? 'transform' : 'auto',
        }}
      >
        {children}
      </div>

      {isSwiping && pullDistance > 5 && (
        <div
          className="swipe-back-indicator"
          style={{
            top: `${touchY}px`,
            transform: `translate3d(${indicatorTranslateX}px, -50%, 0) scale(${0.75 + progress * 0.35})`,
            opacity: Math.min(1, progress * 1.3),
          }}
          aria-hidden="true"
        >
          <div className={`swipe-back-pill ${progress >= 1 ? 'swipe-back-pill--ready' : ''}`}>
            <ArrowLeft size={22} />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 3. Стили CSS (`src/index.css`)

Добавьте следующие CSS-стили в ваш глобальный файл стилей:

```css
/* Безопасные отступы для шапок и страниц pod челку iPhone */
.page-header {
  position: sticky;
  top: max(56px, calc(16px + env(safe-area-inset-top, 44px)));
  z-index: 40;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 28px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: rgba(12, 16, 22, 0.9);
  box-shadow: 0 14px 44px rgba(0, 0, 0, 0.24);
  backdrop-filter: blur(16px);
}

@media (max-width: 720px) {
  .app-shell__content,
  .page-container {
    width: min(100% - 28px, 1180px);
    padding-top: max(68px, calc(28px + env(safe-area-inset-top, 44px)));
    padding-bottom: calc(92px + env(safe-area-inset-bottom, 0px));
  }

  .page-header {
    top: max(54px, calc(14px + env(safe-area-inset-top, 44px)));
    margin-bottom: 20px;
  }
}

/* Стили обертки и индикатора жеста Swipe-Back */
.swipe-back-wrapper {
  position: relative;
  min-height: 100vh;
  overflow-x: hidden;
}

.swipe-back-content {
  width: 100%;
  min-height: 100vh;
}

.swipe-back-indicator {
  position: fixed;
  left: 0;
  z-index: 9999;
  pointer-events: none;
  transition: transform 0.05s ease-out;
  will-change: transform, opacity;
}

.swipe-back-pill {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--line-strong);
  border-left: 0;
  border-radius: 0 22px 22px 0;
  background: rgba(22, 29, 39, 0.95);
  color: var(--paper);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45), 0 0 15px rgba(225, 91, 72, 0.2);
  backdrop-filter: blur(14px);
  transition: background-color 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.swipe-back-pill--ready {
  border-color: var(--cinnabar);
  background: rgba(225, 91, 72, 0.95);
  color: #ffffff;
  box-shadow: 0 10px 35px rgba(225, 91, 72, 0.5);
}
```

---

## 4. Интеграция в роутинг (`src/App.jsx`)

Оберните дочерние страницы (подстраницы), куда пользователь переходит с главного экрана:

```jsx
import SwipeBackHandler from './components/SwipeBackHandler';

// Функция оборачивания в Suspense и SwipeBackHandler
const withSuspense = (content, enableSwipeBack = true) => (
  <Suspense fallback={<PageLoader />}>
    {enableSwipeBack ? (
      <SwipeBackHandler onBack={handleBackToDashboard}>
        {content}
      </SwipeBackHandler>
    ) : (
      content
    )}
  </Suspense>
);

// Обычные страницы оборачиваем с жестом свайпа:
if (currentPage === 'manage') {
  return withSuspense(<ManageCardsPage token={token} onBack={handleBackToDashboard} />);
}

// Главную страницу оборачиваем БЕЗ свайпа:
return withSuspense(<DashboardPage ... />, false);
```

---

## 5. Проверка работы
1. **Сборка фронтенда**: `npm run build`
2. **Проверка под челкой**: На iPhone с Dynamic Island / Notch шапка опускается ниже системных часов.
3. **Проверка жеста**: Потяните пальцем от левого края экрана (первые 90px) вправо. Экран начнет плавно сдвигаться, появятся индикатор свайпа на высоте вашего пальца и тактильный отклик при перетягивании свыше 75px.
