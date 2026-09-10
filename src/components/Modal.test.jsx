import React, { useRef, useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Modal from './Modal';

function Fixture() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen(true)}>Открыть</button>
      <Modal open={open} title="Новый модуль" onClose={() => setOpen(false)} returnFocusRef={triggerRef}>
        <button>Сохранить</button>
      </Modal>
    </>
  );
}

test('Modal closes on Escape and returns focus to its trigger', async () => {
  const user = userEvent.setup();
  render(<Fixture />);

  await user.click(screen.getByRole('button', { name: 'Открыть' }));
  expect(screen.getByRole('dialog', { name: 'Новый модуль' })).toBeInTheDocument();

  await user.keyboard('{Escape}');
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Открыть' })).toHaveFocus();
});

test('Modal keeps tab focus inside the dialog', async () => {
  const user = userEvent.setup();
  render(<Fixture />);
  await user.click(screen.getByRole('button', { name: 'Открыть' }));

  const close = screen.getByRole('button', { name: 'Закрыть окно' });
  const save = screen.getByRole('button', { name: 'Сохранить' });
  save.focus();
  await user.tab();

  expect(close).toHaveFocus();
});
