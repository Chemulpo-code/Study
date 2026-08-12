import React, { useState } from 'react';
import { ArrowLeft } from '../components/Icons';

// Полный список инициалей (строки)
const initials = ['', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'g', 'k', 'h', 'j', 'q', 'x', 'zh', 'ch', 'sh', 'r', 'z', 'c', 's', 'y', 'w'];

// Финали (колонки), сгруппированные по категориям
const finalsGroups = {
  simple: {
    title: 'Простые',
    list: ['a', 'o', 'e', 'i', 'u', 'ü']
  },
  compound: {
    title: 'Сложные',
    list: ['ai', 'ei', 'ui', 'ao', 'ou', 'iu', 'ie', 'üe', 'er', 'ia', 'iao', 'ian', 'iang', 'iong', 'ua', 'uo', 'uai', 'uan', 'uang', 'ueng']
  },
  nasal: {
    title: 'Носовые',
    list: ['an', 'en', 'in', 'un', 'ün', 'ang', 'eng', 'ing', 'ong']
  }
};

// Все валидные слоги путунхуа
const validSyllables = new Set([
  'a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'er', 'ang', 'eng',
  'ba', 'bo', 'bai', 'bei', 'bao', 'ban', 'ben', 'bang', 'beng', 'bi', 'biao', 'bie', 'bian', 'bin', 'bing', 'bu',
  'pa', 'po', 'pai', 'pei', 'pao', 'pou', 'pan', 'pen', 'pang', 'peng', 'pi', 'piao', 'pie', 'pian', 'pin', 'ping', 'pu',
  'ma', 'mo', 'me', 'mai', 'mei', 'mao', 'mou', 'man', 'men', 'mang', 'meng', 'mi', 'miao', 'mie', 'mian', 'min', 'ming', 'mu',
  'fa', 'fo', 'fei', 'fou', 'fan', 'fen', 'fang', 'feng', 'fu',
  'da', 'de', 'dai', 'dei', 'dao', 'dou', 'dan', 'den', 'dang', 'deng', 'dong', 'di', 'diao', 'die', 'dian', 'ding', 'du', 'duo', 'dui', 'duan', 'dun',
  'ta', 'te', 'tai', 'tao', 'tou', 'tan', 'tang', 'teng', 'tong', 'ti', 'tiao', 'tie', 'tian', 'ting', 'tu', 'tuo', 'tui', 'tuan', 'tun',
  'na', 'ne', 'nai', 'nei', 'nao', 'nou', 'nan', 'nen', 'nang', 'neng', 'nong', 'ni', 'niao', 'nie', 'nian', 'nin', 'niang', 'ning', 'nu', 'nuo', 'nuan', 'nü', 'nüe',
  'la', 'le', 'lai', 'lei', 'lao', 'lou', 'lan', 'lang', 'leng', 'long', 'li', 'lia', 'liao', 'lie', 'lian', 'lin', 'liang', 'ling', 'lu', 'luo', 'luan', 'lun', 'lü', 'lüe',
  'ga', 'ge', 'gai', 'gei', 'gao', 'gou', 'gan', 'gen', 'gang', 'geng', 'gong', 'gu', 'gua', 'guo', 'guai', 'gui', 'guan', 'gun', 'guang',
  'ka', 'ke', 'kai', 'kei', 'kao', 'kou', 'kan', 'ken', 'kang', 'keng', 'kong', 'ku', 'kua', 'kuo', 'kuai', 'kui', 'kuan', 'kun', 'kuang',
  'ha', 'he', 'hai', 'hei', 'hao', 'hou', 'han', 'hen', 'hang', 'heng', 'hong', 'hu', 'hua', 'huo', 'huai', 'hui', 'huan', 'hun', 'huang',
  'ji', 'jia', 'jiao', 'jie', 'jian', 'jin', 'jiang', 'jing', 'jiong', 'ju', 'jue', 'juan', 'jun',
  'qi', 'qia', 'qiao', 'qie', 'qian', 'qin', 'qiang', 'qing', 'qiong', 'qu', 'que', 'quan', 'qun',
  'xi', 'xia', 'xiao', 'xie', 'xian', 'xin', 'xiang', 'xing', 'xiong', 'xu', 'xue', 'xuan', 'xun',
  'zha', 'zhe', 'zhi', 'zhai', 'zhei', 'zhao', 'zhou', 'zhan', 'zhen', 'zhang', 'zheng', 'zhong', 'zhu', 'zhua', 'zhuo', 'zhuai', 'zhui', 'zhuan', 'zhun', 'zhuang',
  'cha', 'che', 'chi', 'chai', 'chao', 'chou', 'chan', 'chen', 'chang', 'cheng', 'chong', 'chu', 'chua', 'chuo', 'chuai', 'chui', 'chuan', 'chun', 'chuang',
  'sha', 'she', 'shi', 'shai', 'shei', 'shao', 'shou', 'shan', 'shen', 'shang', 'sheng', 'shu', 'shua', 'shuo', 'shuai', 'shui', 'shuan', 'shun', 'shuang',
  're', 'ri', 'rao', 'rou', 'ran', 'ren', 'rang', 'reng', 'rong', 'ru', 'rua', 'ruo', 'rui', 'ruan', 'run',
  'za', 'ze', 'zi', 'zai', 'zei', 'zao', 'zou', 'zan', 'zen', 'zang', 'zeng', 'zong', 'zu', 'zuo', 'zui', 'zuan', 'zun',
  'ca', 'ce', 'ci', 'cai', 'cao', 'cou', 'can', 'cen', 'cang', 'ceng', 'cong', 'cu', 'cuo', 'cui', 'cuan', 'cun',
  'sa', 'se', 'si', 'sai', 'sao', 'sou', 'san', 'sen', 'sang', 'seng', 'song', 'su', 'suo', 'sui', 'suan', 'sun',
  'ya', 'yo', 'ye', 'yao', 'you', 'yan', 'yin', 'yang', 'ying', 'yong', 'yu', 'yue', 'yuan', 'yun',
  'wa', 'wo', 'wai', 'wei', 'wan', 'wen', 'wang', 'weng', 'wu'
]);

