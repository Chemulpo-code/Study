// Расширенный словарь распространенных китайских ключей (иероглифических радикалов)
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
  '又': { name: 'Ладонь, Опять', pinyin: 'yòu', meaning: 'Рука, повторяющееся действие' },
  '寸': { name: 'Ладонь, Мера', pinyin: 'cùn', meaning: 'Длина, вершок, рука' },
  '目': { name: 'Глаз', pinyin: 'mù', meaning: 'Зрение, смотреть, глаза' },
  '言': { name: 'Речь, Слово', pinyin: 'yán', meaning: 'Слова, разговоры, языки' },
  '讠': { name: 'Речь (упрощенная)', pinyin: 'yán', meaning: 'Слова, разговоры, языки' },
  '食': { name: 'Еда', pinyin: 'shí', meaning: 'Пища, еда, кушать' },
  '饣': { name: 'Еда (упрощенная)', pinyin: 'shí', meaning: 'Пища, блюда, кушать' },
  '贝': { name: 'Ракушка, Деньги', pinyin: 'bèi', meaning: 'Богатство, торговля, ценность' },
  '车': { name: 'Повозка, Машина', pinyin: 'chē', meaning: 'Транспорт, колеса, движение' },
  '门': { name: 'Дверь, Ворота', pinyin: 'mén', meaning: 'Двери, проход, помещения' },
  '⻌': { name: 'Идти, Движение', pinyin: 'chuò', meaning: 'Дорога, путь, движение' },
  '辶': { name: 'Идти, Движение', pinyin: 'chuò', meaning: 'Дорога, путь, перемещение' },
  '宀': { name: 'Крыша с точкой', pinyin: 'mián', meaning: 'Дом, здание, укрытие, сейф' },
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
  '鸟': { name: 'Птица', pinyin: 'niǎo', meaning: 'Птицы, крылатые' },
  '走': { name: 'Бежать, Идти', pinyin: 'zǒu', meaning: 'Пешая ходьба, движение' },
  '金': { name: 'Металл, Золото', pinyin: 'jīn', meaning: 'Металлы, инструменты, деньги' },
  '钅': { name: 'Металл (упрощенный)', pinyin: 'jīn', meaning: 'Металлические предметы' },
  '雨': { name: 'Дождь', pinyin: 'yǔ', meaning: 'Осадки, погода, облака' },
  '玉': { name: 'Нефрит, Драгоценность', pinyin: 'yù', meaning: 'Драгоценные камни, сокровища' },
  '王': { name: 'Король / Нефрит', pinyin: 'wáng', meaning: 'Правитель, драгоценности' }
};

// Известные смыслы индивидуальных иероглифов
const CHARACTER_DETAILS = {
  '支': { pinyin: 'zhī', meaning: 'выплачивать / держать', keys: 'Рука (又) / Ветка ✋' },
  '付': { pinyin: 'fù', meaning: 'передавать / платить', keys: 'Человек (亻) + Ладонь (寸) 🤲' },
  '宝': { pinyin: 'bǎo', meaning: 'сокровище / драгоценность', keys: 'Крыша (宀) 🏠 + Нефрит (玉) 💎' },
  '好': { pinyin: 'hǎo', meaning: 'хороший / хорошо', keys: 'Женщина (女) 👩 + Ребенок (子) 👶' },
  '吧': { pinyin: 'ba', meaning: 'выражение согласия / частица', keys: 'Рот (口) 🗣️ + Желание' },
  '苹': { pinyin: 'píng', meaning: 'яблоневый сорт', keys: 'Трава (艹) 🌱' },
  '果': { pinyin: 'guǒ', meaning: 'плод / фрукт', keys: 'Дерево (木) 🌳 + Плоды (田)' },
  '水': { pinyin: 'shuǐ', meaning: 'вода / жидкость', keys: 'Речной поток 💧' },
  '休': { pinyin: 'xiū', meaning: 'отдыхать', keys: 'Человек (亻) 🧍 + Дерево (木) 🌳' },
  '明': { pinyin: 'míng', meaning: 'светлый / яркий', keys: 'Солнце (日) ☀️ + Луна (月) 🌙' },
  '男': { pinyin: 'nán', meaning: 'мужчина', keys: 'Поле (田) 🌾 + Сила (力) 💪' },
  '看': { pinyin: 'kàn', meaning: 'смотреть', keys: 'Рука (手) ✋ + Глаз (目) 👀' },
  '听': { pinyin: 'tīng', meaning: 'слушать', keys: 'Рот (口) 👄 + Звук' },
  '语': { pinyin: 'yǔ', meaning: 'язык / речь', keys: 'Речь (讠) 🗣️ + Я (吾)' },
  '话': 'РЕЧЬ (讠) + ЯЗЫК (舌)',
  '电': { pinyin: 'diàn', meaning: 'электричество / молния', keys: 'Вспышка молнии ⚡' },
  '脑': { pinyin: 'nǎo', meaning: 'мозг / разум', keys: 'Плоть (月) 🧠 + Голова' },
  '猫': { pinyin: 'māo', meaning: 'кошка', keys: 'Зверь (犭) 🐱 + Растения (苗)' },
  '狗': { pinyin: 'gǒu', meaning: 'собака', keys: 'Зверь (犭) 🐶 + Звук (句)' },
  '车': { pinyin: 'chē', meaning: 'машина / транспорт', keys: 'Колеса и повозка 🚗' }
};

