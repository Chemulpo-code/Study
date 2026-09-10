import React, { useEffect, useRef } from 'react';
import { X } from './Icons';
import { Button, Panel } from './UI';

const focusableSelector = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export default function Modal({ open, title, onClose, returnFocusRef, children, footer, className = '' }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const titleId = `dialog-${title.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-')}`;

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    const returnTarget = returnFocusRef?.current || document.activeElement;
    document.body.style.overflow = 'hidden';
    const dialog = dialogRef.current;
    const first = dialog?.querySelector(focusableSelector);
    first?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialog) return;

      const items = [...dialog.querySelectorAll(focusableSelector)];
      if (!items.length) return;
      const firstItem = items[0];
      const lastItem = items.at(-1);
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      returnTarget?.focus();
    };
  }, [open, returnFocusRef]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onCloseRef.current()}>
      <Panel ref={dialogRef} as="div" className={`modal ${className}`.trim()} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__header">
          <div>
            <span className="eyebrow">Настройка</span>
            <h2 id={titleId}>{title}</h2>
          </div>
          <Button variant="ghost" size="sm" iconOnly onClick={onClose} aria-label="Закрыть окно">
            <X size={19} aria-hidden="true" />
          </Button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__footer">{footer}</div>}
      </Panel>
    </div>
  );
}