// Преобразование комбинации инициали и финали в реальный слог по правилам орфографии пиньиня
const getSpelledSyllable = (initial, final) => {
  if (initial === '') return final;
  
  if (['j', 'q', 'x'].includes(initial)) {
    if (final === 'ü') return initial + 'u';
    if (final === 'üe') return initial + 'ue';
    if (final === 'üan') return initial + 'uan';
    if (final === 'ün') return initial + 'un';
    if (final.startsWith('u')) return null;
  }
  
  if (['n', 'l'].includes(initial)) {
    if (final === 'ü') return initial + 'ü';
    if (final === 'üe') return initial + 'üe';
  }

  let comb = initial + final;
  
  if (initial === 'y') {
    if (final === 'i') return 'yi';
    if (final === 'in') return 'yin';
    if (final === 'ing') return 'ying';
    if (final === 'u') return 'yu';
    if (final === 'ü') return 'yu';
    if (final === 'üe') return 'yue';
    if (final === 'üan') return 'yuan';
    if (final === 'ün') return 'yun';
    if (final === 'a') return 'ya';
    if (final === 'ao') return 'yao';
    if (final === 'an') return 'yan';
    if (final === 'ang') return 'yang';
    if (final === 'o') return 'yo';
    if (final === 'e') return 'ye';
    if (final === 'ou') return 'you';
    if (final === 'ong') return 'yong';
  }

  if (initial === 'w') {
    if (final === 'u') return 'wu';
    if (final === 'a') return 'wa';
    if (final === 'o') return 'wo';
    if (final === 'ai') return 'wai';
    if (final === 'ei') return 'wei';
    if (final === 'an') return 'wan';
    if (final === 'en') return 'wen';
    if (final === 'ang') return 'wang';
    if (final === 'eng') return 'weng';
  }

  return comb;
};

