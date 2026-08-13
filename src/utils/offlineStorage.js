// Вспомогательный модуль для локального кеширования данных и офлайн-синхронизации
import { API_BASE } from '../config';

const CACHE_KEYS = {
  MODULES: 'study_offline_modules',
  CARDS_PREFIX: 'study_offline_cards_',
  STATS: 'study_offline_stats',
  QUEUE: 'study_offline_progress_queue'
};

// Сохранение модулей в локальный кэш
export function cacheModulesLocally(modules) {
  try {
    if (Array.isArray(modules)) {
      localStorage.setItem(CACHE_KEYS.MODULES, JSON.stringify(modules));
    }
  } catch (e) {
    console.error('Ошибка сохранения модулей в кэш:', e);
  }
}

// Получение модулей из локального кэша
export function getCachedModulesLocally() {
  try {
    const data = localStorage.getItem(CACHE_KEYS.MODULES);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// Сохранение карточек конкретного модуля в локальный кэш
export function cacheCardsLocally(moduleId, cards) {
  try {
    if (moduleId && Array.isArray(cards)) {
      localStorage.setItem(`${CACHE_KEYS.CARDS_PREFIX}${moduleId}`, JSON.stringify(cards));
    }
  } catch (e) {
    console.error('Ошибка сохранения карточек в кэш:', e);
  }
}

// Получение карточек из локального кэша
export function getCachedCardsLocally(moduleId) {
  try {
    if (!moduleId) return [];
    const data = localStorage.getItem(`${CACHE_KEYS.CARDS_PREFIX}${moduleId}`);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

// Сохранение прогресса в офлайн-очередь
export function queueOfflineProgress(cardId, status, moduleId) {
  try {
    const queueData = localStorage.getItem(CACHE_KEYS.QUEUE);
    const queue = queueData ? JSON.parse(queueData) : [];
    
    // Добавляем или обновляем статус карточки в очереди
    const existingIndex = queue.findIndex(item => item.cardId === cardId);
    if (existingIndex >= 0) {
      queue[existingIndex] = { cardId, status, timestamp: Date.now() };
    } else {
      queue.push({ cardId, status, timestamp: Date.now() });
    }

    localStorage.setItem(CACHE_KEYS.QUEUE, JSON.stringify(queue));

    // Также мгновенно обновляем локальный статус карточки в кеше
    if (moduleId) {
      const cachedCards = getCachedCardsLocally(moduleId);
      const updatedCards = cachedCards.map(c => {
        if (c.id === cardId) {
          return { ...c, status, box: status === 'know' ? Math.min(5, (c.box || 1) + 1) : 1 };
        }
        return c;
      });
      cacheCardsLocally(moduleId, updatedCards);
    }
  } catch (e) {
    console.error('Ошибка добавления в офлайн-очередь:', e);
  }
}

// Получение количества неотправленных записей
export function getOfflineQueueCount() {
  try {
    const queueData = localStorage.getItem(CACHE_KEYS.QUEUE);
    const queue = queueData ? JSON.parse(queueData) : [];
    return queue.length;
  } catch (e) {
    return 0;
  }
}

// Пакетная отправка неотправленного прогресса на сервер
export async function syncOfflineProgressBatch(token, showToast) {
  try {
    const queueData = localStorage.getItem(CACHE_KEYS.QUEUE);
    const queue = queueData ? JSON.parse(queueData) : [];

    if (!queue || queue.length === 0) return 0;

    const response = await fetch(`${API_BASE}/api/progress/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ batch: queue })
    });

    if (response.ok) {
      localStorage.removeItem(CACHE_KEYS.QUEUE);
      if (showToast) {
        showToast(`Офлайн-прогресс (${queue.length} записей) синхронизирован с сервером! 📶⚡`, 'success');
      }
      return queue.length;
    }
    return 0;
  } catch (e) {
    console.error('Ошибка синхронизации офлайн-прогресса:', e);
    return 0;
  }
}
