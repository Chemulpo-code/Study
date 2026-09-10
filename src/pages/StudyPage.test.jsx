import React from 'react';
import { afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../components/Toast';
import StudyPage from './StudyPage';

const card = {
  id: 'card-1',
  characters: '学习',
  pinyin: 'xuéxí',
  translation: 'учиться',
  examples: []
};

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

test('flashcard flips with Enter and keeps its accessible button behavior', async () => {
  const user = userEvent.setup();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [card]
  }));

  render(
    <ToastProvider>
      <StudyPage token="token" moduleId="module-1" initialMode="cards" onBack={() => {}} />
    </ToastProvider>
  );

  const flashcard = await screen.findByRole('button', { name: 'Показать перевод' });
  flashcard.focus();
  await user.keyboard('{Enter}');

  await waitFor(() => expect(screen.getByText('учиться')).toBeVisible());
  expect(flashcard).toHaveAttribute('aria-label', 'Скрыть ответ');
});

test('keyboard use of the nested audio control does not flip the flashcard', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: true,
    json: async () => [card]
  }));

  render(
    <ToastProvider>
      <StudyPage token="token" moduleId="module-1" initialMode="cards" onBack={() => {}} />
    </ToastProvider>
  );

  const flashcard = await screen.findByRole('button', { name: 'Показать перевод' });
  const audioButton = screen.getByRole('button', { name: 'Нажмите для воспроизведения на обычной скорости' });
  fireEvent.keyDown(audioButton, { key: 'Enter' });

  expect(flashcard).toHaveAttribute('aria-label', 'Показать перевод');
});