// Функция добавления знака тона над гласной (правила пиньиня)
const addToneMark = (syllable, tone) => {
  if (tone === 5 || tone === 0) return syllable;
  
  const toneMarks = {
    a: ['ā', 'á', 'ǎ', 'à'],
    o: ['ō', 'ó', 'ǒ', 'ò'],
    e: ['ē', 'é', 'ě', 'è'],
    i: ['ī', 'í', 'ǐ', 'ì'],
    u: ['ū', 'ú', 'ǔ', 'ù'],
    ü: ['\u01d6', '\u01d8', '\u01da', '\u01dc'], // ǖ, ǘ, ǚ, ǜ
  };

  // Нормализуем ü
  let cleaned = syllable.replace('v', 'ü');
  let chars = cleaned.split('');
  
  let indexToMark = -1;
  
  if (cleaned.includes('a')) {
    indexToMark = cleaned.indexOf('a');
  } else if (cleaned.includes('o')) {
    indexToMark = cleaned.indexOf('o');
  } else if (cleaned.includes('e')) {
    indexToMark = cleaned.indexOf('e');
  } else if (cleaned.includes('ui')) {
    indexToMark = cleaned.indexOf('i');
  } else if (cleaned.includes('iu')) {
    indexToMark = cleaned.indexOf('u');
  } else if (cleaned.includes('i')) {
    indexToMark = cleaned.indexOf('i');
  } else if (cleaned.includes('u')) {
    indexToMark = cleaned.indexOf('u');
  } else if (cleaned.includes('ü')) {
    indexToMark = cleaned.indexOf('ü');
  }

  if (indexToMark !== -1) {
    const vowel = chars[indexToMark];
    if (toneMarks[vowel]) {
      chars[indexToMark] = toneMarks[vowel][tone - 1];
    }
  }

  return chars.join('');
};

