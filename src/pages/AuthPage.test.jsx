import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import AuthPage from './AuthPage';

describe('AuthPage landing', () => {
  test('opens the real login form from the landing navigation', async () => {
    const user = userEvent.setup();
    render(<AuthPage onLoginSuccess={vi.fn()} />);

    expect(screen.getByRole('heading', { name: /Заговори.*китайском/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Войти' }));

    expect(screen.getByRole('heading', { name: 'С возвращением!' })).toBeInTheDocument();
    expect(screen.getByLabelText('Имя пользователя')).toHaveAttribute('autocomplete', 'username');
  });
});
