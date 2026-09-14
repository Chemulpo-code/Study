import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft } from './Icons';

const EDGE_THRESHOLD = 70; // enlarged edge zone (70px from left edge)
const TRIGGER_DISTANCE = 80; // px horizontal drag needed to trigger onBack
const MAX_VERTICAL_DEVIATION = 70; // max allowed Y movement before canceling

export default function SwipeBackHandler({ onBack, children, disabled = false }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [touchY, setTouchY] = useState(250);
  const [isSwiping, setIsSwiping] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);
  const hasVibratedRef = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (disabled || !onBack) return;
    const touch = e.touches[0];
    if (touch && touch.clientX <= EDGE_THRESHOLD) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      setTouchY(touch.clientY);
      activeRef.current = true;
      hasVibratedRef.current = false;
    }
  }, [disabled, onBack]);

  const handleTouchMove = useCallback((e) => {
    if (!activeRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    // Cancel if movement is predominantly vertical before passing initial threshold
    if (deltaY > MAX_VERTICAL_DEVIATION && deltaX < TRIGGER_DISTANCE * 0.4) {
      activeRef.current = false;
      setIsSwiping(false);
      setPullDistance(0);
      return;
    }

    if (deltaX > 0) {
      if (!isSwiping) setIsSwiping(true);
      setPullDistance(deltaX);
      setTouchY(touch.clientY);

      // Light haptic tick when reaching trigger threshold
      if (deltaX >= TRIGGER_DISTANCE && !hasVibratedRef.current) {
        hasVibratedRef.current = true;
        if (navigator.vibrate) {
          try { navigator.vibrate(12); } catch {}
        }
      } else if (deltaX < TRIGGER_DISTANCE) {
        hasVibratedRef.current = false;
      }
    }
  }, [isSwiping]);

  const handleTouchEnd = useCallback(() => {
    if (!activeRef.current) return;
    activeRef.current = false;

    if (pullDistance >= TRIGGER_DISTANCE && onBack) {
      onBack();
    }

    setIsSwiping(false);
    setPullDistance(0);
  }, [pullDistance, onBack]);

  const progress = Math.min(1, pullDistance / TRIGGER_DISTANCE);
  const contentTranslateX = isSwiping ? Math.min(pullDistance * 0.35, 110) : 0;
  const indicatorTranslateX = Math.min(pullDistance * 0.5, 50);

  return (
    <div
      className="swipe-back-wrapper"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
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

      {isSwiping && pullDistance > 6 && (
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