export default function PinyinChartPage({ onBack }) {
  const [activeTab, setActiveTab] = useState('simple'); // 'simple' | 'compound' | 'nasal'
  const [selectedSyllable, setSelectedSyllable] = useState(null); // { initial, final, spelled }
  const [isPlaying, setIsPlaying] = useState(null); // какой тон воспроизводится сейчас
  const [audioError, setAudioError] = useState('');

  const currentFinals = finalsGroups[activeTab].list;

  const handlePlayTone = (syllable, tone) => {
    setIsPlaying(tone);
    setAudioError('');
    
    const cleanSyllable = syllable.toLowerCase().replace('ü', 'v');
    const url = `https://cdn.jsdelivr.net/gh/davinfifield/mp3-chinese-pinyin-sound@master/mp3/${cleanSyllable}${tone}.mp3`;
    
    if (window.activeAudio) {
      try {
        window.activeAudio.pause();
        window.activeAudio.currentTime = 0;
      } catch (e) {}
    }
    
    const audio = new Audio(url);
    window.activeAudio = audio;
    
    audio.play()
      .then(() => {
        // Сбрасываем подсветку кнопки
        setTimeout(() => setIsPlaying(null), 850);
      })
      .catch(err => {
        console.warn('Ошибка воспроизведения:', err);
        setAudioError(err.name === 'NotAllowedError' 
          ? 'Браузер заблокировал автозвук. Кликните по странице перед воспроизведением.' 
          : 'Не удалось загрузить аудио слога. Проверьте интернет-соединение.'
        );
        setIsPlaying(null);
      });
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Кнопка назад */}
      <div style={{ marginBottom: '24px' }}>
        <button onClick={onBack} className="btn-neon btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> Вернуться на главную
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h2 className="chinese-char-sm" style={{ 
          fontSize: '2.5rem', 
          background: 'linear-gradient(45deg, var(--neon-cyan), var(--neon-violet))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: '8px'
        }}>
          拼音表 (Таблица Пиньиня)
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Кликните по любому слогу, чтобы услышать правильное произношение во всех 4 тонах
        </p>
      </div>

      {/* Табы категорий гласных */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid var(--border-color)',
        padding: '6px',
        borderRadius: '16px',
        maxWidth: '500px',
        margin: '0 auto 32px auto'
      }}>
        {Object.keys(finalsGroups).map(key => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              setSelectedSyllable(null);
            }}
            className={`btn-neon ${activeTab === key ? 'btn-cyan' : 'btn-secondary'}`}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              boxShadow: activeTab === key ? 'var(--glow-cyan)' : 'none',
              fontSize: '0.9rem',
              borderRadius: '12px'
            }}
          >
            {finalsGroups[key].title}
          </button>
        ))}
      </div>

      {/* Сетка таблицы скролла */}
      <div className="glass-panel" style={{ 
        overflowX: 'auto', 
        borderRadius: '20px', 
        border: '1px solid var(--border-color)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'center',
          fontSize: '1rem',
          minWidth: activeTab === 'simple' ? 'auto' : '850px'
        }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border-color)' }}>
              {/* Левый верхний угол пустой */}
              <th style={{ padding: '16px', color: 'var(--neon-violet)', fontWeight: '700', width: '70px', borderRight: '1px solid var(--border-color)' }}>Иниц \ Фин</th>
              {currentFinals.map(final => (
                <th key={final} style={{ padding: '16px', color: 'var(--neon-cyan)', fontWeight: '700', fontSize: '1.1rem' }}>
                  {final}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {initials.map((initial, rIdx) => (
              <tr key={rIdx} style={{ 
                borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
                background: rIdx % 2 === 0 ? 'transparent' : 'rgba(255, 255, 255, 0.01)'
              }}>
                {/* Заголовок строки (согласный) */}
                <td style={{ 
                  padding: '12px', 
                  fontWeight: '600', 
                  color: 'var(--neon-violet)', 
                  borderRight: '1px solid var(--border-color)',
                  background: 'rgba(11, 15, 25, 0.5)',
                  position: 'sticky',
                  left: 0,
                  zIndex: 2
                }}>
                  {initial === '' ? 'ø' : initial}
                </td>
                
                {/* Слоги */}
                {currentFinals.map(final => {
                  const spelled = getSpelledSyllable(initial, final);
                  const isValid = spelled && validSyllables.has(spelled);
                  
                  return (
                    <td key={final} style={{ padding: '4px' }}>
                      {isValid ? (
                        <button
                          onClick={() => {
                            setSelectedSyllable({ initial, final, spelled });
                            // Сразу проигрываем 1-й тон для мгновенного отклика
                            handlePlayTone(spelled, 1);
                          }}
                          className={`btn-neon ${selectedSyllable?.spelled === spelled ? 'btn-cyan' : 'btn-secondary'}`}
                          style={{
                            width: '100%',
                            minWidth: '55px',
                            padding: '10px 0',
                            border: selectedSyllable?.spelled === spelled ? '1px solid var(--neon-cyan)' : '1px solid transparent',
                            borderRadius: '10px',
                            fontWeight: '500',
                            fontSize: '0.95rem'
                          }}
                        >
                          {spelled}
                        </button>
                      ) : (
                        <span style={{ color: 'rgba(255, 255, 255, 0.1)', fontSize: '0.8rem' }}>-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Окно выбора тона снизу */}
      {selectedSyllable && (
        <div className="glass-panel" style={{ marginTop: '32px', padding: '24px 30px', borderRadius: '20px', textAlign: 'center' }}>
          <h3 style={{ marginBottom: '16px', color: '#fff' }}>
            Тона для слога <span style={{ color: 'var(--neon-cyan)', fontWeight: '700' }}>{selectedSyllable.spelled}</span>
          </h3>


          {audioError && (
            <div style={{
              color: 'var(--neon-red)',
              fontSize: '0.85rem',
              marginBottom: '20px',
              background: 'rgba(255, 51, 102, 0.05)',
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 51, 102, 0.1)',
              display: 'inline-block'
            }}>
              ⚠️ {audioError}
            </div>
          )}

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Нажмите на любую карточку ниже, чтобы прослушать тон
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '16px' }}>
            {[1, 2, 3, 4].map(tone => {
              const toned = addToneMark(selectedSyllable.spelled, tone);
              const toneNames = ['Высокий ровный', 'Восходящий', 'Нисходяще-восх.', 'Нисходящий'];
              const toneArrows = ['ā —', 'á ↗', 'ǎ ↘↗', 'à ↘'];
              const toneName = toneNames[tone - 1];
              const toneArrow = toneArrows[tone - 1];
              const isCurrentPlaying = isPlaying === tone;

              return (
                <button
                  key={tone}
                  onClick={() => handlePlayTone(selectedSyllable.spelled, tone)}
                  className={`btn-neon ${isCurrentPlaying ? 'btn-cyan' : 'btn-secondary'}`}
                  style={{
                    padding: '16px 12px',
                    borderRadius: '14px',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: isCurrentPlaying ? 'var(--glow-cyan)' : 'none',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                >
                  <span style={{ fontSize: '1.8rem', fontWeight: '700', color: isCurrentPlaying ? '#000' : 'var(--neon-cyan)' }}>
                    {toned}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', opacity: 0.8, color: isCurrentPlaying ? '#000' : '#fff' }}>
                    {toneArrow}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: isCurrentPlaying ? 'rgba(0,0,0,0.7)' : 'var(--text-secondary)' }}>
                    {toneName}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
