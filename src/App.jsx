import React, { useState, useEffect } from 'react';
import { API_BASE } from './config';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import StudyPage from './pages/StudyPage';
import ManageCardsPage from './pages/ManageCardsPage';
import PinyinChartPage from './pages/PinyinChartPage';
import ToneTrainerPage from './pages/ToneTrainerPage';
import MatchGamePage from './pages/MatchGamePage';
import SpeedSprintPage from './pages/SpeedSprintPage';
import SentenceBuilderPage from './pages/SentenceBuilderPage';
import FillInBlankPage from './pages/FillInBlankPage';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('study_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Навигация с сохранением в localStorage
  const [currentPage, setCurrentPage] = useState(localStorage.getItem('study_current_page') || 'auth');
  const [activeModuleId, setActiveModuleId] = useState(localStorage.getItem('study_active_module') || null);
  const [studyMode, setStudyMode] = useState('cards'); // 'cards' | 'quiz' | 'dictation'
  const [spacedRepetition, setSpacedRepetition] = useState(false);

  // Глобальный режим отображения: 'hanzi' | 'pinyin'
  const [displayMode, setDisplayMode] = useState(localStorage.getItem('study_display_mode') || 'hanzi');

  const handleToggleDisplayMode = (mode) => {
    setDisplayMode(mode);
    localStorage.setItem('study_display_mode', mode);
  };

  const changePage = (page) => {
    setCurrentPage(page);
    if (page === 'auth') {
      localStorage.removeItem('study_current_page');
    } else {
      localStorage.setItem('study_current_page', page);
    }
  };

  // Проверка сессии при запуске и при F5
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        changePage('auth');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            const savedPage = localStorage.getItem('study_current_page');
            changePage(savedPage && savedPage !== 'auth' ? savedPage : 'dashboard');
          }
        } else if (response.status === 401 || response.status === 403) {
          handleLogout();
        }
      } catch (error) {
        console.error('Ошибка сети при проверке токена:', error);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleLoginSuccess = (newToken, userData) => {
    localStorage.setItem('study_token', newToken);
    setToken(newToken);
    setUser(userData);
    changePage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('study_token');
    localStorage.removeItem('study_current_page');
    localStorage.removeItem('study_active_module');
    setToken('');
    setUser(null);
    changePage('auth');
  };

  const handleSelectModuleStudy = (moduleId, mode = 'cards', spaced = false) => {
    setActiveModuleId(moduleId);
    localStorage.setItem('study_active_module', moduleId);
    setStudyMode(mode);
    setSpacedRepetition(spaced);
    changePage('study');
  };

  const handleSelectModuleManage = (moduleId) => {
    setActiveModuleId(moduleId);
    localStorage.setItem('study_active_module', moduleId);
    changePage('manage');
  };

  const handleBackToDashboard = () => {
    changePage('dashboard');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--bg-dark)',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔄</div>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '500' }}>Проверка авторизации...</h2>
        </div>
      </div>
    );
  }

  // Роутинг страниц
  if (!user || currentPage === 'auth') {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPage === 'study' && activeModuleId) {
    return (
      <StudyPage 
        token={token} 
        moduleId={activeModuleId} 
        initialMode={studyMode}
        initialSpaced={spacedRepetition}
        displayMode={displayMode}
        onBack={handleBackToDashboard} 
      />
    );
  }

  if (currentPage === 'manage' && activeModuleId) {
    return (
      <ManageCardsPage 
        token={token} 
        moduleId={activeModuleId} 
        onBack={handleBackToDashboard} 
      />
    );
  }

  if (currentPage === 'pinyin') {
    return <PinyinChartPage onBack={handleBackToDashboard} />;
  }

  if (currentPage === 'tones') {
    return <ToneTrainerPage onBack={handleBackToDashboard} />;
  }

  if (currentPage === 'match-game') {
    return <MatchGamePage token={token} onBack={handleBackToDashboard} />;
  }

  if (currentPage === 'speed-sprint') {
    return <SpeedSprintPage token={token} displayMode={displayMode} onBack={handleBackToDashboard} />;
  }

  if (currentPage === 'sentence-builder') {
    return <SentenceBuilderPage token={token} onBack={handleBackToDashboard} />;
  }

  if (currentPage === 'fill-blank') {
    return <FillInBlankPage token={token} displayMode={displayMode} onBack={handleBackToDashboard} />;
  }

  return (
    <DashboardPage 
      user={user} 
      token={token} 
      displayMode={displayMode}
      onToggleDisplayMode={handleToggleDisplayMode}
      onLogout={handleLogout}
      onSelectModuleStudy={handleSelectModuleStudy}
      onSelectModuleManage={handleSelectModuleManage}
      onOpenPinyinChart={() => changePage('pinyin')}
      onOpenToneTrainer={() => changePage('tones')}
      onOpenMatchGame={() => changePage('match-game')}
      onOpenSpeedSprint={() => changePage('speed-sprint')}
      onOpenSentenceBuilder={() => changePage('sentence-builder')}
      onOpenFillBlank={() => changePage('fill-blank')}
    />
  );
}
