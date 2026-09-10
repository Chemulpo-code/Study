import React, { lazy, Suspense, useState, useEffect } from 'react';
import { API_BASE } from './config';
import AuthPage from './pages/AuthPage';
import { useToast } from './components/ToastContext';
import { syncOfflineProgressBatch } from './utils/offlineStorage';

const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const StudyPage = lazy(() => import('./pages/StudyPage'));
const ManageCardsPage = lazy(() => import('./pages/ManageCardsPage'));
const PinyinChartPage = lazy(() => import('./pages/PinyinChartPage'));
const ToneTrainerPage = lazy(() => import('./pages/ToneTrainerPage'));
const MatchGamePage = lazy(() => import('./pages/MatchGamePage'));
const SpeedSprintPage = lazy(() => import('./pages/SpeedSprintPage'));
const SentenceBuilderPage = lazy(() => import('./pages/SentenceBuilderPage'));
const FillInBlankPage = lazy(() => import('./pages/FillInBlankPage'));
const HandsFreeAudioPage = lazy(() => import('./pages/HandsFreeAudioPage'));
const ContextDialoguesPage = lazy(() => import('./pages/ContextDialoguesPage'));

function PageLoader({ label = 'Открываем учебный кабинет…' }) {
  return <div className="page-loader" role="status"><span className="loader" /><span>{label}</span></div>;
}

export default function App() {
  const { showToast } = useToast();
  const [token, setToken] = useState(localStorage.getItem('study_token') || '');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modulesList, setModulesList] = useState([]);
  
  // Автоматическая синхронизация офлайн-прогресса при появлении интернета
  useEffect(() => {
    const handleOnline = () => {
      if (token) {
        syncOfflineProgressBatch(token, showToast);
      }
    };

    window.addEventListener('online', handleOnline);
    // Пробуем синхронизировать при запуске
    if (navigator.onLine && token) {
      syncOfflineProgressBatch(token, showToast);
    }

    return () => window.removeEventListener('online', handleOnline);
  }, [token, showToast]);

  useEffect(() => {
    if (token) {
      fetch(`${API_BASE}/api/modules`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setModulesList(data); })
      .catch(() => {});
    }
  }, [token]);
  
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

  const withSuspense = (content) => <Suspense fallback={<PageLoader />}>{content}</Suspense>;

  if (loading) {
    return <PageLoader label="Проверяем авторизацию…" />;
  }

  // Роутинг страниц
  if (!user || currentPage === 'auth') {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  if (currentPage === 'study' && activeModuleId) {
    return withSuspense(
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
    return withSuspense(
      <ManageCardsPage 
        token={token} 
        moduleId={activeModuleId} 
        onBack={handleBackToDashboard}
      />
    );
  }

  if (currentPage === 'pinyin') {
    return withSuspense(<PinyinChartPage onBack={handleBackToDashboard} />);
  }

  if (currentPage === 'tones') {
    return withSuspense(<ToneTrainerPage onBack={handleBackToDashboard} />);
  }

  if (currentPage === 'match-game') {
    return withSuspense(<MatchGamePage token={token} onBack={handleBackToDashboard} />);
  }

  if (currentPage === 'speed-sprint') {
    return withSuspense(<SpeedSprintPage token={token} displayMode={displayMode} onBack={handleBackToDashboard} />);
  }

  if (currentPage === 'sentence-builder') {
    return withSuspense(<SentenceBuilderPage token={token} onBack={handleBackToDashboard} />);
  }

  if (currentPage === 'fill-blank') {
    return withSuspense(<FillInBlankPage token={token} onBack={handleBackToDashboard} />);
  }

  if (currentPage === 'hands-free') {
    return withSuspense(<HandsFreeAudioPage token={token} modules={modulesList} onBack={handleBackToDashboard} />);
  }

  if (currentPage === 'dialogues') {
    return withSuspense(<ContextDialoguesPage token={token} modules={modulesList} onBack={handleBackToDashboard} />);
  }

  return withSuspense(
    <DashboardPage 
      user={user} 
      token={token} 
      displayMode={displayMode}
      lastModuleId={activeModuleId}
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
      onSelectHandsFree={() => changePage('hands-free')}
      onSelectDialogues={() => changePage('dialogues')}
    />
  );
}
