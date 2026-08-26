import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_FILE = path.join(DB_DIR, 'db.json');
const LEGACY_DB_FILE = path.join(__dirname, 'db.json');

// Глобальный кэш данных в оперативной памяти
let dataCache = {
  users: [],
  modules: [],
  cards: [],
  progress: []
};

// Загрузка базы данных при запуске
function initDb() {
  try {
    // Автоматический перенос старой базы в персистентный Docker Volume
    if (!fs.existsSync(DB_FILE) && fs.existsSync(LEGACY_DB_FILE)) {
      try {
        fs.copyFileSync(LEGACY_DB_FILE, DB_FILE);
      } catch (e) {}
    }

    if (fs.existsSync(DB_FILE)) {
      const fileData = fs.readFileSync(DB_FILE, 'utf8');
      dataCache = JSON.parse(fileData);
    } else {
      saveDb();
    }
  } catch (error) {
    console.error('Ошибка при инициализации базы данных, создаем пустую БД:', error);
    saveDb();
  }
}

// Атомарное сохранение базы данных на диск
function saveDb() {
  const tempPath = `${DB_FILE}.tmp`;
  try {
    fs.writeFileSync(tempPath, JSON.stringify(dataCache, null, 2), 'utf8');
    fs.renameSync(tempPath, DB_FILE);
  } catch (error) {
    console.error('Ошибка при записи базы данных на диск:', error);
    if (fs.existsSync(tempPath)) {
      fs.unlinkSync(tempPath);
    }
  }
}

// Запуск инициализации сразу при импорте модуля
initDb();

