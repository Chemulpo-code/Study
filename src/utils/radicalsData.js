// Словарь распространенных китайских ключей (иероглифических радикалов) и авто-деконструкция
export const COMMON_RADICALS = {
  '人': { name: 'Человек', pinyin: 'rén', meaning: 'Человек, людской' },
  '亻': { name: 'Человек (боковой)', pinyin: 'rén', meaning: 'Относится к людям, действиям человека' },
  '木': { name: 'Дерево', pinyin: 'mù', meaning: 'Дерево, растительность, древесина' },
  '日': { name: 'Солнце, День', pinyin: 'rì', meaning: 'Время, свет, день, солнце' },
  '月': { name: 'Луна, Тело', pinyin: 'yuè', meaning: 'Луна, время, также плоть/тело' },
  '水': { name: 'Вода', pinyin: 'shuǐ', meaning: 'Вода, жидкость, реки' },
  '氵': { name: 'Вода (три капли)', pinyin: 'shuǐ', meaning: 'Жидкость, плавание, напитки' },
  '火': { name: 'Огонь', pinyin: 'huǒ', meaning: 'Огонь, тепло, свет' },
  '灬': { name: 'Огонь (четыре точки)', pinyin: 'huǒ', meaning: 'Горение, нагрев, готовить' },
  '土': { name: 'Земля', pinyin: 'tǔ', meaning: 'Почва, земля, строительство' },
  '女': { name: 'Женщина', pinyin: 'nǚ', meaning: 'Женский пол, семья, красота' },
  '子': { name: 'Ребенок, Сын', pinyin: 'zǐ', meaning: 'Дети, ученые, семена' },
  '口': { name: 'Рот', pinyin: 'kǒu', meaning: 'Рот, речь, дыхание, еда' },
  '心': { name: 'Сердце', pinyin: 'xīn', meaning: 'Чувства, эмоции, разум' },
  '忄': { name: 'Сердце (боковое)', pinyin: 'xīn', meaning: 'Эмоциональное состояние, чувства' },
  '手': { name: 'Рука', pinyin: 'shǒu', meaning: 'Рука, физические действия' },
  '扌': { name: 'Рука (боковая)', pinyin: 'shǒu', meaning: 'Действие руками, держать, бросать' },
  '目': { name: 'Глаз', pinyin: 'mù', meaning: 'Зрение, смотреть, глаза' },
  '言': { name: 'Речь, Слово', pinyin: 'yán', meaning: 'Слова, разговоры, языки' },
  '讠': { name: 'Речь (упрощенная)', pinyin: 'yán', meaning: 'Слова, разговоры, языки' },
  '讠': { name: 'Речь', pinyin: 'yán', meaning: 'Слова, разговоры, языки' },
  '食': { name: 'Еда', pinyin: 'shí', meaning: 'Пища, еда, кушать' },
  '饣': { name: 'Еда (упрощенная)', pinyin: 'shí', meaning: 'Пища, блюда, кушать' },
  '贝': { name: 'Ракушка, Деньги', pinyin: 'bèi', meaning: 'Богатство, торговля, ценность' },
  '车': { name: 'Повозка, Машина', pinyin: 'chē', meaning: 'Транспорт, колеса, движение' },
  '门': { name: 'Дверь, Ворота', pinyin: 'mén', meaning: 'Двери, проход, помещения' },
  '⻌': { name: 'Идти, Движение', pinyin: 'chuò', meaning: 'Дорога, путь, движение' },
  '辶': { name: 'Идти, Движение', pinyin: 'chuò', meaning: 'Дорога, путь, перемещение' },
  '宀': { name: 'Крыша с точкой', pinyin: 'mián', meaning: 'Дом, здание, укрытие' },
  '广': { name: 'Навес, Здание', pinyin: 'guǎng', meaning: 'Помещение, дом' },
  '疒': { name: 'Болезнь', pinyin: 'nè', meaning: 'Заболевания, симптомы' },
  '艹': { name: 'Трава', pinyin: 'cǎo', meaning: 'Растения, цветы, трава' },
  '竹': { name: 'Бамбук', pinyin: 'zhú', meaning: 'Изделия из бамбука, предметы' },
  '⺮': { name: 'Бамбук (верхушка)', pinyin: 'zhú', meaning: 'Изделия из бамбука' },
  '力': { name: 'Сила', pinyin: 'lì', meaning: 'Физическая сила, усилие' },
  '刀': { name: 'Нож', pinyin: 'dāo', meaning: 'Резать, оружие, разделять' },
  '刂': { name: 'Нож (боковой)', pinyin: 'dāo', meaning: 'Разрезание, разделение' },
  '犭': { name: 'Собака/Зверь', pinyin: 'quǎn', meaning: 'Животные, дикие звери' },
  '足': { name: 'Нога', pinyin: 'zú', meaning: 'Ноги, ходьба, пинать' },
  '屮': { name: 'Нога (боковая)', pinyin: 'zú', meaning: 'Движение ногами' },
  '𻏀': { name: 'Птица', pinyin: 'niǎo', meaning: 'Птицы, крылатые' },
  '鸟': { name: 'Птица', pinyin: 'niǎo', meaning: 'Птицы, крылатые' },
  '走': { name: 'Бежать, Идти', pinyin: 'zǒu', meaning: 'Пешая ходьба, движение' },
  '金': { name: 'Металл, Золото', pinyin: 'jīn', meaning: 'Металлы, инструменты, деньги' },
  '钅': { name: 'Металл (упрощенный)', pinyin: 'jīn', meaning: 'Металлические предметы' },
  '雨': { name: 'Дождь', pinyin: 'yǔ', meaning: 'Осадки, погода, облака' },
  '玉': { name: 'Нефрит', pinyin: 'yù', meaning: 'Драгоценные камни, украшения' },
  '王': { name: 'Король / Нефрит', pinyin: 'wáng', meaning: 'Правитель, драгоценности' }
};

// Деконструкция иероглифа на визуальные составные части
export function deconstructCharacter(charStr) {
  if (!charStr) return [];
  
  const results = [];
  const chars = charStr.split('');
  
  for (const c of chars) {
    // Ищем прямое совпадение в радикалах
    if (COMMON_RADICALS[c]) {
      results.push({ char: c, ...COMMON_RADICALS[c] });
    } else {
      // Ищем вложенные радикалы в иероглифе
      for (const [rad, info] of Object.entries(COMMON_RADICALS)) {
        if (c.includes(rad) && c !== rad) {
          results.push({ char: rad, ...info, parentChar: c });
        }
      }
    }
  }

  // Убираем дубликаты
  const uniqueMap = new Map();
  results.forEach(r => uniqueMap.set(r.char, r));
  return Array.from(uniqueMap.values());
}
