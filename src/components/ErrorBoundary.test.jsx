import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

function ProblemChild() {
  throw new Error('Test Component Crash');
}

describe('ErrorBoundary', () => {
  it('renders fallback UI when child component throws error', () => {
    // Suppress React console.error during expected error boundary test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/Упс! Произошла ошибка/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Component Crash/i)).toBeInTheDocument();

    consoleSpy.mockRestore();
  });
});