const db = {
  // --- Пользователи ---
  createUser(username, passwordHash) {
    const user = {
      id: crypto.randomUUID(),
      username,
      passwordHash,
      streak: 0,
      lastActiveDate: ''
    };
    dataCache.users.push(user);
    saveDb();
    return user;
  },

  getUserByUsername(username) {
    return dataCache.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  },

  getUserById(id) {
    return dataCache.users.find(u => u.id === id);
  },

  checkAndUpdateStreak(userId) {
    const user = dataCache.users.find(u => u.id === userId);
    if (!user) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastActive = user.lastActiveDate;

    if (user.streak === undefined) user.streak = 0;
    if (user.lastActiveDate === undefined) user.lastActiveDate = '';

    if (!lastActive) {
      user.streak = 0;
      return user;
    }

    if (lastActive === todayStr) {
      return user;
    }

    const lastDate = new Date(lastActive);
    const todayDate = new Date(todayStr);
    const diffTime = Math.abs(todayDate - lastDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      user.streak = 0;
      saveDb();
    }
    return user;
  },

  updateUserStreak(userId) {
    const user = dataCache.users.find(u => u.id === userId);
    if (!user) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastActive = user.lastActiveDate;

    if (user.streak === undefined) user.streak = 0;
    if (user.lastActiveDate === undefined) user.lastActiveDate = '';

    if (lastActive === todayStr) {
      return user;
    }

    if (!lastActive) {
      user.streak = 1;
    } else {
      const lastDate = new Date(lastActive);
      const todayDate = new Date(todayStr);
      const diffTime = Math.abs(todayDate - lastDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        user.streak += 1;
      } else {
        user.streak = 1;
      }
    }

    user.lastActiveDate = todayStr;
    saveDb();
    return user;
  },

  // --- Модули ---
  getModules(userId) {
    return dataCache.modules.filter(m => m.userId === userId);
  },

  getModuleById(id) {
    return dataCache.modules.find(m => m.id === id);
  },

  createModule(userId, title, description = '') {
    const module = {
      id: crypto.randomUUID(),
      userId,
      title,
      description
    };
    dataCache.modules.push(module);
    saveDb();
    return module;
  },

  updateModule(id, userId, title, description) {
    const moduleIndex = dataCache.modules.findIndex(m => m.id === id && m.userId === userId);
    if (moduleIndex === -1) return null;
    
    dataCache.modules[moduleIndex] = {
      ...dataCache.modules[moduleIndex],
      title: title !== undefined ? title : dataCache.modules[moduleIndex].title,
      description: description !== undefined ? description : dataCache.modules[moduleIndex].description
    };
    saveDb();
    return dataCache.modules[moduleIndex];
  },

  deleteModule(id, userId) {
    const index = dataCache.modules.findIndex(m => m.id === id && m.userId === userId);
    if (index === -1) return false;

    // Удаляем модуль
    dataCache.modules.splice(index, 1);
    
    // Удаляем все карточки, привязанные к модулю
    dataCache.cards = dataCache.cards.filter(c => c.moduleId !== id);
    
    // Также можно почистить прогресс пользователей по удаленным карточкам
    const moduleCardsIds = dataCache.cards.filter(c => c.moduleId === id).map(c => c.id);
    dataCache.progress = dataCache.progress.filter(p => !moduleCardsIds.includes(p.cardId));

    saveDb();
    return true;
  },

  // --- Карточки ---
  getCardsByModule(moduleId) {
    return dataCache.cards.filter(c => c.moduleId === moduleId);
  },

  getCardById(id) {
    return dataCache.cards.find(c => c.id === id);
  },

  createCard(moduleId, characters, pinyin, translation, examples = [], mnemonic = '') {
    const card = {
      id: crypto.randomUUID(),
      moduleId,
      characters,
      pinyin,
      translation,
      examples, // [{ chinese, pinyin, translation }]
      mnemonic
    };
    dataCache.cards.push(card);
    saveDb();
    return card;
  },

  updateCard(id, characters, pinyin, translation, examples, mnemonic) {
    const cardIndex = dataCache.cards.findIndex(c => c.id === id);
    if (cardIndex === -1) return null;

    dataCache.cards[cardIndex] = {
      ...dataCache.cards[cardIndex],
      characters: characters !== undefined ? characters : dataCache.cards[cardIndex].characters,
      pinyin: pinyin !== undefined ? pinyin : dataCache.cards[cardIndex].pinyin,
      translation: translation !== undefined ? translation : dataCache.cards[cardIndex].translation,
      examples: examples !== undefined ? examples : dataCache.cards[cardIndex].examples,
      mnemonic: mnemonic !== undefined ? mnemonic : dataCache.cards[cardIndex].mnemonic
    };
    saveDb();
    return dataCache.cards[cardIndex];
  },

  deleteCard(id) {
    const index = dataCache.cards.findIndex(c => c.id === id);
    if (index === -1) return false;

    dataCache.cards.splice(index, 1);
    dataCache.progress = dataCache.progress.filter(p => p.cardId !== id);
    saveDb();
    return true;
  },

  // --- Прогресс ---
  getProgress(userId, moduleId) {
    // Получаем список карточек для данного модуля
    const moduleCardIds = dataCache.cards.filter(c => c.moduleId === moduleId).map(c => c.id);
    
    // Фильтруем прогресс по карточкам модуля для конкретного пользователя
    return dataCache.progress.filter(p => p.userId === userId && moduleCardIds.includes(p.cardId));
  },

  // Логирование ошибки по карточке
  logCardError(userId, cardId) {
    const progressIndex = dataCache.progress.findIndex(p => p.userId === userId && p.cardId === cardId);
    const nowStr = new Date().toISOString();
    
    if (progressIndex !== -1) {
      dataCache.progress[progressIndex].lastFailureDate = nowStr;
      dataCache.progress[progressIndex].errorCount = (dataCache.progress[progressIndex].errorCount || 0) + 1;
      dataCache.progress[progressIndex].updatedAt = nowStr;
    } else {
      dataCache.progress.push({
        userId,
        cardId,
        status: 'dont_know',
        box: 1,
        easeFactor: 2.5,
        interval: 1,
        repetitions: 0,
        errorCount: 1,
        lastFailureDate: nowStr,
        updatedAt: nowStr
      });
    }
    saveDb();
  },

  // Получение карточек с ошибками за последние N дней
  getErrorCards(userId, days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const failedProgress = dataCache.progress.filter(p => {
      if (p.userId !== userId) return false;
      if (!p.lastFailureDate) return false;
      return new Date(p.lastFailureDate) >= cutoffDate;
    });

    const cardIds = failedProgress.map(p => p.cardId);
    return dataCache.cards.filter(c => cardIds.includes(c.id));
  },

  // Сохранение прогресса по алгоритму SM-2
  saveSm2Progress(userId, cardId, rating) {
    const progressIndex = dataCache.progress.findIndex(p => p.userId === userId && p.cardId === cardId);
    const prev = progressIndex !== -1 ? dataCache.progress[progressIndex] : null;

    let easeFactor = prev && prev.easeFactor ? prev.easeFactor : 2.5;
    let interval = prev && prev.interval ? prev.interval : 1;
    let repetitions = prev && prev.repetitions ? prev.repetitions : 0;
    const now = new Date();

    if (rating === 1) { // Снова (Again)
      repetitions = 0;
      interval = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (rating === 2) { // Трудно (Hard)
      interval = Math.max(1, Math.round(interval * 1.2));
      easeFactor = Math.max(1.3, easeFactor - 0.15);
    } else if (rating === 3) { // Хорошо (Good)
      repetitions += 1;
      interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(interval * easeFactor);
    } else if (rating === 4) { // Легко (Easy)
      repetitions += 1;
      interval = repetitions === 1 ? 4 : Math.round(interval * easeFactor * 1.3);
      easeFactor = Math.min(3.0, easeFactor + 0.15);
    }

    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + interval);

    const progressEntry = {
      ...(prev || {}),
      userId,
      cardId,
      status: rating >= 3 ? 'know' : 'dont_know',
      box: Math.min(Math.max(1, Math.ceil(interval / 3)), 5),
      easeFactor: Number(easeFactor.toFixed(2)),
      interval,
      repetitions,
      nextReviewAt: nextReview.toISOString(),
      updatedAt: now.toISOString()
    };

    if (progressIndex !== -1) {
      dataCache.progress[progressIndex] = progressEntry;
    } else {
      dataCache.progress.push(progressEntry);
    }

    this.updateUserStreak(userId);
    saveDb();
    return progressEntry;
  },

  saveProgress(userId, cardId, status) {
    return this.saveSm2Progress(userId, cardId, status === 'know' ? 3 : 1);
  },

  // Сброс прогресса по модулю
  resetModuleProgress(userId, moduleId) {
    const moduleCardIds = dataCache.cards.filter(c => c.moduleId === moduleId).map(c => c.id);
    dataCache.progress = dataCache.progress.filter(p => !(p.userId === userId && moduleCardIds.includes(p.cardId)));
    saveDb();
    return true;
  },

  // Глобальный сброс всего прогресса пользователя
  resetAllUserProgress(userId) {
    dataCache.progress = dataCache.progress.filter(p => p.userId !== userId);
    saveDb();
    return true;
  },

  getUserStats(userId) {
    const progressList = dataCache.progress.filter(p => p.userId === userId);
    const boxCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    progressList.forEach(p => {
      if (boxCounts[p.box] !== undefined) {
        boxCounts[p.box]++;
      }
    });

    const activity = {};
    progressList.forEach(p => {
      if (p.updatedAt) {
        const dateStr = p.updatedAt.split('T')[0];
        activity[dateStr] = (activity[dateStr] || 0) + 1;
      }
    });

    return {
      boxCounts,
      activity
    };
  }
};

export default db;
