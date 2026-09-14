import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SwipeBackHandler from './SwipeBackHandler';

describe('SwipeBackHandler', () => {
  it('renders children correctly', () => {
    const { getByText, container } = render(
      <SwipeBackHandler onBack={() => {}}>
        <div>Page Content</div>
      </SwipeBackHandler>
    );
    expect(getByText('Page Content')).toBeInTheDocument();
    expect(container.querySelector('.swipe-back-content').style.transform).toBe('');
  });

  it('triggers onBack when swiping right from left edge past trigger distance', () => {
    const handleBack = vi.fn();
    render(
      <SwipeBackHandler onBack={handleBack}>
        <div>Page Content</div>
      </SwipeBackHandler>
    );

    act(() => {
      window.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 20, clientY: 200 }],
        })
      );
    });

    act(() => {
      window.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 120, clientY: 205 }],
          cancelable: true,
        })
      );
    });

    act(() => {
      window.dispatchEvent(new TouchEvent('touchend', {}));
    });

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('does NOT trigger onBack if touch starts beyond left edge threshold', () => {
    const handleBack = vi.fn();
    render(
      <SwipeBackHandler onBack={handleBack}>
        <div>Page Content</div>
      </SwipeBackHandler>
    );

    act(() => {
      window.dispatchEvent(
        new TouchEvent('touchstart', {
          touches: [{ clientX: 200, clientY: 200 }],
        })
      );
    });

    act(() => {
      window.dispatchEvent(
        new TouchEvent('touchmove', {
          touches: [{ clientX: 300, clientY: 200 }],
          cancelable: true,
        })
      );
    });

    act(() => {
      window.dispatchEvent(new TouchEvent('touchend', {}));
    });

    expect(handleBack).not.toHaveBeenCalled();
  });
});
