import React, { useState } from 'react';
import { Check, Eye, EyeOff, Lock, Play, User, Volume2 } from '../components/Icons';
import { API_BASE } from '../config';

const features = [['记', 'Память на твоей стороне', 'Алгоритм повторения возвращает слово в нужный момент — прежде, чем ты его забудешь.'], ['词', 'Твой путь, твои словари', 'Собирай темы для путешествия, работы и живого общения.'], ['语', 'Иероглифы обретают смысл', 'Карточки, пиньинь, аудио и примеры превращают знак в понятную фразу.']];
const trainers = [['拼', 'Таблица слогов', 'Произношение'], ['声', 'Тренажёр тонов', 'Аудирование'], ['速', 'Скоростной спринт', 'Скорость'], ['配', 'Найди пару', 'Память'], ['句', 'Конструктор фраз', 'Грамматика'], ['填', 'Заполнение пропусков', 'Практика'], ['听', 'Слушай на ходу', 'Аудио'], ['谈', 'Микро-диалоги', 'Общение']];

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [word, setWord] = useState(0);
  const words = [['你好', 'nǐ hǎo', 'Привет'], ['谢谢', 'xièxie', 'Спасибо'], ['朋友', 'péngyou', 'Друг']];

  const openAuth = (login) => {
    setIsLogin(login); setError('');
    document.getElementById('auth')?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  };
  const speak = () => {
    if (!('speechSynthesis' in window)) return setError('Озвучка недоступна в этом браузере.');
    const utterance = new SpeechSynthesisUtterance(words[word][0]);
    utterance.lang = 'zh-CN'; utterance.rate = 0.8;
    window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
  };
  const handleSubmit = async (event) => {
    event.preventDefault(); setError('');
    if (!username.trim() || !password.trim()) return setError('Заполните имя пользователя и пароль.');
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}${isLogin ? '/api/auth/login' : '/api/auth/register'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Не удалось выполнить авторизацию.');
      onLoginSuccess(data.token, data.user);
    } catch (requestError) { setError(requestError.message || 'Не удалось связаться с сервером.'); } finally { setLoading(false); }
  };

  return <main className="landing-page">
    <header className="landing-header landing-wrap"><a className="landing-brand" href="#top" aria-label="Chinese Study"><b>中</b>Chinese<span>Study</span></a><nav aria-label="Навигация лендинга"><a href="#features">Возможности</a><a href="#trainers">Тренажёры</a><a href="#approach">Как это работает</a></nav><div className="landing-header__actions"><button type="button" className="landing-link" onClick={() => openAuth(true)}>Войти</button><button type="button" className="landing-button landing-button--small" onClick={() => openAuth(false)}>Начать бесплатно <span>↗</span></button></div></header>

    <section id="top" className="landing-hero landing-wrap"><div className="landing-hero__copy"><p className="landing-kicker"><i />Твой китайский начинается здесь</p><h1>Заговори<br />на китайском.<br /><em>Без зубрёжки.</em></h1><p className="landing-intro">Живые диалоги, умные карточки и тренажёры, в которые хочется возвращаться. Преврати «это сложно» в <b>«我可以 — я могу».</b></p><div className="landing-hero__actions"><button type="button" className="landing-button" onClick={() => openAuth(false)}>Начать бесплатно <span>↗</span></button><a className="landing-button landing-button--quiet" href="#demo"><Play size={14} aria-hidden="true" />Попробовать сейчас</a></div><p className="landing-micro"><Check size={14} aria-hidden="true" />Без банковской карты <span>·</span> 15 минут в день</p><div className="landing-stats"><div><strong>HSK 1–6</strong><span>от первых слов к свободе</span></div><div><strong>8 режимов</strong><span>никакой скучной рутины</span></div><div><strong>SM-2</strong><span>знания остаются с тобой</span></div></div></div><div className="landing-art"><div className="landing-art__label">少一点死记硬背，多一点交流。<span>Меньше зубрёжки. Больше общения.</span></div><img src="/hero.png" alt="Друзья общаются на китайском в неоновом кафе" /><div className="landing-art__footer"><strong>你好，世界。</strong><span>ПРИВЕТ, МИР. ↗</span></div><div className="landing-art__float"><b>谈</b><span>Первый диалог — уже сегодня<small>小步前进 · Двигайся маленькими шагами</small></span></div></div></section>

    <div className="landing-ticker"><div className="landing-wrap"><strong>中文，让世界更近</strong><span>Китайский делает мир ближе</span><strong>学 · 玩 · 记住</strong><span>Учись. Играй. Запоминай.</span></div></div>
    <section id="features" className="landing-section landing-wrap"><div className="landing-section__head"><div><p className="landing-kicker">01 / Учись с умом</p><h2>Не больше усилий.<br /><em>Больше результата.</em></h2></div><p>Всё, что нужно для китайского,<br />собрано в одной системе.</p></div><div className="landing-features">{features.map(([mark, title, description]) => <article key={title}><b>{mark}</b><h3>{title}</h3><p>{description}</p><small>{mark === '记' ? 'Ты оцениваешь. Система планирует.' : mark === '词' ? 'HSK 1 · Путешествия · Мои слова' : 'Видишь логику — легче запоминаешь.'}</small></article>)}</div></section>
    <section id="demo" className="landing-demo"><div className="landing-wrap landing-demo__grid"><div><p className="landing-kicker">Твоё первое слово</p><h2>Уже знаешь больше,<br />чем минуту назад.</h2><p>Нажми на карточку, чтобы увидеть перевод. Послушай слово. Скажи его вслух.</p><span className="landing-demo__note">↗ Попробуй — регистрация не нужна</span></div><div className="landing-flashcard"><div><span>HSK 1 · ЗНАКОМСТВО</span><span>0{word + 1} / 03</span></div><button type="button" className="landing-flashcard__word" onClick={() => setFlipped(value => !value)} aria-label="Перевернуть карточку"><strong>{flipped ? words[word][2] : words[word][0]}</strong><span>{words[word][1]}</span><small>{flipped ? 'Нажми, чтобы показать иероглифы' : 'Нажми, чтобы узнать перевод'}</small></button><footer><button type="button" onClick={speak}><Volume2 size={17} aria-hidden="true" />Слушать</button><button type="button" onClick={() => { setWord(value => (value + 1) % words.length); setFlipped(false); }}>Следующее слово →</button></footer></div></div></section>
    <section id="trainers" className="landing-section landing-wrap"><div className="landing-section__head"><div><p className="landing-kicker">02 / Входи в поток</p><h2>Учёба, которая <em>затягивает.</em></h2></div><p>8 способов сказать скуке 再见.<br />Выбери свой режим.</p></div><div className="landing-trainers">{trainers.map(([mark, title, type]) => <button key={title} type="button" onClick={() => openAuth(false)}><span>{mark}</span><i>↗</i><strong>{title}</strong><small>{type}</small></button>)}</div><div className="landing-mistakes"><b>↻</b><span><strong>Ошибки — тоже часть прогресса.</strong> Сложные слова собираются в отдельную тренировку.</span><small>РАБОТА НАД ОШИБКАМИ</small></div></section>
    <section id="approach" className="landing-benefits landing-wrap"><article><b>15</b><h3>Минут для себя</h3><p>Маленькая ежедневная привычка. Большой шаг к свободному общению.</p></article><article><b>听</b><h3>Слушай. Чувствуй. Говори.</h3><p>Живая озвучка и медленный режим, чтобы расслышать каждую деталь.</p></article><article><b>中</b><h3>Китайский всегда рядом</h3><p>На большом экране и в телефоне. Продолжай там, где удобно.</p></article></section>
    <section id="auth" className="landing-auth landing-wrap"><div><p className="landing-kicker">03 / Твоя новая глава</p><h2>Однажды ты скажешь:<br /><em>«Я понимаю<br />по-китайски».</em></h2><p>Пусть это «однажды» начнётся сегодня.</p><ul><li><Check size={16} aria-hidden="true" />Начни с самых нужных слов</li><li><Check size={16} aria-hidden="true" />Найди свой любимый тренажёр</li><li><Check size={16} aria-hidden="true" />Двигайся в собственном темпе</li></ul><strong className="landing-auth__hanzi">开始吧。</strong></div><section className="landing-auth__card" aria-labelledby="auth-title"><div className="landing-tabs" role="tablist" aria-label="Авторизация"><button type="button" role="tab" aria-selected={!isLogin} onClick={() => { setIsLogin(false); setError(''); }}>Регистрация</button><button type="button" role="tab" aria-selected={isLogin} onClick={() => { setIsLogin(true); setError(''); }}>Вход</button></div><h2 id="auth-title">{isLogin ? 'С возвращением!' : 'Привет, будущий полиглот!'}</h2><p>{isLogin ? 'Продолжим твоё путешествие в китайский.' : 'Твой первый шаг к китайскому.'}</p>{error && <div className="landing-auth__error" role="alert">{error}</div>}<form onSubmit={handleSubmit}><label htmlFor="username">Имя пользователя<div><User size={17} aria-hidden="true" /><input id="username" name="username" autoComplete="username" minLength="3" placeholder="Например, Sergei" value={username} onChange={event => setUsername(event.target.value)} disabled={loading} required /></div></label><label htmlFor="password">Пароль<div><Lock size={17} aria-hidden="true" /><input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} minLength="6" placeholder="Не менее 6 символов" value={password} onChange={event => setPassword(event.target.value)} disabled={loading} required /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label><button className="landing-button landing-auth__submit" type="submit" disabled={loading}>{loading ? 'Проверяем…' : isLogin ? 'Войти в кабинет' : 'Создать аккаунт'} <span>↗</span></button></form><small>Без привязки банковской карты</small></section></section>
    <footer className="landing-footer landing-wrap"><a className="landing-brand" href="#top"><b>中</b>Chinese<span>Study</span></a><span>Маленькие шаги. Большой мир.</span><small>© {new Date().getFullYear()} Chinese Study</small></footer>
  </main>;
}
