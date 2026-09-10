import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, EmptyState, ProgressBar } from './UI';

test('Button remains a native keyboard-accessible action', async () => {
  const user = userEvent.setup();
  let clicks = 0;

  render(<Button onClick={() => { clicks += 1; }}>Продолжить</Button>);
  await user.tab();
  await user.keyboard('{Enter}');

  expect(clicks).toBe(1);
  expect(screen.getByRole('button', { name: 'Продолжить' })).toHaveFocus();
});

test('ProgressBar exposes a clamped accessible value', () => {
  render(<ProgressBar value={140} label="Прогресс модуля" />);

  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
});

test('EmptyState exposes its title and primary action', () => {
  render(<EmptyState title="Модулей пока нет" action={<Button>Создать модуль</Button>} />);

  expect(screen.getByRole('heading', { name: 'Модулей пока нет' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Создать модуль' })).toBeInTheDocument();
});

