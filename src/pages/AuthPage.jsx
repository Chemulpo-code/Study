import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff } from '../components/Icons';
import { API_BASE } from '../config';
import { Button, Panel } from '../components/UI';

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username.trim() || !password.trim()) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Сервер вернул неверный ответ. Откройте сайт по HTTPS (https://) и обновите стек в Portainer!');
      }

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Произошла ошибка авторизации');
      }

      onLoginSuccess(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-intro" aria-labelledby="auth-title">
        <span className="auth-intro__mark" aria-hidden="true">习</span>
        <span className="eyebrow">Ежедневная практика</span>
        <h1 id="auth-title">Китайский, который остаётся с вами.</h1>
        <p>Карточки, речь и письмо в спокойном ритме — на любом устройстве.</p>
        <div className="auth-intro__note">
          <strong>一点一点</strong>
          <span>Шаг за шагом</span>
        </div>
      </section>

      <Panel className="auth-card">
        <div className="auth-card__heading">
          <span className="seal" aria-hidden="true">学</span>
          <div>
            <span className="eyebrow">Учебный кабинет</span>
            <h2>{isLogin ? 'С возвращением' : 'Начните путь'}</h2>
          </div>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Авторизация">
          <button type="button" role="tab" aria-selected={isLogin} onClick={() => { setIsLogin(true); setError(''); }}>Вход</button>
          <button type="button" role="tab" aria-selected={!isLogin} onClick={() => { setIsLogin(false); setError(''); }}>Регистрация</button>
        </div>

        {error && <div className="auth-error" role="alert" aria-live="polite">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field-label" htmlFor="username">Имя пользователя</label>
            <div className="field-with-icon">
              <User size={18} aria-hidden="true" />
              <input id="username" name="username" type="text" autoComplete="username" placeholder="Например, Sergei" className="field-control" value={username} onChange={(e) => setUsername(e.target.value)} disabled={loading} />
            </div>
          </div>

          <div className="field">
            <label className="field-label" htmlFor="password">Пароль</label>
            <div className="field-with-icon">
              <Lock size={18} aria-hidden="true" />
              <input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isLogin ? 'current-password' : 'new-password'} placeholder="Введите пароль" className="field-control" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} />
              <button type="button" className="field-with-icon__action" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}>
                {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <Button type="submit" variant="primary" size="lg" disabled={loading} className="auth-submit">
            {loading ? 'Проверяем…' : isLogin ? 'Войти и продолжить' : 'Создать аккаунт'}
          </Button>
        </form>

        <p className="auth-card__hint">
          {isLogin ? 'Ваш прогресс синхронизируется между устройствами.' : 'После регистрации появятся стартовые модули для знакомства с приложением.'}
        </p>
      </Panel>
    </main>
  );
}