// Деконструкция иероглифа на визуальные составные части
export function deconstructCharacter(charStr) {
  if (!charStr) return [];
  
  const results = [];
  const chars = charStr.split('');
  
  for (const c of chars) {
    if (COMMON_RADICALS[c]) {
      results.push({ char: c, ...COMMON_RADICALS[c] });
    } else {
      for (const [rad, info] of Object.entries(COMMON_RADICALS)) {
        if (c.includes(rad) && c !== rad) {
          results.push({ char: rad, ...info, parentChar: c });
        }
      }
    }
  }

  const uniqueMap = new Map();
  results.forEach(r => uniqueMap.set(r.char, r));
  return Array.from(uniqueMap.values());
}

// Авто-генератор подробной структурированной мнемоники
export function generateMnemonic(characters, pinyin = '', translation = '') {
  if (!characters || !characters.trim()) return '';

  const cleanChar = characters.trim();
  const charList = cleanChar.split('');

  // Собираем детализацию по каждому иероглифу слова
  const details = charList.map(c => {
    if (CHARACTER_DETAILS[c] && typeof CHARACTER_DETAILS[c] === 'object') {
      return { char: c, ...CHARACTER_DETAILS[c] };
    }
    const rads = deconstructCharacter(c);
    const radNames = rads.map(r => `${r.name} (${r.char})`).join(' + ');
    return {
      char: c,
      pinyin: '',
      meaning: 'составляющая слова',
      keys: radNames || 'Графические черты'
    };
  });

  // Шаг 1: Формируем список составных иероглифов 🧱
  let charBreakdownText = details.map(d => {
    return `• ${d.char}: ${d.keys} ➔ ${d.meaning}`;
  }).join('\n');

  // Шаг 2: Формируем связную мнемоническую историю 🧠
  let storyText = '';
  if (cleanChar === '支付宝' || (translation && translation.toLowerCase().includes('али пей'))) {
    storyText = 'Рука (支) человека (付) передает оплату прямо под надежную крышу (宝) электронного сейфа сокровищ ➔ Али Пей.';
  } else if (cleanChar === '好吧') {
    storyText = 'Женщина (女) с ребенком (子) выражает согласие (口/吧) ➔ «Хорошо / Ладно».';
  } else if (details.length === 1) {
    const d = details[0];
    storyText = `Иероглиф «${d.char}» состоит из ключей (${d.keys}). Запоминаем как «${translation || d.meaning}».`;
  } else {
    const keysSummary = details.map(d => `${d.char} (${d.keys})`).join(' + ');
    storyText = `Складываем кирпичики (${keysSummary}) ➔ получаеся значение «${translation || cleanChar}».`;
  }

  return `🧱 Разбор по иероглифам:\n${charBreakdownText}\n\n🧠 История для запоминания:\n${storyText}`;
}
