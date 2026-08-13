import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from './Icons';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'info') => {
    if (!message) return;
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    
    setToasts(prev => [...prev, { id, message, type }]);

    // Автоматическое удаление через 3.5 секунды
    setTimeout(() => {
      removeToast(id);
    }, 3500);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Контейнер уведомлений Toast */}
      <div style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '90vw',
        width: '380px',
        pointerEvents: 'none'
      }}>
        {toasts.map(toast => {
          let bg = 'rgba(17, 25, 40, 0.9)';
          let border = '1px solid var(--neon-cyan)';
          let iconColor = 'var(--neon-cyan)';
          let glow = '0 8px 24px rgba(0, 242, 254, 0.3)';
          let IconComp = Info;

          if (toast.type === 'error') {
            border = '1px solid rgba(255, 51, 102, 0.6)';
            iconColor = '#ff668c';
            glow = '0 8px 24px rgba(255, 51, 102, 0.35)';
            IconComp = AlertCircle;
          } else if (toast.type === 'success') {
            border = '1px solid rgba(0, 255, 136, 0.6)';
            iconColor = 'var(--neon-green)';
            glow = '0 8px 24px rgba(0, 255, 136, 0.35)';
            IconComp = CheckCircle;
          } else if (toast.type === 'warning') {
            border = '1px solid rgba(255, 204, 0, 0.6)';
            iconColor = '#ffcc00';
            glow = '0 8px 24px rgba(255, 204, 0, 0.35)';
            IconComp = AlertTriangle;
          }

          return (
            <div
              key={toast.id}
              className="toast-item"
              style={{
                pointerEvents: 'auto',
                background: bg,
                border,
                boxShadow: glow,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                color: '#fff',
                padding: '14px 18px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                fontSize: '0.9rem',
                animation: 'toastSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <IconComp size={20} style={{ color: iconColor, flexShrink: 0 }} />
                <span style={{ lineHeight: '1.4', fontWeight: '500' }}>{toast.message}</span>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  transition: 'color 0.2s'
                }}
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Безопасный фоллбэк на случай вызова вне провайдера
    return { showToast: (msg) => console.log('Toast:', msg) };
  }
  return context;
}
