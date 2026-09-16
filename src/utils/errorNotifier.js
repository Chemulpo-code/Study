export const ERROR_WEBHOOK_URL = 'https://n8n.crm-toolkits.ru/webhook/b748381d-60f6-47cc-84e6-d9d39774a2f7';

// Множество зафиксированных сообщений для предотвращения дубликатов/спама
const reportedErrors = new Set();

export async function sendErrorToWebhook({ error, stack, source = 'frontend', componentStack = null, extraContext = {} }) {
  try {
    const errorMessage = typeof error === 'string' ? error : (error?.message || 'Неизвестная ошибка');
    const errorStack = stack || error?.stack || null;
    const dedupeKey = `${errorMessage}:${errorStack?.slice(0, 100) || ''}`;

    // Предотвращение дублирования одной и той же ошибки в течение сессии
    if (reportedErrors.has(dedupeKey)) {
      return { skipped: true };
    }
    reportedErrors.add(dedupeKey);

    const payload = {
      service: 'chinese-study',
      source,
      error: errorMessage,
      stack: errorStack,
      componentStack: componentStack || null,
      context: {
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString(),
        ...extraContext,
      },
    };

    const response = await fetch(ERROR_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return { status: response.status, ok: response.ok };
  } catch (err) {
    console.error('Не удалось отправить уведомление об ошибке на вебхук:', err);
    return { status: 0, ok: false, error: err };
  }
}
