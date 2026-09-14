import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from './Icons';

const TRIGGER_DISTANCE = 75; // px horizontal pull distance needed to trigger back
const MAX_VERTICAL_DEVIATION = 80; // max Y deviation allowed before canceling

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

      // Allow swipe starting within left 22% of screen or max 90px
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

      // If vertical movement dominates early on, cancel swipe
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
        // Prevent native iOS page scroll bounce while horizontal swiping
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

        // Haptic feedback tick when reaching threshold
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
          transform: isSwiping ? `translate3d(${contentTranslateX}px, 0, 0)` : undefined,
          transition: isSwiping ? 'none' : undefined,
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
