import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ToastProvider } from './components/Toast.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { sendErrorToWebhook } from './utils/errorNotifier.js';

// Глобальное логирование ошибок браузера и авто-восстановление PWA
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const errorMsg = String(event.error?.message || event.message || '');
    const isChunkError = 
      errorMsg.includes('Importing a module script failed') ||
      errorMsg.includes('Failed to fetch dynamically imported module') ||
      errorMsg.includes('Unexpected token \'<\'') ||
      errorMsg.includes('Loading chunk');

    if (isChunkError) {
      console.warn('Обнаружена рассогласованность бандлов PWA. Перезагрузка...');
      if (!sessionStorage.getItem('chunk_reload_done')) {
        sessionStorage.setItem('chunk_reload_done', '1');
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistrations().then(regs => {
            Promise.all(regs.map(r => r.unregister())).then(() => {
              window.location.reload(true);
            });
          });
        } else {
          window.location.reload(true);
        }
        return;
      }
    }

    sendErrorToWebhook({
      error: event.error || event.message,
      stack: event.error?.stack || null,
      source: 'window.onerror',
      extraContext: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const errorMsg = String(event.reason?.message || event.reason || '');
    if (errorMsg.includes('Failed to fetch dynamically imported module')) {
      if (!sessionStorage.getItem('chunk_reload_done')) {
        sessionStorage.setItem('chunk_reload_done', '1');
        window.location.reload(true);
        return;
      }
    }

    sendErrorToWebhook({
      error: event.reason || 'Unhandled Promise Rejection',
      stack: event.reason?.stack || null,
      source: 'window.unhandledrejection',
    });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>
);
