import React, { useState, useRef, useCallback } from 'react';
import { ArrowLeft } from './Icons';

const EDGE_THRESHOLD = 35; // px from left edge to activate gesture
const TRIGGER_DISTANCE = 75; // px horizontal drag needed to trigger onBack
const MAX_VERTICAL_DEVIATION = 60; // max allowed Y movement before canceling

export default function SwipeBackHandler({ onBack, children, disabled = false }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const touchStartRef = useRef({ x: 0, y: 0 });
  const activeRef = useRef(false);

  const handleTouchStart = useCallback((e) => {
    if (disabled || !onBack) return;
    const touch = e.touches[0];
    if (touch && touch.clientX <= EDGE_THRESHOLD) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      activeRef.current = true;
    }
  }, [disabled, onBack]);

  const handleTouchMove = useCallback((e) => {
    if (!activeRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (deltaY > MAX_VERTICAL_DEVIATION && deltaX < TRIGGER_DISTANCE * 0.5) {
      activeRef.current = false;
      setIsSwiping(false);
      setPullDistance(0);
      return;
    }

    if (deltaX > 0) {
      if (!isSwiping) setIsSwiping(true);
      setPullDistance(deltaX);
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
  const indicatorTranslate = Math.min(pullDistance * 0.45, 45);

  return (
    <div
      className="swipe-back-wrapper"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {children}

      {isSwiping && pullDistance > 5 && (
        <div
          className="swipe-back-indicator"
          style={{
            transform: `translate3d(${indicatorTranslate}px, -50%, 0) scale(${0.7 + progress * 0.3})`,
            opacity: Math.min(1, progress * 1.2),
          }}
          aria-hidden="true"
        >
          <div className={`swipe-back-pill ${progress >= 1 ? 'swipe-back-pill--ready' : ''}`}>
            <ArrowLeft size={20} />
          </div>
        </div>
      )}
    </div>
  );
}
