import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ToastProvider } from './components/Toast.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { sendErrorToWebhook } from './utils/errorNotifier.js';

// Глобальное логирование ошибок браузера
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    sendErrorToWebhook({
      error: event.error || event.message,
      stack: event.error?.stack || null,
      source: 'window.onerror',
      extraContext: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
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
