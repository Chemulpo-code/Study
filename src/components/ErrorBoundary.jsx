import React from 'react';
import { sendErrorToWebhook } from '../utils/errorNotifier';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    sendErrorToWebhook({
      error,
      stack: error?.stack,
      source: 'react-error-boundary',
      componentStack: errorInfo?.componentStack,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: 'var(--ink, #0c1016)',
            color: 'var(--paper, #f0e7d8)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              padding: '36px 28px',
              borderRadius: '24px',
              background: 'linear-gradient(145deg, rgba(29, 38, 50, 0.95), rgba(19, 26, 35, 0.98))',
              border: '1px solid rgba(225, 91, 72, 0.3)',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '3.2rem', marginBottom: '16px' }}>⚠️</div>
            <h2
              style={{
                fontSize: '1.5rem',
                margin: '0 0 12px 0',
                color: 'var(--cinnabar, #e15b48)',
              }}
            >
              Упс! Произошла ошибка
            </h2>
            <p
              style={{
                color: 'var(--paper-muted, #a7afba)',
                fontSize: '0.95rem',
                lineHeight: '1.6',
                marginBottom: '24px',
              }}
            >
              Информация об этой проблеме уже автоматически отправлена разработчикам. Нажмите кнопку ниже, чтобы перезагрузить приложение.
            </p>
            {this.state.error && (
              <pre
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  color: '#ff668c',
                  textAlign: 'left',
                  overflowX: 'auto',
                  maxHeight: '120px',
                  marginBottom: '24px',
                }}
              >
                {this.state.error.message || String(this.state.error)}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={this.handleReset}
                className="btn-neon btn-secondary"
                style={{ padding: '10px 20px', fontWeight: '600' }}
              >
                Попробовать снова
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="btn-neon btn-cyan"
                style={{ padding: '10px 24px', fontWeight: '600' }}
              >
                Перезагрузить страницу
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
