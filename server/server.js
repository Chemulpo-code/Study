import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pinyin as getPinyin } from 'pinyin-pro';
import { hsk1Words } from './hsk1_data.js';
import db from './db.js';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 5005;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_chinese_cards_98765';

app.use(cors());
app.use(express.json());

// Эндпоинт версии приложения для отслеживания деплоя в Portainer
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.9.2',
    buildHash: 'v1.9.2-fix-card-layout-textarea',
    serverTime: new Date().toISOString()
  });
});

// --- Вспомогательная функция для генерации стартовых модулей ---
function createStarterContent(userId) {
  // 1. Модуль "Приветствия"
  const m1 = db.createModule(userId, 'Приветствия', 'Базовые слова и фразы для приветствия и вежливости');
  db.createCard(m1.id, '你好', 'nǐ hǎo', 'Привет / Здравствуйте', [
    { chinese: '你好！很高兴认识你。', pinyin: 'nǐ hǎo! hěn gāoxìng rènshi nǐ.', translation: 'Привет! Рад познакомиться с тобой.' }
  ]);
  db.createCard(m1.id, '谢谢', 'xièxie', 'Спасибо', [
    { chinese: '谢谢你的帮助！', pinyin: 'xièxie nǐ de bāngzhù!', translation: 'Спасибо за твою помощь!' }
  ]);
  db.createCard(m1.id, '再见', 'zàijiàn', 'До свидания / Пока', [
    { chinese: '明天见，再见！', pinyin: 'míngtiān jiàn, zàijiàn!', translation: 'Увидимся завтра, пока!' }
  ]);
  db.createCard(m1.id, '不客气', 'bù kèqi', 'Не за что / Пожалуйста', [
    { chinese: 'A: 谢谢你！B: 不客气。', pinyin: 'A: xièxie nǐ! B: bù kèqi.', translation: 'А: Спасибо! Б: Не за что.' }
  ]);
  db.createCard(m1.id, '对不起', 'duìbuqǐ', 'Извините / Простите', [
    { chinese: '对不起，我迟到了。', pinyin: 'duìbuqǐ, wǒ chídào le.', translation: 'Извините, я опоздал.' }
  ]);

  // 2. Модуль "Числа"
  const m2 = db.createModule(userId, 'Числа', 'Счет от 1 до 10 и примеры использования чисел');
  db.createCard(m2.id, '一', 'yī', 'Один (1)', [
    { chinese: '我有一本书。', pinyin: 'wǒ yǒu yī běn shū.', translation: 'У меня есть одна книга.' }
  ]);
  db.createCard(m2.id, '二', 'èr', 'Два (2)', [
    { chinese: '这两个人是我的朋友。', pinyin: 'zhè liǎng gè rén shì wǒ de péngyou.', translation: 'Эти два человека — мои друзья.' }
  ]);
  db.createCard(m2.id, '三', 'sān', 'Три (3)', [
    { chinese: '这里有三个人。', pinyin: 'zhè lǐ yǒu sān gè rén.', translation: 'Здесь три человека.' }
  ]);
  db.createCard(m2.id, '五', 'wǔ', 'Пять (5)', [
    { chinese: '我有五只猫。', pinyin: 'wǒ yǒu wǔ zhī māo.', translation: 'У меня есть пять кошек.' }
  ]);
  db.createCard(m2.id, '十', 'shí', 'Десять (10)', [
    { chinese: '这件衣服十块钱。', pinyin: 'zhè jiàn yīfu shí kuài qián.', translation: 'Эта одежда стоит десять юаней.' }
  ]);

  // 3. Модуль "Базовые фразы"
  const m3 = db.createModule(userId, 'Базовые фразы', 'Простые повседневные выражения и вопросы');
  db.createCard(m3.id, '我爱你', 'wǒ ài nǐ', 'Я люблю тебя', [
    { chinese: '妈妈，我爱你。', pinyin: 'māma, wǒ ài nǐ.', translation: 'Мама, я люблю тебя.' }
  ]);
  db.createCard(m3.id, '你在做什么？', 'nǐ zài zuò shénme?', 'Что ты делаешь?', [
    { chinese: '你在做什么？我在学习汉语。', pinyin: 'nǐ zài zuò shénme? wǒ zài xuéxí hànyǔ.', translation: 'Что ты делаешь? Я учу китайский.' }
  ]);
  db.createCard(m3.id, '你叫什么名字？', 'nǐ jiào shénme míngzi?', 'Как тебя зовут?', [
    { chinese: '你叫什么名字？我叫大卫。', pinyin: 'nǐ jiào shénme míngzi? wǒ jiào dàwèi.', translation: 'Как тебя зовут? Меня зовут Дэвид.' }
  ]);
  db.createCard(m3.id, '多少钱？', 'duōshao qián?', 'Сколько стоит?', [
    { chinese: '这个杯子多少钱？', pinyin: 'zhège bēizi duōshao qián?', translation: 'Сколько стоит эта чашка?' }
  ]);
  db.createCard(m3.id, '我不知道', 'wǒ bù zhīdào', 'Я не знаю', [
    { chinese: '我不确定，我不知道。', pinyin: 'wǒ bù quèdìng, wǒ bù zhīdào.', translation: 'Я не уверен, я не знаю.' }
  ]);
}

