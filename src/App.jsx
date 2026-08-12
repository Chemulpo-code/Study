import React, { useState, useEffect } from 'react';
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
  
  // Навигация: 'auth' | 'dashboard' | 'study' | 'manage'
  const [currentPage, setCurrentPage] = useState('auth');
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [studyMode, setStudyMode] = useState('cards'); // 'cards' | 'quiz' | 'dictation'
  const [spacedRepetition, setSpacedRepetition] = useState(false);

  // Глобальный режим отображения: 'hanzi' (Иероглифы + Пиньинь) | 'pinyin' (Только Пиньинь для новичков)
  const [displayMode, setDisplayMode] = useState(localStorage.getItem('study_display_mode') || 'hanzi');

  const handleToggleDisplayMode = (mode) => {
    setDisplayMode(mode);
    localStorage.setItem('study_display_mode', mode);
  };

  // Проверка сессии при запуске
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setCurrentPage('auth');
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
            setCurrentPage('dashboard');
          }
        } else if (response.status === 401 || response.status === 403) {
          // Выходим только если бэкенд явно подтвердил, что токен просрочен
          handleLogout();
        }
      } catch (error) {
        console.error('Ошибка сети при проверки токена:', error);
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
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('study_token');
    setToken('');
    setUser(null);
    setCurrentPage('auth');
  };

  const handleSelectModuleStudy = (moduleId, mode = 'cards', spaced = false) => {
    setActiveModuleId(moduleId);
    setStudyMode(mode);
    setSpacedRepetition(spaced);
    setCurrentPage('study');
  };

  const handleSelectModuleManage = (moduleId) => {
    setActiveModuleId(moduleId);
    setCurrentPage('manage');
  };

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard');
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
        <h2>Загрузка приложения...</h2>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      {currentPage === 'auth' && (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
      {currentPage === 'dashboard' && user && (
        <DashboardPage 
          token={token} 
          user={user} 
          displayMode={displayMode}
          onToggleDisplayMode={handleToggleDisplayMode}
          onLogout={handleLogout}
          onSelectModuleStudy={handleSelectModuleStudy}
          onSelectModuleManage={handleSelectModuleManage}
          onGoToPinyinChart={() => setCurrentPage('pinyin-chart')}
          onGoToToneTrainer={() => setCurrentPage('tone-trainer')}
          onGoToMatchGame={() => setCurrentPage('match-game')}
          onGoToSpeedSprint={() => setCurrentPage('speed-sprint')}
          onGoToSentenceBuilder={() => setCurrentPage('sentence-builder')}
          onGoToFillInBlank={() => setCurrentPage('fill-blank')}
        />
      )}
      {currentPage === 'study' && activeModuleId && (
        <StudyPage 
          token={token} 
          moduleId={activeModuleId} 
          mode={studyMode}
          spaced={spacedRepetition}
          displayMode={displayMode}
          onToggleDisplayMode={handleToggleDisplayMode}
          onBackToDashboard={handleBackToDashboard}
        />
      )}
      {currentPage === 'manage' && activeModuleId && (
        <ManageCardsPage 
          token={token} 
          moduleId={activeModuleId} 
          onBackToDashboard={handleBackToDashboard}
        />
      )}
      {currentPage === 'pinyin-chart' && (
        <PinyinChartPage onBack={handleBackToDashboard} />
      )}
      {currentPage === 'tone-trainer' && (
        <ToneTrainerPage onBack={handleBackToDashboard} />
      )}
      {currentPage === 'match-game' && (
        <MatchGamePage token={token} displayMode={displayMode} onBack={handleBackToDashboard} />
      )}
      {currentPage === 'speed-sprint' && (
        <SpeedSprintPage token={token} displayMode={displayMode} onBack={handleBackToDashboard} />
      )}
      {currentPage === 'sentence-builder' && (
        <SentenceBuilderPage token={token} displayMode={displayMode} onBack={handleBackToDashboard} />
      )}
      {currentPage === 'fill-blank' && (
        <FillInBlankPage token={token} displayMode={displayMode} onBack={handleBackToDashboard} />
      )}
    </div>
  );
}
