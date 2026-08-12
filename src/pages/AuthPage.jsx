import React, { useState } from 'react';
import { Lock, User } from '../components/Icons';
import { API_BASE } from '../config';

export default function AuthPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px'
    }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '420px',
        padding: '40px 30px',
        borderRadius: '24px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="chinese-char-sm" style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            background: 'linear-gradient(45deg, var(--neon-cyan), var(--neon-violet))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px',
            marginBottom: '8px'
          }}>
            学习卡片
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Китайский по карточкам с синхронизацией
          </p>
        </div>

        {/* Табы */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.03)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          marginBottom: '24px'
        }}>
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`btn-neon ${isLogin ? 'btn-cyan' : 'btn-secondary'}`}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              boxShadow: isLogin ? 'var(--glow-cyan)' : 'none',
              fontSize: '0.9rem'
            }}
          >
            Вход
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`btn-neon ${!isLogin ? 'btn-violet' : 'btn-secondary'}`}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              boxShadow: !isLogin ? 'var(--glow-violet)' : 'none',
              fontSize: '0.9rem'
            }}
          >
            Регистрация
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 51, 102, 0.1)',
            border: '1px solid rgba(255, 51, 102, 0.3)',
            color: '#ff668c',
            padding: '12px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Поле логина */}
          <div style={{ marginBottom: '18px', position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <User size={18} />
            </span>
            <input 
              type="text" 
              placeholder="Имя пользователя"
              className="input-glass"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              style={{ paddingLeft: '44px' }}
            />
          </div>

          {/* Поле пароля */}
          <div style={{ marginBottom: '28px', position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Lock size={18} />
            </span>
            <input 
              type="password" 
              placeholder="Пароль"
              className="input-glass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{ paddingLeft: '44px' }}
            />
          </div>

          {/* Кнопка отправки */}
          <button 
            type="submit"
            className={`btn-neon ${isLogin ? 'btn-cyan' : 'btn-violet'}`}
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            {loading ? 'Загрузка...' : isLogin ? 'Войти в аккаунт' : 'Создать аккаунт'}
          </button>
        </form>

        <div style={{ 
          marginTop: '24px', 
          textAlign: 'center', 
          fontSize: '0.8rem', 
          color: 'var(--text-secondary)',
          lineHeight: '1.4'
        }}>
          {!isLogin ? 
            'При регистрации будут созданы стартовые демонстрационные модули со словами для тестирования приложения.' : 
            'Введите логин и пароль для входа и продолжения обучения на любом устройстве.'}
        </div>
      </div>
    </div>
  );
}