// --- Middleware для авторизации по JWT ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Токен отсутствует. Пожалуйста, авторизуйтесь.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Неверный или просроченный токен.' });
    }
    const user = db.getUserById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден.' });
    }
    req.user = { id: user.id, username: user.username };
    next();
  });
}

// --- Роуты Авторизации ---

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Введите имя пользователя и пароль.' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Имя пользователя должно быть не менее 3 символов.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен быть не менее 6 символов.' });
    }

    const existingUser = db.getUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Это имя пользователя уже занято.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = db.createUser(username, passwordHash);

    // Добавляем стартовые модули новому пользователю
    createStarterContent(user.id);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, username: user.username, streak: 0 } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера при регистрации.' });
  }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Введите имя пользователя и пароль.' });
    }

    const user = db.getUserByUsername(username);
    if (!user) {
      return res.status(400).json({ error: 'Неверное имя пользователя или пароль.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Неверное имя пользователя или пароль.' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const updatedUser = db.checkAndUpdateStreak(user.id);
    res.json({ token, user: { id: updatedUser.id, username: updatedUser.username, streak: updatedUser.streak } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера при входе.' });
  }
});

// Получить данные о текущем пользователе
app.get('/api/auth/me', authenticateToken, (req, res) => {
  const updatedUser = db.checkAndUpdateStreak(req.user.id);
  res.json({ user: { id: updatedUser.id, username: updatedUser.username, streak: updatedUser.streak } });
});


// --- Роуты Модулей ---

// Получить список всех модулей пользователя с расчетом прогресса
app.get('/api/modules', authenticateToken, (req, res) => {
  const modules = db.getModules(req.user.id);
  
  // Добавляем статистику по каждой папке/модулю
  const modulesWithStats = modules.map(m => {
    const cards = db.getCardsByModule(m.id);
    const progress = db.getProgress(req.user.id, m.id);
    
    const totalCards = cards.length;
    const knownCards = progress.filter(p => p.status === 'know').length;
    const learnedPercentage = totalCards > 0 ? Math.round((knownCards / totalCards) * 100) : 0;
    
    return {
      ...m,
      totalCards,
      knownCards,
      learnedPercentage
    };
  });
  
  res.json(modulesWithStats);
});

// Получить общую статистику пользователя (распределение коробок и историю активности)
app.get('/api/stats', authenticateToken, (req, res) => {
  try {
    const stats = db.getUserStats(req.user.id);
    res.json(stats);
  } catch (error) {
    console.error('Ошибка получения статистики:', error);
    res.status(500).json({ error: 'Не удалось получить статистику.' });
  }
});

// Создать модуль
app.post('/api/modules', authenticateToken, (req, res) => {
  const { title, description } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Укажите название модуля.' });
  }
  const module = db.createModule(req.user.id, title, description);
  res.status(201).json(module);
});

// Редактировать модуль
app.put('/api/modules/:id', authenticateToken, (req, res) => {
  const { title, description } = req.body;
  const updatedModule = db.updateModule(req.params.id, req.user.id, title, description);
  
  if (!updatedModule) {
    return res.status(404).json({ error: 'Модуль не найден или у вас нет прав на его редактирование.' });
  }
  res.json(updatedModule);
});

// Удалить модуль
app.delete('/api/modules/:id', authenticateToken, (req, res) => {
  const success = db.deleteModule(req.params.id, req.user.id);
  if (!success) {
    return res.status(404).json({ error: 'Модуль не найден или у вас нет прав на его удаление.' });
  }
  res.json({ message: 'Модуль успешно удален.' });
});

// Импортировать HSK 1
app.post('/api/modules/import-hsk1', authenticateToken, (req, res) => {
  const existing = db.getModules(req.user.id).find(m => m.title === 'Словарь HSK 1');
  if (existing) {
    return res.status(400).json({ error: 'Модуль HSK 1 уже импортирован.' });
  }

  const hskModule = db.createModule(req.user.id, 'Словарь HSK 1', '30 слов первой ступени HSK с пиньинем и примерами предложений');
  
  hsk1Words.forEach(word => {
    db.createCard(hskModule.id, word.characters, word.pinyin, word.translation, word.examples);
  });

  res.status(201).json({ message: 'Модуль HSK 1 успешно импортирован', module: hskModule });
});


// --- Роуты Карточек ---

// Получить карточки модуля
app.get('/api/modules/:moduleId/cards', authenticateToken, (req, res) => {
  const module = db.getModuleById(req.params.moduleId);
  if (!module || module.userId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа к этому модулю.' });
  }

  const cards = db.getCardsByModule(req.params.moduleId);
  const progress = db.getProgress(req.user.id, req.params.moduleId);

  // Обогащаем карточки текущим статусом изучения для этого пользователя
  const cardsWithProgress = cards.map(c => {
    const prog = progress.find(p => p.cardId === c.id);
    return {
      ...c,
      status: prog ? prog.status : 'new', // 'new' | 'know' | 'dont_know'
      box: prog ? (prog.box || 1) : 0,
      nextReviewAt: prog ? prog.nextReviewAt : null
    };
  });

  res.json(cardsWithProgress);
});

// Словарь конвертации традиционных иероглифов в упрощенные для частых слов Tatoeba
const tradToSimpMap = {
  '來': '来', '個': '个', '這': '这', '那': '那', '麼': '么', '什麼': '什么',
  '時': '时', '候': '候', '嗎': '吗', '會': '会', '聽': '听', '說': '说',
  '讀': '读', '寫': '写', '開': '开', '關': '关', '點': '点', '愛': '爱',
  '歡': '欢', '錢': '钱', '買': '买', '車': '车', '話': '话', '語': '语',
  '漢': '汉', '學': '学', '校': '校', '師': '师', '國': '国', '門': '门',
  '為': '为', '見': '见', '對': '对', '過': '过', '髮': '发', '發': '发'
};

function toSimplifiedChinese(str) {
  if (!str) return '';
  return str.split('').map(ch => tradToSimpMap[ch] || ch).join('');
}

function processTatoebaResults(results, candidatePool, cleanWord, cleanRus) {
  for (const res of results) {
    let chineseSentence = '';
    let rusTranslation = '';

    // Если результат на китайском
    if (res.lang === 'cmn') {
      chineseSentence = toSimplifiedChinese(res.text);
      const translations = Array.isArray(res.translations) ? res.translations : [];
      for (const group of translations) {
        if (Array.isArray(group)) {
          for (const item of group) {
            if (item.lang === 'rus' && item.text) {
              rusTranslation = item.text;
              break;
            }
          }
        }
        if (rusTranslation) break;
      }
    } else if (res.lang === 'rus') {
      // Если результат на русском
      rusTranslation = res.text;
      const translations = Array.isArray(res.translations) ? res.translations : [];
      for (const group of translations) {
        if (Array.isArray(group)) {
          for (const item of group) {
            if (item.lang === 'cmn' && item.text) {
              chineseSentence = toSimplifiedChinese(item.text);
              break;
            }
          }
        }
        if (chineseSentence) break;
      }
    }

    if (!chineseSentence || !rusTranslation) continue;
    if (candidatePool.has(chineseSentence)) continue;

    let score = 0;
    const rusLower = rusTranslation.toLowerCase();

    // 1. ОГРОМНЫЙ Приоритет (+50): В русском переводе есть ключевое русское слово ("один", "кофе")
    if (cleanRus && cleanRus.length >= 2) {
      const rootWord = cleanRus.slice(0, Math.max(2, cleanRus.length - 2));
      if (rusLower.includes(rootWord)) {
        score += 50;
      }
    }

    // 2. В китайском предложении есть искомый иероглиф (+20)
    if (chineseSentence.includes(cleanWord)) {
      score += 20;
    }

    // 3. Предложение удобной длины (+10)
    if (chineseSentence.length >= 3 && chineseSentence.length <= 25) {
      score += 10;
    }

    const sentencePinyin = getPinyin(chineseSentence, { toneType: 'symbol' });
    candidatePool.set(chineseSentence, {
      chinese: chineseSentence,
      pinyin: sentencePinyin,
      translation: rusTranslation,
      score
    });
  }
}

// --- Вспомогательная функция для работы с Tatoeba API ---
async function fetchTatoebaExample(word, excludeSentences = [], russianTranslation = '') {
  if (!word || !word.trim()) return null;
  const cleanWord = word.trim();
  const cleanRus = (russianTranslation || '').trim().toLowerCase();

  const candidatePool = new Map();

  // 1. Запрос cmn -> rus
  try {
    const urlCmn = `https://tatoeba.org/en/api_v0/search?from=cmn&to=rus&query=${encodeURIComponent(cleanWord)}`;
    const resCmn = await fetch(urlCmn, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    if (resCmn.ok) {
      const data = await resCmn.json();
      processTatoebaResults(Array.isArray(data?.results) ? data.results : [], candidatePool, cleanWord, cleanRus);
    }
  } catch (e) {
    console.error('Ошибка cmn->rus:', e.message);
  }

  // 2. Запрос rus -> cmn для 100% прямого точного совпадения по смыслу слова
  if (cleanRus && cleanRus.length >= 2) {
    try {
      const urlRus = `https://tatoeba.org/en/api_v0/search?from=rus&to=cmn&query=${encodeURIComponent(cleanRus)}`;
      const resRus = await fetch(urlRus, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
      if (resRus.ok) {
        const data = await resRus.json();
        processTatoebaResults(Array.isArray(data?.results) ? data.results : [], candidatePool, cleanWord, cleanRus);
      }
    } catch (e) {
      console.error('Ошибка rus->cmn:', e.message);
    }
  }

  const validExamples = Array.from(candidatePool.values());
  if (validExamples.length === 0) return null;

  // Сортируем варианты по релевантности (наивысший балл первой)
  validExamples.sort((a, b) => b.score - a.score);

  // Исключаем предложения, которые уже показывались
  const excludeSet = new Set(excludeSentences);
  const newExamples = validExamples.filter(ex => !excludeSet.has(ex.chinese));

  if (newExamples.length > 0) {
    return newExamples[0];
  }

  // Если все пролистали — возвращаем наиболее подходящий
  return validExamples[0];
}

// Эндпоинт ручной генерации примера предложения из Tatoeba API с ротацией
app.get('/api/tatoeba/example', authenticateToken, async (req, res) => {
  const { word, exclude, translation } = req.query;
  if (!word) {
    return res.status(400).json({ error: 'Укажите слово для поиска примера' });
  }

  let excludeList = [];
  if (exclude) {
    try {
      excludeList = JSON.parse(exclude);
    } catch {
      excludeList = [exclude];
    }
  }

  const example = await fetchTatoebaExample(word, excludeList, translation);
  if (!example) {
    return res.status(404).json({ error: 'Пример предложения не найден в базе Tatoeba' });
  }

  res.json({ example });
});

// Создать карточку
app.post('/api/modules/:moduleId/cards', authenticateToken, async (req, res) => {
  const { characters, pinyin, translation, examples, mnemonic } = req.body;
  const module = db.getModuleById(req.params.moduleId);
  if (!module || module.userId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа к этому модулю.' });
  }

  if (!characters || !translation) {
    return res.status(400).json({ error: 'Иероглифы и перевод обязательны для заполнения.' });
  }

  const finalPinyin = pinyin && pinyin.trim() ? pinyin.trim() : getPinyin(characters);

  let finalExamples = examples || [];
  if ((!finalExamples || finalExamples.length === 0) && characters) {
    const autoExample = await fetchTatoebaExample(characters);
    if (autoExample) {
      finalExamples = [autoExample];
    }
  }

  const card = db.createCard(req.params.moduleId, characters, finalPinyin, translation, finalExamples, mnemonic || '');
  res.status(201).json({ ...card, status: 'new' });
});

// Редактировать карточку
app.put('/api/cards/:id', authenticateToken, async (req, res) => {
  const { characters, pinyin, translation, examples, mnemonic } = req.body;
  const card = db.getCardById(req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Карточка не найдена.' });
  }

  // Проверяем права пользователя на модуль этой карточки
  const module = db.getModuleById(card.moduleId);
  if (!module || module.userId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа к карточке.' });
  }

  const finalPinyin = pinyin && pinyin.trim() ? pinyin.trim() : (characters ? getPinyin(characters) : undefined);

  let finalExamples = examples || [];
  if ((!finalExamples || finalExamples.length === 0) && characters) {
    const autoExample = await fetchTatoebaExample(characters);
    if (autoExample) {
      finalExamples = [autoExample];
    }
  }

  const updatedCard = db.updateCard(req.params.id, characters, finalPinyin, translation, finalExamples, mnemonic);
  res.json(updatedCard);
});

// Удалить карточку
app.delete('/api/cards/:id', authenticateToken, (req, res) => {
  const card = db.getCardById(req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Карточка не найдена.' });
  }

  const module = db.getModuleById(card.moduleId);
  if (!module || module.userId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа к карточке.' });
  }

  db.deleteCard(req.params.id);
  res.json({ message: 'Карточка удалена.' });
});


// --- Роуты Прогресса ---

// Сохранить прогресс карточки по SM-2 (рейтинги 1-4)
app.post('/api/progress/sm2', authenticateToken, (req, res) => {
  const { cardId, rating } = req.body;
  if (!cardId || ![1, 2, 3, 4].includes(Number(rating))) {
    return res.status(400).json({ error: 'Укажите верный cardId и rating (1, 2, 3 или 4).' });
  }

  const card = db.getCardById(cardId);
  if (!card) {
    return res.status(404).json({ error: 'Карточка не найдена.' });
  }

  const progress = db.saveSm2Progress(req.user.id, cardId, Number(rating));
  res.json(progress);
});

// Логирование ошибки по карточке из викторин / спринта
app.post('/api/progress/log-error', authenticateToken, (req, res) => {
  const { cardId } = req.body;
  if (!cardId) {
    return res.status(400).json({ error: 'Укажите cardId.' });
  }

  db.logCardError(req.user.id, cardId);
  res.json({ message: 'Ошибка зафиксирована' });
});

// Виртуальный модуль «Работа над ошибками»
app.get('/api/modules/error-box', authenticateToken, (req, res) => {
  const errorCards = db.getErrorCards(req.user.id, 7);
  res.json({
    id: 'error-box',
    title: '❌ Работа над ошибками',
    description: 'Слова и фразы, в которых вы ошибались за последние 7 дней',
    totalCards: errorCards.length,
    knownCards: 0,
    learnedPercentage: 0,
    isVirtual: true,
    cards: errorCards
  });
});

// Генерируемые микро-диалоги для модуля
app.get('/api/modules/:id/dialogues', authenticateToken, (req, res) => {
  const cards = db.getCardsByModule(req.params.id);
  const module = db.getModuleById(req.params.id);

  if (!module) {
    return res.status(404).json({ error: 'Модуль не найден.' });
  }

  // Создаем 2-3 диалоговых сценария на основе слов модуля
  const sampleWords = cards.map(c => c.characters).slice(0, 6);
  const word1 = sampleWords[0] || '你好';
  const word2 = sampleWords[1] || '谢谢';
  const word3 = sampleWords[2] || '再见';

  const dialogues = [
    {
      id: 'dialogue-1',
      title: `Диалог 1: Знакомство и общение (${module.title})`,
      scenario: 'Разговор двух знакомых при встрече',
      lines: [
        { speaker: 'A', chinese: `${word1}！很高兴认识你。`, pinyin: `${word1}! Hěn gāoxìng rènshí nǐ.`, translation: `Привет! Очень рад познакомиться.` },
        { speaker: 'B', chinese: `我也很高兴。${word2}！`, pinyin: `Wǒ yě hěn gāoxìng. ${word2}!`, translation: `Я тоже рад. Спасибо!` },
        { speaker: 'A', chinese: `今天天气很好，你想去哪里？`, pinyin: `Jīntiān tiānqì hěn hǎo, nǐ xiǎng qù nǎlǐ?`, translation: `Сегодня отличная погода, куда ты хочешь пойти?` },
        { speaker: 'B', chinese: `我们一起去咖啡馆吧！${word3}！`, pinyin: `Wǒmen yīqǐ qù kāfēiguǎn ba! ${word3}!`, translation: `Подем вместе в кафе! До свидания!` }
      ]
    },
    {
      id: 'dialogue-2',
      title: `Диалог 2: Покупка и заказ (${module.title})`,
      scenario: 'Разговор покупателя и продавца',
      lines: [
        { speaker: 'Покупатель', chinese: `请问，这个多少钱？${word1}`, pinyin: `Qǐngwèn, zhège duōshǎo qián? ${word1}`, translation: `Скажите, пожалуйста, сколько это стоит?` },
        { speaker: 'Продавец', chinese: `这个二十块钱，非常便宜。`, pinyin: `Zhège èrshí kuài qián, fēicháng piányi.`, translation: `Это стоит 20 юаней, очень дешево.` },
        { speaker: 'Покупатель', chinese: `好的，给我一个。${word2}！`, pinyin: `Hǎo de, gěi wǒ yī gè. ${word2}!`, translation: `Хорошо, дайте мне один. Спасибо!` },
        { speaker: 'Продавец', chinese: `不客气，欢迎下次再来！${word3}`, pinyin: `Bù kèqì, huānyíng xià cì zài lái! ${word3}`, translation: `Пожалуйста, приходите еще!` }
      ]
    }
  ];

  res.json(dialogues);
});

// Сохранить прогресс карточки ("Знаю" / "Не знаю")
app.post('/api/progress', authenticateToken, (req, res) => {
  const { cardId, status } = req.body;
  if (!cardId || !['know', 'dont_know'].includes(status)) {
    return res.status(400).json({ error: 'Укажите верный cardId и статус (know или dont_know).' });
  }

  const card = db.getCardById(cardId);
  if (!card) {
    return res.status(404).json({ error: 'Карточка не найдена.' });
  }

  const module = db.getModuleById(card.moduleId);
  if (!module || module.userId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа к этой карточке.' });
  }

  const progress = db.saveProgress(req.user.id, cardId, status);
  res.json(progress);
});

// Пакетная синхронизация прогресса из офлайн-очереди
app.post('/api/progress/batch', authenticateToken, (req, res) => {
  const { batch } = req.body;
  if (!Array.isArray(batch) || batch.length === 0) {
    return res.status(400).json({ error: 'Укажите массив batch с прогрессом.' });
  }

  let syncedCount = 0;
  for (const item of batch) {
    if (!item.cardId || !['know', 'dont_know'].includes(item.status)) continue;
    const card = db.getCardById(item.cardId);
    if (!card) continue;

    const module = db.getModuleById(card.moduleId);
    if (!module || module.userId !== req.user.id) continue;

    db.saveProgress(req.user.id, item.cardId, item.status);
    syncedCount++;
  }

  res.json({ message: `Успешно синхронизировано ${syncedCount} карточек.`, syncedCount });
});



// Сбросить прогресс по модулю
app.post('/api/modules/:moduleId/reset-progress', authenticateToken, (req, res) => {
  const module = db.getModuleById(req.params.moduleId);
  if (!module || module.userId !== req.user.id) {
    return res.status(403).json({ error: 'Нет доступа к этому модулю.' });
  }

  db.resetModuleProgress(req.user.id, req.params.moduleId);
  res.json({ message: 'Прогресс модуля сброшен.' });
});

// Глобальный сброс всего учебного прогресса текущего пользователя
app.post('/api/progress/reset-all', authenticateToken, (req, res) => {
  db.resetAllUserProgress(req.user.id);
  res.json({ message: 'Весь учебный прогресс успешно сброшен.' });
});

// Папка для кэширования аудио-файлов
const cacheDir = path.join(process.cwd(), 'tts_cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Нейросетевой синтез речи Microsoft Edge TTS (Xiaoxiao) с кэшированием
app.get('/api/tts', (req, res) => {
  const text = req.query.text;
  if (!text) {
    return res.status(400).json({ error: 'Параметр text обязателен.' });
  }

  if (text.length > 500) {
    return res.status(400).json({ error: 'Текст слишком длинный (максимум 500 символов).' });
  }

  const isSlow = req.query.rate === 'slow';
  const speedSuffix = isSlow ? '_slow' : '';

  // Вычисляем MD5 хеш текста для уникального имени файла в кэше
  const hash = crypto.createHash('md5').update(text.trim().toLowerCase() + speedSuffix).digest('hex');
  const cachedFilePath = path.join(cacheDir, `${hash}.mp3`);

  // Если файл уже есть в кэше — отдаем его мгновенно с вечным браузерным кэшированием!
  if (fs.existsSync(cachedFilePath)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    return fs.createReadStream(cachedFilePath).pipe(res);
  }

  // Безопасный вызов Python скрипта tts_runner.py через execFile (без командной оболочки, 100% защита от Command Injection)
  const runnerPath = path.join(process.cwd(), 'server', 'tts_runner.py');
  const fallbackRunnerPath = path.join(process.cwd(), 'tts_runner.py');
  const actualRunnerPath = fs.existsSync(runnerPath) ? runnerPath : fallbackRunnerPath;
  
  const voice = 'zh-CN-XiaoxiaoNeural';
  const rateParam = isSlow ? '-35%' : '+0%';

  execFile('python3', [actualRunnerPath, voice, text, cachedFilePath, rateParam], (error, stdout, stderr) => {
    if (error) {
      console.error('Ошибка edge-tts:', error, stderr);
      return res.status(500).json({ error: 'Не удалось сгенерировать аудио.', details: stderr });
    }

    if (!fs.existsSync(cachedFilePath)) {
      return res.status(500).json({ error: 'Аудио файл не был создан.' });
    }

    // Отправляем файл клиенту
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    fs.createReadStream(cachedFilePath).pipe(res);
  });
});

// В режиме продакшна (Docker / Portainer) отдаем собранный React клиент из папки dist с агрессивным кэшированием
const distPath = path.join(path.resolve(), 'dist');
if (fs.existsSync(distPath)) {
  // Кэшируем собранные Vite JS/CSS файлы на 1 год (они с хэшем)
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    immutable: true
  }));
  app.use(express.static(distPath, { maxAge: '1d' }));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
