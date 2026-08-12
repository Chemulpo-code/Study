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

  createCard(moduleId, characters, pinyin, translation, examples = []) {
    const card = {
      id: crypto.randomUUID(),
      moduleId,
      characters,
      pinyin,
      translation,
      examples // [{ chinese, pinyin, translation }]
    };
    dataCache.cards.push(card);
    saveDb();
    return card;
  },

  updateCard(id, characters, pinyin, translation, examples) {
    const cardIndex = dataCache.cards.findIndex(c => c.id === id);
    if (cardIndex === -1) return null;

    dataCache.cards[cardIndex] = {
      ...dataCache.cards[cardIndex],
      characters: characters !== undefined ? characters : dataCache.cards[cardIndex].characters,
      pinyin: pinyin !== undefined ? pinyin : dataCache.cards[cardIndex].pinyin,
      translation: translation !== undefined ? translation : dataCache.cards[cardIndex].translation,
      examples: examples !== undefined ? examples : dataCache.cards[cardIndex].examples
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

  saveProgress(userId, cardId, status) {
    const progressIndex = dataCache.progress.findIndex(p => p.userId === userId && p.cardId === cardId);
    const prevProgress = progressIndex !== -1 ? dataCache.progress[progressIndex] : null;

    let currentBox = 1;
    if (status === 'know') {
      const prevBox = (prevProgress && prevProgress.box) || 1;
      currentBox = Math.min(prevBox + 1, 5);
    } else {
      currentBox = 1;
    }

    const intervals = {
      1: 1,  // 1 день
      2: 3,  // 3 дня
      3: 7,  // 7 дней
      4: 14, // 14 дней
      5: 30  // 30 дней
    };

    const daysToAdd = intervals[currentBox] || 1;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysToAdd);

    const progressEntry = {
      userId,
      cardId,
      status, // 'know' | 'dont_know'
      box: currentBox,
      nextReviewAt: nextReview.toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (progressIndex !== -1) {
      dataCache.progress[progressIndex] = progressEntry;
    } else {
      dataCache.progress.push(progressEntry);
    }

    // Обновляем стрик пользователя при активности
    this.updateUserStreak(userId);
    
    saveDb();
    return progressEntry;
  },

  // Сброс прогресса по модулю
  resetModuleProgress(userId, moduleId) {
    const moduleCardIds = dataCache.cards.filter(c => c.moduleId === moduleId).map(c => c.id);
    dataCache.progress = dataCache.progress.filter(p => !(p.userId === userId && moduleCardIds.includes(p.cardId)));
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
