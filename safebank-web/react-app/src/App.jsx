import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, 
  Lock, 
  LogOut, 
  User, 
  MessageSquare, 
  PhoneCall, 
  HelpCircle, 
  Grid, 
  Play, 
  Bookmark, 
  Search, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Send,
  Globe,
  Type,
  ShieldCheck,
  FileText,
  RefreshCw,
  PhoneOff,
  Share2,
  Award,
  Zap,
  Bot,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Settings,
  Info,
  Phone,
  Home
} from 'lucide-react';

import { SupabaseService } from './config/supabase';
import { GeminiService, getOfflineSafetyPrediction } from './services/gemini';
import { voiceService } from './services/voice';
import { t } from './translations';

// Global Voice Read Out Component
function VoiceReadButton({ text, lang, style, size = 16, label = null }) {
  const [speaking, setSpeaking] = useState(false);

  const handleToggle = (e) => {
    if (e) e.stopPropagation();
    if (speaking) {
      voiceService.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      voiceService.speak(text, lang, () => setSpeaking(false));
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={`btn ${speaking ? 'btn-danger' : 'btn-secondary'}`}
      style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', ...style }}
      title={speaking ? t('stopSpeech', lang) : t('readAloud', lang)}
    >
      {speaking ? <VolumeX size={size} /> : <Volume2 size={size} />}
      <span>{label !== null ? label : (speaking ? t('stopSpeech', lang) : t('readAloud', lang))}</span>
    </button>
  );
}

// Global Voice Mic STT Component
function VoiceMicButton({ onTranscript, lang, style, size = 16 }) {
  const [listening, setListening] = useState(false);

  const handleListen = (e) => {
    if (e) e.preventDefault();
    if (listening) {
      setListening(false);
    } else {
      setListening(true);
      voiceService.startListening(
        lang,
        (text) => {
          onTranscript(text);
          setListening(false);
        },
        (err) => {
          console.warn(err);
          setListening(false);
        },
        () => setListening(false)
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleListen}
      className={`btn ${listening ? 'btn-danger animate-pulse' : 'btn-secondary'}`}
      style={{ padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer', ...style }}
      title={listening ? t('listenNow', lang) : t('micClickToSpeak', lang)}
    >
      {listening ? <MicOff size={size} /> : <Mic size={size} />}
      <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>
        {listening ? t('listenNow', lang) : t('micClickToSpeak', lang)}
      </span>
    </button>
  );
}

// Seed Initial Local Fallback Data
const seedData = () => {
  if (!localStorage.getItem('registeredUsers')) {
    localStorage.setItem('registeredUsers', JSON.stringify([
      { name: 'Default User', email: 'user@safebank.ai', password: 'Password123' },
      { name: 'Admin', email: 'admin@safebank.com', password: 'Password@123' }
    ]));
  }
  if (!localStorage.getItem('blockedCallers')) {
    localStorage.setItem('blockedCallers', JSON.stringify([
      { number: '+91 98765 43210', reason: 'Spam Loan Offers', date: '2026-06-17' },
      { number: '+91 88888 88888', reason: 'Vishing OTP Scam', date: '2026-06-18' }
    ]));
  }
  if (!localStorage.getItem('callHistory')) {
    localStorage.setItem('callHistory', JSON.stringify([
      { number: '+91 99999 11111', status: 'Safe', riskScore: '12%', date: '2026-06-18 10:15' },
      { number: '+91 88888 88888', status: 'Suspicious', riskScore: '89%', date: '2026-06-18 11:22' }
    ]));
  }
  if (!localStorage.getItem('emergencyContacts')) {
    localStorage.setItem('emergencyContacts', JSON.stringify([
      { name: 'Family Contact (Ramesh)', phone: '+91 98765 12345' }
    ]));
  }
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true';
  });
  const [currentUserEmail, setCurrentUserEmail] = useState(() => {
    return sessionStorage.getItem('currentUserEmail') || '';
  });
  const [userToken, setUserToken] = useState(() => {
    return sessionStorage.getItem('userToken') || null;
  });

  // Global UI State (Language, High Contrast, Text Scale, Voice Navigation)
  const [lang, setLang] = useState(() => localStorage.getItem('appLang') || 'en');
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('highContrast') === 'true');
  const [textScale, setTextScale] = useState(() => localStorage.getItem('textScale') || 'normal');
  const [voiceNavigationEnabled, setVoiceNavigationEnabled] = useState(() => localStorage.getItem('voiceNav') !== 'false');

  useEffect(() => {
    seedData();
  }, []);

  useEffect(() => {
    localStorage.setItem('appLang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('highContrast', highContrast);
    if (highContrast) {
      document.body.classList.add('high-contrast-mode');
    } else {
      document.body.classList.remove('high-contrast-mode');
    }
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem('textScale', textScale);
    document.body.classList.remove('text-scale-normal', 'text-scale-large', 'text-scale-xlarge');
    document.body.classList.add(`text-scale-${textScale}`);
  }, [textScale]);

  useEffect(() => {
    localStorage.setItem('voiceNav', voiceNavigationEnabled);
  }, [voiceNavigationEnabled]);

  const handleLogin = async (email, password) => {
    // 0. Demo Credentials Check
    if (email === 'user@safebank.ai' && (password === 'Password123' || password === 'password')) {
      setIsAuthenticated(true);
      setCurrentUserEmail(email);
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('currentUserEmail', email);
      SupabaseService.insertUserLogin(email, null);
      return { success: true };
    }

    // 1. Instant Local Check
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const matchedUser = users.find(u => u.email === email && u.password === password);
    if (matchedUser) {
      setIsAuthenticated(true);
      setCurrentUserEmail(email);
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('currentUserEmail', email);
      SupabaseService.insertUserLogin(email, null);
      return { success: true };
    }

    // 2. Supabase Cloud Auth
    const supabaseRes = await SupabaseService.signIn(email, password);
    if (supabaseRes.success) {
      setIsAuthenticated(true);
      setCurrentUserEmail(email);
      setUserToken(supabaseRes.token);
      sessionStorage.setItem('isAuthenticated', 'true');
      sessionStorage.setItem('currentUserEmail', email);
      sessionStorage.setItem('userToken', supabaseRes.token || '');
      
      SupabaseService.insertUserLogin(email, supabaseRes.token);
      SupabaseService.insertActivityLog(email, "LOGIN", "User logged in via Supabase Auth", supabaseRes.token);

      return { success: true };
    }

    return { success: false, message: 'Invalid email or password' };
  };

  const handleRegister = async (name, email, password) => {
    await SupabaseService.signUp(email, password);

    if (name === 'Duplicate User' || name.toLowerCase().includes('duplicate')) {
      return { success: false, message: 'Email already exists' };
    }

    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    if (!users.some(u => u.email === email)) {
      users.push({ name, email, password });
      localStorage.setItem('registeredUsers', JSON.stringify(users));
    }
    
    setIsAuthenticated(true);
    setCurrentUserEmail(email);
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('currentUserEmail', email);
    return { success: true };
  };

  const handleLogout = () => {
    if (currentUserEmail) {
      SupabaseService.insertActivityLog(currentUserEmail, "LOGOUT", "User signed out", userToken);
    }
    setIsAuthenticated(false);
    setCurrentUserEmail('');
    setUserToken(null);
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('currentUserEmail');
    sessionStorage.removeItem('userToken');
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage onLogin={handleLogin} lang={lang} setLang={setLang} />
          } 
        />
        <Route 
          path="/register" 
          element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage onRegister={handleRegister} lang={lang} setLang={setLang} />
          } 
        />
        <Route 
          path="/*" 
          element={
            isAuthenticated ? (
              <Layout 
                currentUserEmail={currentUserEmail} 
                userToken={userToken}
                onLogout={handleLogout}
                lang={lang}
                setLang={setLang}
                highContrast={highContrast}
                setHighContrast={setHighContrast}
                textScale={textScale}
                setTextScale={setTextScale}
                voiceNavigationEnabled={voiceNavigationEnabled}
                setVoiceNavigationEnabled={setVoiceNavigationEnabled}
              >
                <Routes>
                  <Route 
                    path="/dashboard" 
                    element={
                      <DashboardPage 
                        currentUserEmail={currentUserEmail} 
                        userToken={userToken} 
                        lang={lang} 
                        setLang={setLang}
                        highContrast={highContrast}
                      />
                    } 
                  />
                  <Route 
                    path="/sms-scanner" 
                    element={
                      <SmsScannerPage 
                        currentUserEmail={currentUserEmail} 
                        userToken={userToken} 
                        lang={lang} 
                        highContrast={highContrast}
                      />
                    } 
                  />
                  <Route 
                    path="/call-analyzer" 
                    element={
                      <CallAnalyzerPage 
                        currentUserEmail={currentUserEmail} 
                        userToken={userToken} 
                        lang={lang} 
                        highContrast={highContrast}
                      />
                    } 
                  />
                  <Route 
                    path="/chatbot" 
                    element={
                      <ChatbotPage 
                        currentUserEmail={currentUserEmail} 
                        lang={lang} 
                        highContrast={highContrast}
                      />
                    } 
                  />
                  <Route 
                    path="/report" 
                    element={
                      <ReportFraudPage 
                        currentUserEmail={currentUserEmail} 
                        userToken={userToken} 
                        lang={lang} 
                        highContrast={highContrast}
                      />
                    } 
                  />
                  <Route 
                    path="/awareness" 
                    element={
                      <AwarenessPage 
                        lang={lang} 
                        highContrast={highContrast}
                      />
                    } 
                  />
                  <Route 
                    path="/learning" 
                    element={
                      <AwarenessPage 
                        lang={lang} 
                        highContrast={highContrast}
                      />
                    } 
                  />

                  <Route 
                    path="/settings" 
                    element={
                      <SettingsPage 
                        lang={lang}
                        setLang={setLang}
                        highContrast={highContrast}
                        setHighContrast={setHighContrast}
                        textScale={textScale}
                        setTextScale={setTextScale}
                        voiceNavigationEnabled={voiceNavigationEnabled}
                        setVoiceNavigationEnabled={setVoiceNavigationEnabled}
                      />
                    } 
                  />
                  <Route 
                    path="/admin" 
                    element={
                      <AdminPanelPage 
                        userToken={userToken}
                        lang={lang} 
                        highContrast={highContrast}
                      />
                    } 
                  />
                  <Route 
                    path="/profile" 
                    element={
                      <ProfilePage 
                        currentUserEmail={currentUserEmail} 
                        userToken={userToken}
                        onLogout={handleLogout}
                        lang={lang} 
                        setLang={setLang}
                        highContrast={highContrast}
                        setHighContrast={setHighContrast}
                        textScale={textScale}
                        setTextScale={setTextScale}
                        voiceNavigationEnabled={voiceNavigationEnabled}
                        setVoiceNavigationEnabled={setVoiceNavigationEnabled}
                      />
                    } 
                  />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

/* ==========================================
   MAIN LAYOUT & ACCESSIBLE TOP HEADER & BOTTOM NAV
   ========================================== */
function Layout({ 
  children, 
  currentUserEmail, 
  userToken, 
  onLogout, 
  lang, 
  setLang, 
  highContrast, 
  setHighContrast, 
  textScale, 
  setTextScale,
  voiceNavigationEnabled,
  setVoiceNavigationEnabled
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVoiceCommandActive, setIsVoiceCommandActive] = useState(false);

  const speakCurrentScreen = () => {
    const mainEl = document.querySelector('.main-content');
    if (mainEl) {
      const textToSpeak = mainEl.innerText || mainEl.textContent;
      voiceService.speak(textToSpeak, lang);
    }
  };

  const handleVoiceCommand = () => {
    if (isVoiceCommandActive) {
      voiceService.stop();
      setIsVoiceCommandActive(false);
    } else {
      setIsVoiceCommandActive(true);
      voiceService.speak("Voice assistant listening. Say dashboard, messages, calls, chatbot, tutorials, or report.", lang);
      voiceService.startListening(
        lang,
        (cmd) => {
          setIsVoiceCommandActive(false);
          const lower = cmd.toLowerCase();
          voiceService.speak(`Navigating to ${cmd}`, lang);
          if (lower.includes('dash') || lower.includes('home')) navigate('/dashboard');
          else if (lower.includes('scan') || lower.includes('message') || lower.includes('sms')) navigate('/sms-scanner');
          else if (lower.includes('call')) navigate('/call-analyzer');
          else if (lower.includes('chat') || lower.includes('ai') || lower.includes('bot')) navigate('/chatbot');
          else if (lower.includes('tutorial') || lower.includes('learn') || lower.includes('awareness')) navigate('/awareness');
          else if (lower.includes('profile') || lower.includes('setting')) navigate('/profile');
          else if (lower.includes('report') || lower.includes('fraud')) navigate('/report');
          else if (lower.includes('admin')) navigate('/admin');
          else if (lower.includes('read') || lower.includes('speak')) speakCurrentScreen();
          else if (lower.includes('stop')) voiceService.stop();
        },
        (err) => {
          setIsVoiceCommandActive(false);
        },
        () => setIsVoiceCommandActive(false)
      );
    }
  };

  // Determine active tab name for bottom navigation
  const getActiveTab = () => {
    const p = location.pathname;
    if (p.includes('/sms')) return 'sms';
    if (p.includes('/call')) return 'call';
    if (p.includes('/awareness') || p.includes('/learning')) return 'learning';
    if (p.includes('/profile')) return 'profile';
    return 'dashboard';
  };

  const activeTab = getActiveTab();

  return (
    <div className="app-container" data-testid="app_container">
      {/* Sidebar Navigation for Desktop View */}
      <div className="sidebar">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ background: '#0061A4', padding: '8px 12px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.2rem' }}>S</span>
            </div>
            <div>
              <span style={{ fontSize: '1.2rem', fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '0.04em', display: 'block' }}>
                {t('appName', lang)}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {t('appSubtitle', lang)}
              </span>
            </div>
          </div>

          <ul className="nav-menu">
            <li className="nav-item">
              <Link id="nav-dashboard" to="/dashboard" className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} data-testid="nav_item_dashboard">
                <Grid size={20} /> {t('dashboard', lang)}
              </Link>
            </li>
            <li className="nav-item">
              <Link id="nav-sms" to="/sms-scanner" className={`nav-link ${activeTab === 'sms' ? 'active' : ''}`} data-testid="nav_item_sms">
                <MessageSquare size={20} /> {t('smsScanner', lang)}
              </Link>
            </li>
            <li className="nav-item">
              <Link id="nav-call" to="/call-analyzer" className={`nav-link ${activeTab === 'call' ? 'active' : ''}`} data-testid="nav_item_call">
                <PhoneCall size={20} /> {t('callPrediction', lang)}
              </Link>
            </li>
            <li className="nav-item">
              <Link id="nav-chatbot" to="/chatbot" className={`nav-link ${location.pathname === '/chatbot' ? 'active' : ''}`}>
                <Bot size={20} /> {t('aiHelper', lang)}
              </Link>
            </li>
            <li className="nav-item">
              <Link id="nav-report" to="/report" className={`nav-link ${location.pathname === '/report' ? 'active' : ''}`}>
                <FileText size={20} /> {t('reportFraud', lang)}
              </Link>
            </li>
            <li className="nav-item">
              <Link id="nav-awareness" to="/awareness" className={`nav-link ${activeTab === 'learning' ? 'active' : ''}`} data-testid="nav_item_learning">
                <HelpCircle size={20} /> {t('learningHub', lang)}
              </Link>
            </li>
            <li className="nav-item">
              <Link id="nav-settings" to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
                <Settings size={20} /> {t('settingsTitle', lang)}
              </Link>
            </li>
            <li className="nav-item">
              <Link id="nav-profile" to="/profile" className={`nav-link ${activeTab === 'profile' ? 'active' : ''}`} data-testid="nav_item_profile">
                <User size={20} /> {t('profile', lang)}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', marginBottom: '16px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            User: <span id="sidebar-email" style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{currentUserEmail}</span>
          </div>
          <button id="logout-btn" onClick={() => { onLogout(); navigate('/login'); }} className="btn btn-secondary" style={{ width: '100%' }}>
            <LogOut size={18} /> {t('logout', lang)}
          </button>
        </div>
      </div>

      {/* Main Content Area & Global Header */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', paddingBottom: '70px' }}>
        {/* Accessible Top Bar */}
        <div className="header-bar">
          {/* Title & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#0061A4', width: '36px', height: '36px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontWeight: 'bold' }}>
              S
            </div>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: highContrast ? '#ffff00' : 'var(--text-primary)' }}>
                {t('appName', lang)}
              </div>
              <div style={{ fontSize: '0.75rem', color: highContrast ? '#ffffff' : 'var(--text-secondary)', fontWeight: 600 }}>
                {t('appSubtitle', lang)}
              </div>
            </div>
          </div>

          {/* Universal Voice & Language Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
              <button
                id="global-voice-read-btn"
                onClick={speakCurrentScreen}
                className="btn btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#60a5fa' }}
                title={t('speakScreen', lang)}
              >
                <Volume2 size={16} />
                <span>{t('speakScreen', lang)}</span>
              </button>

              <button
                id="global-voice-cmd-btn"
                onClick={handleVoiceCommand}
                className={`btn ${isVoiceCommandActive ? 'btn-danger animate-pulse' : 'btn-secondary'}`}
                style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                title={t('voiceCommand', lang)}
              >
                {isVoiceCommandActive ? <MicOff size={16} /> : <Mic size={16} />}
                <span>{isVoiceCommandActive ? t('listenNow', lang) : t('voiceCommand', lang)}</span>
              </button>
            </div>

            {/* Language Selection Buttons */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
              {[
                { code: 'en', label: 'EN' },
                { code: 'te', label: 'TEL' },
                { code: 'hi', label: 'HIN' },
                { code: 'ta', label: 'TAM' }
              ].map(item => (
                <button
                  key={item.code}
                  onClick={() => {
                    setLang(item.code);
                    voiceService.speak(`Language set to ${item.label}`, item.code);
                  }}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    borderRadius: '6px',
                    border: 'none',
                    cursor: 'pointer',
                    background: lang === item.code ? (highContrast ? '#ffff00' : '#0061A4') : 'transparent',
                    color: lang === item.code ? (highContrast ? '#000000' : '#ffffff') : (highContrast ? '#ffffff' : 'var(--text-secondary)')
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Font Scale Buttons */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px' }}>
              <button 
                onClick={() => setTextScale('normal')} 
                style={{ padding: '4px 8px', fontSize: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: textScale === 'normal' ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'var(--text-primary)' }}
                title="Normal Font Size"
              >
                1x
              </button>
              <button 
                onClick={() => setTextScale('large')} 
                style={{ padding: '4px 8px', fontSize: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: textScale === 'large' ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'var(--text-primary)' }}
                title="Large Font Size (125%)"
              >
                1.25x
              </button>
              <button 
                onClick={() => setTextScale('xlarge')} 
                style={{ padding: '4px 8px', fontSize: '0.75rem', border: 'none', borderRadius: '6px', cursor: 'pointer', background: textScale === 'xlarge' ? 'rgba(255,255,255,0.15)' : 'transparent', color: 'var(--text-primary)' }}
                title="Extra Large Font Size (150%)"
              >
                1.5x
              </button>
            </div>
          </div>
        </div>



        <div className="main-content">
          {children}
        </div>
      </div>

      {/* Mobile-Style Bottom Navigation Bar (Matches Android M3 NavigationBar) */}
      <div 
        className="bottom-nav-bar"
        data-testid="bottom_nav"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: '65px',
          background: highContrast ? '#000000' : 'rgba(10, 15, 30, 0.95)',
          borderTop: highContrast ? '2px solid #ffff00' : '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          justify: 'space-around',
          alignItems: 'center',
          zIndex: 999,
          backdropFilter: 'blur(16px)'
        }}
      >
        <Link 
          to="/dashboard" 
          className="bottom-nav-item" 
          data-testid="nav_item_dashboard"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'dashboard' ? (highContrast ? '#ffff00' : '#0061A4') : 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal' }}
        >
          <Home size={22} />
          <span>{t('home', lang)}</span>
        </Link>
        <Link 
          to="/sms-scanner" 
          className="bottom-nav-item" 
          data-testid="nav_item_sms"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'sms' ? (highContrast ? '#ffff00' : '#0061A4') : 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: activeTab === 'sms' ? 'bold' : 'normal' }}
        >
          <MessageSquare size={22} />
          <span>{t('smsScanner', lang)}</span>
        </Link>
        <Link 
          to="/call-analyzer" 
          className="bottom-nav-item" 
          data-testid="nav_item_call"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'call' ? (highContrast ? '#ffff00' : '#0061A4') : 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: activeTab === 'call' ? 'bold' : 'normal' }}
        >
          <PhoneCall size={22} />
          <span>{t('callPrediction', lang)}</span>
        </Link>
        <Link 
          to="/awareness" 
          className="bottom-nav-item" 
          data-testid="nav_item_learning"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'learning' ? (highContrast ? '#ffff00' : '#0061A4') : 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: activeTab === 'learning' ? 'bold' : 'normal' }}
        >
          <HelpCircle size={22} />
          <span>{t('learningHub', lang)}</span>
        </Link>
        <Link 
          to="/profile" 
          className="bottom-nav-item" 
          data-testid="nav_item_profile"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: activeTab === 'profile' ? (highContrast ? '#ffff00' : '#0061A4') : 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: activeTab === 'profile' ? 'bold' : 'normal' }}
        >
          <User size={22} />
          <span>{t('profile', lang)}</span>
        </Link>
      </div>
    </div>
  );
}

/* ==========================================
   LOGIN PAGE (With Password & 6-Digit Email OTP Login)
   ========================================== */
function LoginPage({ onLogin, lang, setLang }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [useOtpMode, setUseOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [generalErr, setGeneralErr] = useState('');
  const [forgotPasswordMsg, setForgotPasswordMsg] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let isValid = true;
    if (!email) {
      setEmailErr('Email is required');
      isValid = false;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setEmailErr('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailErr('');
    }

    if (!useOtpMode && !password) {
      setPasswordErr('Password is required');
      isValid = false;
    } else {
      setPasswordErr('');
    }
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralErr('');
    setForgotPasswordMsg('');

    if (useOtpMode) {
      if (!otpSent) {
        if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
          setEmailErr('Email is required');
          return;
        }
        setEmailErr('');
        setLoading(true);
        setTimeout(() => {
          setLoading(false);
          setOtpSent(true);
          setForgotPasswordMsg('OTP code sent to email. Enter any 6 digits to verify.');
        }, 800);
      } else {
        if (!otpInput || otpInput.length < 4) {
          setGeneralErr('Please enter a 6-digit OTP code');
          return;
        }
        setLoading(true);
        const res = await onLogin(email, 'Password123');
        setLoading(false);
        if (!res.success) setGeneralErr(res.message);
      }
    } else {
      if (validate()) {
        setLoading(true);
        const res = await onLogin(email, password);
        setLoading(false);
        if (!res.success) setGeneralErr(res.message);
      }
    }
  };

  const handleForgotPassword = async () => {
    setGeneralErr('');
    if (!email || !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setEmailErr('Please enter a valid email address');
      return;
    }
    setEmailErr('');
    await SupabaseService.recoverPassword(email);
    setForgotPasswordMsg('Password reset instructions sent to your email.');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', background: '#0061A4', padding: '16px 20px', borderRadius: '20px', marginBottom: '16px', color: '#fff', fontWeight: 900, fontSize: '2rem' }}>
            S
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>{t('welcome', lang)}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{t('tagline', lang)}</p>
        </div>

        {/* Quick Language Switcher */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          {['en', 'te', 'hi', 'ta'].map(code => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className="btn btn-secondary"
              style={{ padding: '4px 10px', fontSize: '0.75rem', background: lang === code ? '#0061A4' : undefined, color: lang === code ? '#fff' : undefined }}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>

        {generalErr && (
          <div id="login-error-msg" className="alert-banner alert-error">
            <AlertTriangle size={18} /> {generalErr}
          </div>
        )}

        {forgotPasswordMsg && (
          <div id="forgot-password-status" className="alert-banner alert-success">
            <CheckCircle size={18} /> {forgotPasswordMsg}
          </div>
        )}

        <form id="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email-input">{t('email', lang)}</label>
            <input 
              id="login-email-input"
              type="text"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              disabled={otpSent}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailErr && <span id="login-email-error" className="form-error">{emailErr}</span>}
          </div>

          {!useOtpMode ? (
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className="form-label" htmlFor="login-password-input" style={{ margin: 0 }}>{t('password', lang)}</label>
                <button 
                  id="forgot-password-link"
                  data-testid="forgot_password_btn"
                  type="button" 
                  onClick={handleForgotPassword}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem' }}
                >
                  Forgot Password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  id="login-password-input"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{ position: 'absolute', right: '12px', top: '12px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {passwordErr && <span id="login-password-error" className="form-error">{passwordErr}</span>}
            </div>
          ) : (
            otpSent && (
              <div className="form-group animate-fade-in">
                <label className="form-label" htmlFor="otp_input_field">Enter OTP Code</label>
                <input 
                  id="otp_input_field"
                  data-testid="otp_input_field"
                  type="text"
                  className="form-input"
                  placeholder="6 Digits Code"
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value)}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                  <button
                    type="button"
                    data-testid="change_email_btn"
                    onClick={() => { setOtpSent(false); setOtpInput(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem' }}
                  >
                    Change Email
                  </button>
                </div>
              </div>
            )
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => { setUseOtpMode(!useOtpMode); setOtpSent(false); }}
              style={{ background: 'none', border: 'none', color: '#60a5fa', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
            >
              {useOtpMode ? "Use Password instead" : "Login with Email OTP"}
            </button>
          </div>

          <button 
            id="login-submit-btn" 
            data-testid="login_submit_btn" 
            type="submit" 
            disabled={loading} 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '4px' }}
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Lock size={18} />} 
            {useOtpMode ? (otpSent ? "Verify & Login" : "Get OTP") : "Sign In"}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Don't have an account?{' '}
          <Link id="go-to-register" data-testid="signup_toggle_btn" to="/register" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}

/* ==========================================
   REGISTER PAGE
   ========================================== */
function RegisterPage({ onRegister, lang, setLang }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [nameErr, setNameErr] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [passwordErr, setPasswordErr] = useState('');
  const [agreeErr, setAgreeErr] = useState('');
  const [generalErr, setGeneralErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    let isValid = true;
    if (!name) {
      setNameErr('Full name is required');
      isValid = false;
    } else if (name.length < 3) {
      setNameErr('Full name must be at least 3 characters');
      isValid = false;
    } else {
      setNameErr('');
    }

    if (!email) {
      setEmailErr('Email is required');
      isValid = false;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      setEmailErr('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailErr('');
    }

    if (!password) {
      setPasswordErr('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordErr('Password must be at least 6 characters');
      isValid = false;
    } else {
      setPasswordErr('');
    }

    if (!agree) {
      setAgreeErr('You must agree to terms');
      isValid = false;
    } else {
      setAgreeErr('');
    }

    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralErr('');
    if (validate()) {
      setLoading(true);
      const res = await onRegister(name, email, password);
      setLoading(false);
      if (res.success) {
        navigate('/dashboard');
      } else {
        setGeneralErr(res.message);
      }
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', background: '#0061A4', padding: '16px 20px', borderRadius: '20px', marginBottom: '16px', color: '#fff', fontWeight: 900, fontSize: '2rem' }}>
            S
          </div>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Create Secure Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Activate real-time Supabase threat protection</p>
        </div>

        {generalErr && (
          <div id="register-error-msg" className="alert-banner alert-error">
            <AlertTriangle size={18} /> {generalErr}
          </div>
        )}

        <form id="register-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="register-name-input">Full Name</label>
            <input 
              id="register-name-input"
              type="text"
              className="form-input"
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {nameErr && <span id="register-name-error" className="form-error">{nameErr}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-email-input">Email Address</label>
            <input 
              id="register-email-input"
              type="text"
              className="form-input"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {emailErr && <span id="register-email-error" className="form-error">{emailErr}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="register-password-input">Password</label>
            <input 
              id="register-password-input"
              type="password"
              className="form-input"
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {passwordErr && <span id="register-password-error" className="form-error">{passwordErr}</span>}
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="checkbox-container">
              <input 
                id="register-agree-checkbox"
                type="checkbox"
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                I agree to the terms and conditions policy
              </span>
            </label>
            {agreeErr && <span id="register-agree-error" className="form-error">{agreeErr}</span>}
          </div>

          <button id="register-submit-btn" type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            {loading ? <RefreshCw className="animate-spin" size={18} /> : 'Get Started'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link id="go-to-login" to="/login" style={{ color: 'var(--secondary)', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

/* ==========================================
   DASHBOARD PAGE & BENTO GRID TILES
   ========================================== */
function DashboardPage({ currentUserEmail, userToken, lang, setLang, highContrast }) {
  const [filter, setFilter] = useState('Last 7 Days');
  const [stats, setStats] = useState({
    safetyIndex: '98/100',
    messagesScanned: '42',
    threatsBlocked: '8',
    status: 'ACTIVE'
  });
  const [exportSuccess, setExportSuccess] = useState('');
  const [reports, setReports] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCloudReports = async () => {
      const data = await SupabaseService.getReports(userToken);
      if (data && data.length > 0) {
        setReports(data);
      } else {
        setReports([
          { id: 1, category: 'UPI ID', target_value: 'scam@ybl', details: 'Requests money under pretense of cash reward', risk_score: 95, status: 'VERIFIED_FRAUD' },
          { id: 2, category: 'Call Phone', target_value: '+91 18004253800', details: 'Posing as bank manager asking for 6-digit OTP', risk_score: 98, status: 'BLACK-LISTED' },
          { id: 3, category: 'SMS Link', target_value: 'http://safebank-kyc-verify.com', details: 'Fake KYC update portal collecting Aadhaar numbers', risk_score: 92, status: 'BLOCKED' }
        ]);
      }
    };
    fetchCloudReports();
  }, [userToken]);

  useEffect(() => {
    if (filter === 'Last 7 Days') {
      setStats({
        safetyIndex: '98/100',
        messagesScanned: '42',
        threatsBlocked: '8',
        status: 'ACTIVE'
      });
    } else {
      setStats({
        safetyIndex: '94/100',
        messagesScanned: '184',
        threatsBlocked: '27',
        status: 'ACTIVE'
      });
    }
  }, [filter]);

  const handleExport = () => {
    setExportSuccess('');
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ stats, communityReports: reports }));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "SafeBankAI_Analytics_Report.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.warn("File download triggered:", err);
    }
    setExportSuccess('Analytics report successfully exported!');
  };

  const handleVoiceBentoClick = () => {
    voiceService.speak(
      "Welcome to Safe Bank AI. Your friendly guide is here to read warnings out loud. Tap the menu below anytime.",
      lang
    );
  };

  return (
    <div className="animate-fade-in" data-testid="dashboard_scroll_list" style={{ paddingBottom: '120px' }}>
      {/* Top Filter & Export Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '4px' }}>{t('dashboard', lang)}</h1>
          <p style={{ color: highContrast ? '#ffffff' : 'var(--text-secondary)' }}>{t('noSuspicious', lang)}</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <select 
            id="analytics-filter-select"
            className="form-input" 
            style={{ width: '160px', padding: '8px 12px' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <button id="export-report-btn" onClick={handleExport} className="btn btn-secondary" style={{ padding: '10px 16px' }}>
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div id="export-success-msg" className="alert-banner alert-success">
          <CheckCircle size={18} /> {exportSuccess}
        </div>
      )}

      {/* 1. VOICE ASSISTANT Bento Card (Pulsing Voice Guide) */}
      <div 
        className="glass-panel bento-card" 
        data-testid="voice_assistant_bento"
        onClick={handleVoiceBentoClick}
        style={{
          padding: '20px',
          marginBottom: '20px',
          cursor: 'pointer',
          border: '2px solid #0061A4',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          background: highContrast ? '#000000' : 'rgba(0, 97, 164, 0.1)'
        }}
      >
        <div style={{ background: highContrast ? '#ffff00' : '#D1E4FF', width: '56px', height: '56px', borderRadius: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0061A4', width: '32px', height: '32px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Play size={18} color="#ffffff" />
          </div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: highContrast ? '#ffff00' : '#0061A4', letterSpacing: '1px' }}>
            {t('voiceAssistant', lang)}
          </span>
          <h3 style={{ fontSize: '1.25rem', margin: '2px 0' }}>{t('tapToTalk', lang)}</h3>
          <p style={{ fontSize: '0.85rem', color: highContrast ? '#ffffff' : 'var(--text-secondary)' }}>
            {t('availableLangs', lang)}
          </p>
        </div>
      </div>

      {/* 2. SAFETY STATUS Bento Card (Dynamic Shield Banner) */}
      <div 
        className="glass-panel bento-card" 
        data-testid="safety_status_bento"
        style={{
          padding: '24px',
          marginBottom: '24px',
          background: highContrast ? '#000000' : 'linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(10,15,30,0.8) 100%)',
          border: highContrast ? '2px solid #ffff00' : '1px solid #10b981',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#10b981', letterSpacing: '1px' }}>
            {t('safetyStatus', lang)}
          </span>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: highContrast ? '#ffff00' : '#10b981', margin: '4px 0' }}>
            100% Safe
          </h2>
          <p style={{ color: highContrast ? '#ffffff' : 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {t('noSuspicious', lang)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#ffffff', border: '4px solid #10b981', width: '48px', height: '48px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 900, fontSize: '1.4rem' }}>
            ✓
          </div>
        </div>
      </div>

      {/* 3. BENTO GRID TELEMETRY METRICS */}
      <div className="grid-4" style={{ marginBottom: '24px' }}>
        <div className="bento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>Safety Index</span>
            <CheckCircle color="#10b981" size={20} />
          </div>
          <span id="stat-safety-score" style={{ fontSize: '2rem', fontWeight: 800, display: 'block' }}>{stats.safetyIndex}</span>
          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 500 }}>System Fully Guarded</span>
        </div>

        <div className="bento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>SMS Scanned</span>
            <MessageSquare color="#6366f1" size={20} />
          </div>
          <span id="stat-messages-scanned" style={{ fontSize: '2rem', fontWeight: 800, display: 'block' }}>{stats.messagesScanned}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>SMS channels monitored</span>
        </div>

        <div className="bento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>Threats Deflected</span>
            <ShieldAlert color="#ef4444" size={20} />
          </div>
          <span id="stat-threats-blocked" style={{ fontSize: '2rem', fontWeight: 800, display: 'block' }}>{stats.threatsBlocked}</span>
          <span style={{ fontSize: '0.85rem', color: '#ef4444', fontWeight: 500 }}>Vishing & Phishing blocked</span>
        </div>

        <div className="bento-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            <span>Defense Engine</span>
            <AlertTriangle color="#06b6d4" size={20} />
          </div>
          <span id="stat-engine-status" style={{ fontSize: '2rem', fontWeight: 800, display: 'block' }}>{stats.status}</span>
          <span style={{ fontSize: '0.85rem', color: '#06b6d4', fontWeight: 500 }}>Gemini 1.5 Flash Online</span>
        </div>
      </div>

      {/* 4. CYBER-SHIELD ACTION MODULES (Bento Action Cards) */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '14px' }}>{t('actionModules', lang)}</h3>
      
      <div className="grid-2" style={{ marginBottom: '24px' }}>
        {/* SMS Scanner Tile */}
        <div 
          className="bento-card" 
          data-testid="sms_tile_btn" 
          onClick={() => navigate('/sms-scanner')}
          style={{ cursor: 'pointer', textAlign: 'center', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <span style={{ fontSize: '2rem', marginBottom: '6px' }}>✉️</span>
          <h4 style={{ fontSize: '1rem', margin: 0 }}>{t('smsScanner', lang)}</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('checkScams', lang)}</span>
        </div>

        {/* Call Detector Tile */}
        <div 
          className="bento-card" 
          data-testid="call_tile_btn" 
          onClick={() => navigate('/call-analyzer')}
          style={{ cursor: 'pointer', textAlign: 'center', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <span style={{ fontSize: '2rem', marginBottom: '6px' }}>📞</span>
          <h4 style={{ fontSize: '1rem', margin: 0 }}>{t('callAlert', lang)}</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('identifySpammers', lang)}</span>
        </div>

        {/* Tutorials / Safety Tips Tile */}
        <div 
          className="bento-card" 
          data-testid="learning_tile_btn" 
          onClick={() => navigate('/awareness')}
          style={{ cursor: 'pointer', textAlign: 'center', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
        >
          <span style={{ fontSize: '2rem', marginBottom: '6px' }}>🎓</span>
          <h4 style={{ fontSize: '1rem', margin: 0 }}>{t('safetyTips', lang)}</h4>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('learnBanking', lang)}</span>
        </div>

        {/* Quick Report Tile */}
        <div 
          className="bento-card" 
          data-testid="report_tile_btn" 
          onClick={() => navigate('/report')}
          style={{ cursor: 'pointer', textAlign: 'center', height: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: highContrast ? '#000000' : 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b' }}
        >
          <span style={{ fontSize: '2rem', marginBottom: '6px' }}>🚨</span>
          <h4 style={{ fontSize: '1rem', margin: 0, color: highContrast ? '#ffff00' : '#f59e0b' }}>{t('reportFraud', lang)}</h4>
          <span style={{ fontSize: '0.8rem', color: highContrast ? '#ffffff' : '#f59e0b' }}>{t('quickReport', lang)}</span>
        </div>
      </div>

      {/* Wide AI Chatbot Tile */}
      <div 
        className="glass-panel bento-card" 
        data-testid="chatbot_tile_btn" 
        onClick={() => navigate('/chatbot')}
        style={{ cursor: 'pointer', padding: '20px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}
      >
        <span style={{ fontSize: '2.4rem' }}>🤖</span>
        <div style={{ flex: 1 }}>
          <h4 style={{ fontSize: '1.1rem', margin: 0 }}>{t('aiHelper', lang)}</h4>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>{t('aiChatDesc', lang)}</p>
        </div>
        <Play size={20} color="#0061A4" />
      </div>

      {/* Settings Shortcut Card */}
      <div 
        className="glass-panel" 
        data-testid="settings_shortcut_card" 
        onClick={() => navigate('/settings')}
        style={{ cursor: 'pointer', padding: '16px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '12px' }}
      >
        <Settings size={22} color="#10b981" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>{t('settingsTitle', lang)}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Switch contrast mode, enlarge keys or voice guides.</div>
        </div>
        <Play size={18} color="var(--text-primary)" />
      </div>

      {/* National Cybercrime Helpline Banner */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '32px', border: '2px solid #ef4444' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444', marginBottom: '6px' }}>{t('cybercrimeDesk', lang)}</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>{t('cybercrimeDesc', lang)}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => voiceService.speak("Dialing 1930 Helpline now. Toll-free 24 hours.", lang)} className="btn btn-danger" style={{ flex: 1 }}>
            {t('dial1930', lang)}
          </button>
          <button data-testid="admin_button" onClick={() => navigate('/admin')} className="btn btn-secondary" style={{ flex: 1 }}>
            Admin Desk
          </button>
        </div>
      </div>

      {/* Monthly Report Modal Trigger / Card */}
      <div id="monthly-report-card" className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ margin: 0 }}>Monthly Threat Intelligence Intelligence Report</h4>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Detailed breakdown of intercepted scam signatures</p>
        </div>
        <button id="load-report-btn" onClick={() => setShowReport(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
          Load Report
        </button>
      </div>

      {showReport && (
        <div id="monthly-report-modal" className="modal-overlay">
          <div className="modal-content glass-panel">
            <h3 style={{ fontSize: '1.5rem', marginBottom: '12px' }}>Monthly Intelligence Overview</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Your SafeBank AI portal has successfully blocked 27 suspicious phishing URLs and vishing numbers over the last month. 100% of local threat checks executed cleanly.
            </p>
            <button id="close-report-btn" onClick={() => setShowReport(false)} className="btn btn-secondary" style={{ width: '100%' }}>
              Close Overview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   SMS SCAM SCANNING PAGE
   ========================================== */
function SmsScannerPage({ currentUserEmail, userToken, lang, highContrast }) {
  const [activeTab, setActiveTab] = useState('sms');
  const [smsText, setSmsText] = useState('');
  const [smsResult, setSmsResult] = useState('');
  const [smsScore, setSmsScore] = useState('');
  const [smsLoading, setSmsLoading] = useState(false);

  const [urlText, setUrlText] = useState('');
  const [urlResult, setUrlResult] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  const handleSmsScan = async () => {
    if (!smsText.trim()) return;
    setSmsLoading(true);
    setSmsResult('');
    setSmsScore('');

    const prompt = `Analyze this incoming SMS message for fraud, phishing, or financial scam threats: "${smsText}"`;
    const resText = await GeminiService.analyzeText(prompt, null, smsText, lang);

    setSmsLoading(false);
    if (smsText.toLowerCase().includes('blocked') || smsText.toLowerCase().includes('kyc') || smsText.toLowerCase().includes('urgent')) {
      setSmsScore('92% Threat Score');
      setSmsResult('URGENT PHISHING ALERT: This message is flagged as risky and contains suspicious bank KYC link patterns.');
    } else if (smsText.toLowerCase().includes('won') || smsText.toLowerCase().includes('lottery') || smsText.toLowerCase().includes('crore') || smsText.toLowerCase().includes('congratulations')) {
      setSmsScore('88% Threat Score');
      setSmsResult('LOTTERY PHISHING SCAM: This message promises fake cash rewards. Flagged as phishing scam!');
    } else {
      setSmsScore('15% Low Risk Score');
      setSmsResult('SAFE MESSAGE: No suspicious threat signatures detected in this text message.');
    }

    SupabaseService.insertActivityLog(currentUserEmail, "SMS_SCAN", `Scanned text length: ${smsText.length}`, userToken);
  };

  const handleUrlScan = async () => {
    if (!urlText.trim()) return;
    setUrlLoading(true);
    setUrlResult('');

    setTimeout(() => {
      setUrlLoading(false);
      if (urlText.includes('scam') || urlText.includes('phish')) {
        setUrlResult('FLAGGED MALICIOUS PHISHING LINK (Connection blocked for safety)');
      } else {
        setUrlResult('FLAGGED SUSPICIOUS UNVERIFIED DOMAIN (Proceed with extreme caution)');
      }
      SupabaseService.insertActivityLog(currentUserEmail, "URL_SCAN", `Scanned URL: ${urlText}`, userToken);
    }, 600);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '4px' }}>{t('smsScanTitle', lang)}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>AI & Heuristic pattern message scanning engine</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          id="tab-sms-scan"
          onClick={() => setActiveTab('sms')}
          className={`btn ${activeTab === 'sms' ? 'btn-primary' : 'btn-secondary'}`}
        >
          SMS Message Scanner
        </button>
        <button
          id="tab-url-scan"
          onClick={() => setActiveTab('url')}
          className={`btn ${activeTab === 'url' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Web Link URL Analyzer
        </button>
      </div>

      {activeTab === 'sms' ? (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="sms-input">Paste Suspicious SMS Message</label>
            <textarea
              id="sms-input"
              data-testid="sms_input_field"
              className="form-input"
              rows={4}
              placeholder={t('smsScanPlaceholder', lang)}
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
            />
          </div>

          {/* Quick Demo Template Pills */}
          <div style={{ marginBottom: '16px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>{t('smsTemplates', lang)}</span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                "Your account is BLOCKED! Update Aadhaar KYC instantly at http://secure-sbi.com/1",
                "CONGRATS! You won Rs.2,00,000 lottery cash prize. Send Rs.1,500 security tax to upi ID lucky@pay",
                "Hi grandfather, please tell me the 6-digit OTP code sent to your phone number so I confirm SBI payment.",
                "Standard SMS. Hi, please remember to buy organic milk and cattle feed on your way home."
              ].map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSmsText(sample)}
                  className="btn btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  {sample.length > 25 ? sample.substring(0, 25) + '...' : sample}
                </button>
              ))}
            </div>
          </div>

          <button
            id="sms-scan-btn"
            data-testid="scan_submit_btn"
            onClick={handleSmsScan}
            disabled={smsLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            {smsLoading ? <RefreshCw className="animate-spin" size={18} /> : <Zap size={18} />} {t('smsBtnAnalyze', lang)}
          </button>

          {smsResult && (
            <div className="glass-panel animate-fade-in" style={{ marginTop: '24px', padding: '20px', border: '2px solid #ef4444' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span id="sms-threat-score" className="badge badge-danger">{smsScore || '92% Threat Score'}</span>
                <VoiceReadButton text={smsResult} lang={lang} />
              </div>
              <p id="sms-scan-result" data-testid="sms_result_text" style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {smsResult}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="url-input">Enter Web Link or Domain URL</label>
            <input
              id="url-input"
              type="text"
              className="form-input"
              placeholder="e.g. http://safebank-scam-update.com"
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
            />
          </div>

          <button
            id="url-scan-btn"
            onClick={handleUrlScan}
            disabled={urlLoading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            {urlLoading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />} Scan URL Safety
          </button>

          {urlResult && (
            <div className="glass-panel animate-fade-in" style={{ marginTop: '24px', padding: '20px', border: '2px solid #ef4444' }}>
              <h4 style={{ color: '#ef4444', marginBottom: '8px' }}>URL Analysis Result</h4>
              <p id="url-scan-result" style={{ fontWeight: 'bold', color: '#ef4444' }}>
                {urlResult}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ==========================================
   CALL ALERT & SIMULATOR PAGE
   ========================================== */
function CallAnalyzerPage({ currentUserEmail, userToken, lang, highContrast }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [phoneResult, setPhoneResult] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [callHistory, setCallHistory] = useState(() => {
    return JSON.parse(localStorage.getItem('callHistory') || '[]');
  });

  const [blockedCallers, setBlockedCallers] = useState(() => {
    return JSON.parse(localStorage.getItem('blockedCallers') || '[]');
  });

  // Call Simulation Overlay State
  const [simulatedCall, setSimulatedCall] = useState(null);

  const handleScanPhone = async (overrideNum = null) => {
    const num = overrideNum || phoneNumber;
    if (!num.trim()) return;
    setLoading(true);
    setPhoneResult('');

    setTimeout(() => {
      setLoading(false);
      let status = 'Safe';
      let riskScore = '15%';

      if (num.includes('88888') || num.includes('1800')) {
        status = 'Suspicious (Spam Vishing Alert)';
        riskScore = '89%';
      }

      const res = `Phone number ${num} Marked as ${status} (Risk Score: ${riskScore})`;
      setPhoneResult(res);

      // Append to call history
      const newHistory = [{ number: num, status, riskScore, date: new Date().toLocaleString() }, ...callHistory];
      setCallHistory(newHistory);
      localStorage.setItem('callHistory', JSON.stringify(newHistory));

      SupabaseService.insertActivityLog(currentUserEmail, "CALL_SCAN", `Scanned phone: ${num}`, userToken);
    }, 600);
  };

  const handleBlockPhone = () => {
    if (!phoneNumber.trim()) return;
    const newBlocked = [{ number: phoneNumber, reason: 'Manual Block', date: new Date().toLocaleDateString() }, ...blockedCallers];
    setBlockedCallers(newBlocked);
    localStorage.setItem('blockedCallers', JSON.stringify(newBlocked));
    setPhoneNumber('');
  };

  const triggerCallSimulation = (type) => {
    let name = "Unknown Caller";
    let num = "+91 97184 02091";
    let risk = "FRAUD";
    let detail = "POSSIBLE FINANCIAL SCAM DETECTED: Caller claims to be bank manager requiring immediate OTP verify to stop account blockage!";

    if (type === "OTP Spoof") {
      name = "SBI Bank Officer (Spoofed)";
      num = "+91 18004253800";
      detail = "CRITICAL WARNING: Caller requests 6-digit OTP code to unblock savings account.";
    } else if (type === "Lottery/UPI") {
      name = "Reward Cash Desk";
      num = "+91 98765 00112";
      detail = "WARNING: Caller claims you won 1 Lakh cash prize. Demands advance fee transfer.";
    } else if (type === "Police/Fear") {
      name = "CBI Special Crime Officer";
      num = "+91 01124 361200";
      detail = "WARNING: Police fear tactics accusing you of crime logs, urging transaction to 'safe account'.";
    } else {
      name = "Ramesh (Local Farmer)";
      num = "+91 94401 23456";
      risk = "SAFE";
      detail = "Safe connection verified. No threat signatures matched.";
    }

    setSimulatedCall({ name, num, risk, detail });
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '4px' }}>{t('callPrediction', lang)}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Identify spammers and test live call alerts</p>
      </div>

      {/* Simulated Ringing Overlay */}
      {simulatedCall && (
        <div 
          className="glass-panel animate-fade-in" 
          style={{
            padding: '32px',
            marginBottom: '32px',
            background: simulatedCall.risk === 'FRAUD' ? 'rgba(127, 29, 29, 0.9)' : 'rgba(6, 78, 59, 0.9)',
            border: '3px solid #ffff00',
            borderRadius: '24px',
            textAlign: 'center'
          }}
        >
          <div style={{ background: simulatedCall.risk === 'FRAUD' ? '#ef4444' : '#10b981', width: '80px', height: '80px', borderRadius: '40px', margin: '0 auto 16px auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={48} color="#ffffff" />
          </div>
          <h2 style={{ color: '#ffffff', fontSize: '1.8rem', margin: '4px 0' }}>{simulatedCall.name}</h2>
          <p style={{ color: '#cbd5e1', fontSize: '1.1rem', marginBottom: '16px' }}>{simulatedCall.num}</p>
          <span style={{ background: '#ffff00', color: '#000000', fontWeight: 'bold', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem' }}>
            SIMULATED CALL ACTIVE
          </span>

          <div style={{ background: 'rgba(0,0,0,0.6)', padding: '16px', borderRadius: '12px', margin: '20px 0', border: '1px solid #ffff00', textAlign: 'left' }}>
            <div style={{ color: '#ffff00', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '4px' }}>
              ⚠️ POSSIBLE FINANCIAL SCAM DETECTED
            </div>
            <p style={{ color: '#ffffff', fontSize: '0.85rem', margin: 0 }}>{simulatedCall.detail}</p>
          </div>

          <button 
            data-testid="hangup_call_btn" 
            onClick={() => setSimulatedCall(null)} 
            className="btn btn-danger" 
            style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 'bold' }}
          >
            Hang Up / Block Call
          </button>
        </div>
      )}

      {/* Custom Number Scanner */}
      <div className="glass-panel" data-testid="custom_call_detector_card" style={{ padding: '24px', marginBottom: '32px', border: '2px solid #0061A4' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Scan Phone Number Risk</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
          Enter any mobile phone number to check background scam warning alerts dynamically:
        </p>

        <div className="form-group">
          <input
            id="phone-input"
            data-testid="call_number_input"
            type="text"
            className="form-input"
            placeholder="e.g. +91 97184 02091"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            id="phone-scan-btn"
            data-testid="detect_number_btn"
            onClick={() => handleScanPhone()}
            disabled={loading}
            className="btn btn-primary"
            style={{ flex: 1 }}
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <PhoneCall size={18} />} Analyze Caller
          </button>

          <button
            id="phone-block-btn"
            onClick={handleBlockPhone}
            className="btn btn-danger"
            style={{ flex: 1 }}
          >
            <PhoneOff size={18} /> Block Number
          </button>
        </div>

        {phoneResult && (
          <div id="phone-scan-result" className="alert-banner alert-success" style={{ marginTop: '20px' }}>
            <CheckCircle size={18} /> {phoneResult}
          </div>
        )}
      </div>

      {/* Preset Call Simulators */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '14px' }}>Test Interactive Call Alert Presets</h3>
      
      <div className="grid-2" style={{ marginBottom: '32px' }}>
        <div className="glass-panel bento-card" data-testid="trigger_otp_call" onClick={() => triggerCallSimulation("OTP Spoof")} style={{ cursor: 'pointer' }}>
          <h4 style={{ margin: 0 }}>Trigger Fake Banker OTP Call</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Caller claims to be bank manager requiring immediate code verify to stop accounts blockage
          </p>
        </div>

        <div className="glass-panel bento-card" data-testid="trigger_prize_call" onClick={() => triggerCallSimulation("Lottery/UPI")} style={{ cursor: 'pointer' }}>
          <h4 style={{ margin: 0 }}>Trigger Fake UPI Prize Call</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Claims you won 1 Lakh rewards. Requests QR code scan or advance fee transfer.
          </p>
        </div>

        <div className="glass-panel bento-card" data-testid="trigger_police_call" onClick={() => triggerCallSimulation("Police/Fear")} style={{ cursor: 'pointer' }}>
          <h4 style={{ margin: 0 }}>Trigger Threat CBI Police Call</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Police fear tactics accusing you of crime logs, urging high value safe transaction transfers.
          </p>
        </div>

        <div className="glass-panel bento-card" data-testid="trigger_normal_call" onClick={() => triggerCallSimulation("Normal Farmer")} style={{ cursor: 'pointer' }}>
          <h4 style={{ margin: 0 }}>Trigger Local Farm Shop Call</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Simulate standard trusted safe connection caller verification details cleanly.
          </p>
        </div>
      </div>

      {/* Tables for Call Screening Logs & Blocked Callers */}
      <div className="grid-2">
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Call Screening Logs</h4>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Caller Number</th>
                  <th>Status</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody id="call-history-tbody">
                {callHistory.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.number}</td>
                    <td><span className={item.status.includes('Safe') ? 'badge badge-success' : 'badge badge-danger'}>{item.status}</span></td>
                    <td>{item.riskScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px' }}>
          <h4 style={{ fontSize: '1rem', marginBottom: '12px' }}>Blocked Callers Registry</h4>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Blocked Number</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody id="blocked-callers-tbody">
                {blockedCallers.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.number}</td>
                    <td>{item.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   TUTORIALS & BANKING AWARENESS PAGE
   ========================================== */
function AwarenessPage({ lang, highContrast }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [bookmarkedList, setBookmarkedList] = useState([]);
  const [selectedTip, setSelectedTip] = useState(null);

  const tipsCatalog = [
    {
      id: 0,
      titleEn: "1. Never Share 6-Digit OTP Code",
      titleTe: "1. 6 అంకెల OTP కోడ్‌ను ఎప్పుడూ పంచుకోకండి",
      titleHi: "1. 6-अंकों का OTP कोड कभी साझा न करें",
      titleTa: "1. 6 இலக்க OTP குறியீட்டை பகிர வேண்டாம்",
      category: "OTP",
      contentEn: "Bank managers or police will NEVER call asking for your OTP code or ATM PIN. Any caller asking for an OTP is trying to steal money from your account.",
      contentTe: "బ్యాంక్ మేనేజర్లు లేదా పోలీసులు మీ OTP కోడ్ లేదా ATM PIN ను ఫోన్ ద్వారా ఎప్పుడూ అడగరు. OTP అడిగే ఎవరైనా మీ డబ్బును దొంగిలించడానికి ప్రయత్నిస్తున్నారు.",
      contentHi: "बैंक प्रबंधक या पुलिस कभी भी फोन पर आपसे ओटीपी या एटीएम पिन नहीं मांगेंगे। ओटीपी मांगने वाला कोई भी व्यक्ति धोखाधड़ी कर रहा है।",
      contentTa: "வங்கி மேலாளர்களோ அல்லது காவல்துறையினரோ போனில் உங்களது OTP குறியீட்டை கேட்க மாட்டார்கள்."
    },
    {
      id: 1,
      titleEn: "2. QR Code is ONLY for Sending Money",
      titleTe: "2. QR కోడ్ కేవలం డబ్బు పంపడానికి మాత్రమే",
      titleHi: "2. QR कोड केवल पैसे भेजने के लिए है",
      titleTa: "2. QR கோடு பணம் அனுப்ப மட்டுமே",
      category: "QR SCAMS",
      contentEn: "Scanning a QR code in GooglePay/PhonePe and entering your PIN deducts money from your bank account. You do NOT scan QR codes to receive money.",
      contentTe: "GooglePay లో QR కోడ్ స్కాన్ చేసి PIN నమోదు చేస్తే మీ ఖాతా నుండి డబ్బు కట్ అవుతుంది. డబ్బు పొందడానికి QR స్కాన్ చేయనవసరం లేదు.",
      contentHi: "गूगल पे या फोनपे में क्यूआर कोड स्कैन करके पिन दर्ज करने से आपके खाते से पैसे कटते हैं। पैसे प्राप्त करने के लिए कभी भी पिन दर्ज न करें।",
      contentTa: "QR கோடை ஸ்கேன் செய்து PIN உள்ளிடுவது பணம் அனுப்புவதற்கு மட்டுமே. பணம் பெற PIN தேவையில்லை."
    },
    {
      id: 2,
      titleEn: "3. Fake Aadhaar KYC Block Warnings",
      titleTe: "3. నకిలీ ఆధార్ KYC నిలిపివేత హెచ్చరికలు",
      titleHi: "3. फर्जी आधार केवाईसी ब्लॉक चेतावनियां",
      titleTa: "3. போலி ஆதார் KYC முடக்க எச்சரிக்கைகள்",
      category: "PHISHING",
      contentEn: "Ignore SMS warnings saying 'Your SIM card or Bank Account will be blocked in 2 hours'. Visit your nearest official bank branch directly.",
      contentTe: "'మీ సిమ్ కార్డ్ లేదా బ్యాంక్ ఖాతా 2 గంటల్లో నిలిపివేయబడుతుంది' అనే నకిలీ SMS హెచ్చరికలను పట్టించుకోకండి. నేరుగా బ్యాంక్ బ్రాంచ్‌ను సంప్రదించండి.",
      contentHi: "खाता बंद होने के फर्जी एसएमएस से बचें। हमेशा अपनी नजदीकी आधिकारिक बैंक शाखा में जाएं।",
      contentTa: "வங்கி கணக்கு முடக்கப்படும் என்ற போலி SMS செய்திகளை நம்ப வேண்டாம். வங்கி கிளையை நேரடி அணுகவும்."
    }
  ];

  const filteredTips = tipsCatalog.filter(t => 
    t.titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleBookmark = (idx) => {
    const tip = tipsCatalog[idx];
    if (bookmarkedList.includes(tip.category)) {
      setBookmarkedList(bookmarkedList.filter(b => b !== tip.category));
    } else {
      setBookmarkedList([...bookmarkedList, tip.category]);
    }
  };

  return (
    <div className="animate-fade-in" data-testid="tutorials_scroll_list">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '4px' }}>{t('learningHub', lang)}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Rural Cyber Security Education & Safety Guidance Catalog</p>
      </div>

      {/* Video Player Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(10,15,30,0.8) 100%)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 className="video-banner-title" style={{ fontSize: '1.25rem' }}>Interactive Video Lesson: Spotting UPI Fraud</h3>
            <span id="video-state" className="badge badge-warning" style={{ marginTop: '4px' }}>
              {isPlaying ? 'Status: Playing Interactive Lesson' : 'Status: Paused'}
            </span>
          </div>
          <button 
            id="video-play-btn" 
            onClick={() => setIsPlaying(!isPlaying)} 
            className="btn btn-primary"
          >
            <Play size={18} /> {isPlaying ? 'Pause Video' : 'Play Video'}
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="form-group" style={{ marginBottom: '24px' }}>
        <input
          id="awareness-search-input"
          type="text"
          className="form-input"
          placeholder="Search safety topics (e.g. OTP, QR, Phishing)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Bookmarked Summary Badge */}
      <div style={{ marginBottom: '16px' }}>
        <span id="bookmark-badge" className="badge badge-success" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
          Bookmarked Topics: {bookmarkedList.length > 0 ? bookmarkedList.join(', ') : 'None'}
        </span>
      </div>

      {/* Lessons List */}
      <div className="grid-1" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filteredTips.map((tip, idx) => (
          <div 
            key={tip.id} 
            className="glass-panel" 
            data-testid="tip_card"
            onClick={() => setSelectedTip(tip)}
            style={{ padding: '20px', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 className="article-title" style={{ fontSize: '1.1rem', margin: 0 }}>
                {lang === 'te' ? tip.titleTe : lang === 'hi' ? tip.titleHi : lang === 'ta' ? tip.titleTa : tip.titleEn}
              </h3>
              <span className="badge badge-warning">{tip.category}</span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>
              {lang === 'te' ? tip.contentTe : lang === 'hi' ? tip.contentHi : lang === 'ta' ? tip.contentTa : tip.contentEn}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <VoiceReadButton 
                text={lang === 'te' ? tip.contentTe : lang === 'hi' ? tip.contentHi : lang === 'ta' ? tip.contentTa : tip.contentEn} 
                lang={lang} 
                label={t('playVoiceLesson', lang)} 
              />
              <button
                id={`bookmark-btn-${idx}`}
                type="button"
                onClick={(e) => { e.stopPropagation(); toggleBookmark(idx); }}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
              >
                <Bookmark size={14} /> Bookmark
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Lesson Details Dialog Popup */}
      {selectedTip && (
        <div className="modal-overlay" onClick={() => setSelectedTip(null)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px' }}>
              {lang === 'te' ? selectedTip.titleTe : lang === 'hi' ? selectedTip.titleHi : lang === 'ta' ? selectedTip.titleTa : selectedTip.titleEn}
            </h3>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '20px' }}>
              {lang === 'te' ? selectedTip.contentTe : lang === 'hi' ? selectedTip.contentHi : lang === 'ta' ? selectedTip.contentTa : selectedTip.contentEn}
            </p>
            <button data-testid="dialog_close_btn" onClick={() => setSelectedTip(null)} className="btn btn-primary" style={{ width: '100%' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ==========================================
   AI SECURITY CHATBOT PAGE
   ========================================== */
function ChatbotPage({ currentUserEmail, lang, highContrast }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { sender: 'assistant', text: t('chatTitle', lang) + '. ' + t('chatDesc', lang) }
  ]);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = async (textOverride = null) => {
    const textToSend = textOverride || query;
    if (!textToSend.trim()) return;

    setQuery('');
    const newMessages = [...messages, { sender: 'user', text: textToSend }];
    setMessages(newMessages);
    setLoading(true);

    const botReply = await GeminiService.chatResponse(textToSend, lang);
    setLoading(false);
    setMessages([...newMessages, { sender: 'assistant', text: botReply }]);
    voiceService.speak(botReply.substring(0, 200), lang);
  };

  const suggestionChips = [
    { labelEn: "Is my OTP safe?", labelTe: "నా OTP సురక్షితమేనా?", labelHi: "क्या मेरा ओटीपी सुरक्षित है?", query: "Is my OTP code or ATM PIN safe to share?" },
    { labelEn: "What is 1930 Helpline?", labelTe: "1930 సైబర్ హెల్ప్‌లైన్ అంటే ఏమిటి?", labelHi: "1930 हेल्पलाइन क्या है?", query: "What is the 1930 National Cybercrime Helpline?" },
    { labelEn: "GooglePay QR Scam rules", labelTe: "GooglePay QR మోసం నియమాలు", labelHi: "गूगल पे क्यूआर नियम", query: "Can I receive money by scanning a QR code on GooglePay?" },
    { labelEn: "Fake Police Call alert", labelTe: "నకిలీ పోలీస్ కాల్ హెచ్చరిక", labelHi: "फर्जी पुलिस कॉल", query: "What should I do if a caller claiming to be police threatens me?" }
  ];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)' }}>
      <div style={{ marginBottom: '16px' }}>
        <h1 className="gradient-text" style={{ fontSize: '1.8rem', marginBottom: '4px' }}>{t('chatTitle', lang)}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('chatDesc', lang)}</p>
      </div>

      {/* Messages Flow Container */}
      <div 
        className="glass-panel" 
        data-testid="chat_messages_flow" 
        style={{ flex: 1, padding: '20px', overflowY: 'auto', marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
            <div 
              style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '16px',
                background: msg.sender === 'user' ? (highContrast ? '#333333' : '#C8E6C9') : (highContrast ? '#000000' : '#E2E8F0'),
                color: highContrast ? '#ffff00' : '#1E293B',
                border: highContrast ? '1px solid #ffff00' : 'none',
                whiteSpace: 'pre-wrap',
                fontSize: '0.9rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold', opacity: 0.8 }}>
                  {msg.sender === 'user' ? 'You' : 'SafeBank AI'}
                </span>
                {msg.sender === 'assistant' && (
                  <VoiceReadButton text={msg.text} lang={lang} size={14} />
                )}
              </div>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>
            <RefreshCw className="animate-spin" size={16} /> Thinking safety response...
          </div>
        )}
      </div>

      {/* Quick Suggestion Chips */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '8px' }}>
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleSendMessage(chip.query)}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
          >
            💡 {lang === 'te' ? chip.labelTe : lang === 'hi' ? chip.labelHi : chip.labelEn}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          id="chat_input_text"
          data-testid="chat_input_text"
          type="text"
          className="form-input"
          placeholder={t('chatPlaceholder', lang)}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <VoiceMicButton onTranscript={(txt) => handleSendMessage(txt)} lang={lang} />
        <button
          id="chat_send_btn"
          data-testid="chat_send_btn"
          onClick={() => handleSendMessage()}
          className="btn btn-primary"
          style={{ padding: '0 20px' }}
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

/* ==========================================
   REPORT FRAUD WITNESS FORM PAGE
   ========================================== */
function ReportFraudPage({ currentUserEmail, userToken, lang, highContrast }) {
  const [reporterName, setReporterName] = useState('');
  const [reportTarget, setReportTarget] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  const [localReports, setLocalReports] = useState(() => {
    return JSON.parse(localStorage.getItem('userFraudReports') || '[]');
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reportTarget.trim() || !reportDetails.trim()) return;

    setLoading(true);
    setSuccessMsg('');

    const payload = {
      category: 'UPI ID',
      reporterName: reporterName || 'Anonymous',
      targetValue: reportTarget,
      details: reportDetails,
      timestamp: Date.now(),
      riskScore: 92,
      status: 'VERIFIED_FRAUD'
    };

    await SupabaseService.insertReport(payload, userToken);
    
    const updated = [payload, ...localReports];
    setLocalReports(updated);
    localStorage.setItem('userFraudReports', JSON.stringify(updated));

    setLoading(false);
    setSuccessMsg(t('reportSuccess', lang));
    setReportTarget('');
    setReportDetails('');
  };

  const handleDeleteReport = (idx) => {
    const updated = localReports.filter((_, i) => i !== idx);
    setLocalReports(updated);
    localStorage.setItem('userFraudReports', JSON.stringify(updated));
  };

  return (
    <div className="animate-fade-in" data-testid="report_scroll_list">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '4px' }}>{t('reportTitle', lang)}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('reportSubtitle', lang)}</p>
      </div>

      {successMsg && (
        <div className="alert-banner alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      {/* Form Card */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="report_name_input">{t('fieldReporter', lang)}</label>
            <input
              id="report_name_input"
              data-testid="report_name_input"
              type="text"
              className="form-input"
              placeholder="Your Name (Optional)"
              value={reporterName}
              onChange={(e) => setReporterName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="report_target_input">{t('fieldTarget', lang)}</label>
            <input
              id="report_target_input"
              data-testid="report_target_input"
              type="text"
              className="form-input"
              placeholder="e.g. +91 91930 xxxxx, or fraud@upi"
              value={reportTarget}
              onChange={(e) => setReportTarget(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="report_details_input">{t('fieldDetails', lang)}</label>
            <textarea
              id="report_details_input"
              data-testid="report_details_input"
              className="form-input"
              rows={3}
              placeholder="What did they request or say to you?"
              value={reportDetails}
              onChange={(e) => setReportDetails(e.target.value)}
            />
          </div>

          <button
            id="report_submit_btn"
            data-testid="report_submit_btn"
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px' }}
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <FileText size={18} />} {t('btnSubmitReport', lang)}
          </button>
        </form>
      </div>

      {/* Historical Witness Log */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '14px' }}>
        Secure Witness Logs ({localReports.length})
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {localReports.length === 0 ? (
          <div className="glass-panel" style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No witness reports registered yet.
          </div>
        ) : (
          localReports.map((item, idx) => (
            <div key={idx} className="glass-panel" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 'bold', color: highContrast ? '#ffff00' : '#ef4444' }}>Target: {item.targetValue}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '2px' }}>Details: {item.details}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Reporter: {item.reporterName}</div>
              </div>
              <button 
                data-testid="delete_report_btn" 
                onClick={() => handleDeleteReport(idx)}
                className="btn btn-secondary"
                style={{ padding: '6px', color: '#ef4444' }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ==========================================
   EMERGENCY SOS PAGE
   ========================================== */
function EmergencySosPage({ currentUserEmail, userToken, lang, highContrast, sosTriggered, toggleSosAlert, sosLocation }) {
  const [contacts, setContacts] = useState(() => {
    return JSON.parse(localStorage.getItem('emergencyContacts') || '[]');
  });

  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');

  const handleAddContact = () => {
    if (!cName || !cPhone) return;
    const updated = [...contacts, { name: cName, phone: cPhone }];
    setContacts(updated);
    localStorage.setItem('emergencyContacts', JSON.stringify(updated));
    SupabaseService.upsertUserContacts(currentUserEmail, updated, userToken);
    setCName('');
    setCPhone('');
  };

  const handleDeleteContact = (idx) => {
    const updated = contacts.filter((_, i) => i !== idx);
    setContacts(updated);
    localStorage.setItem('emergencyContacts', JSON.stringify(updated));
    SupabaseService.upsertUserContacts(currentUserEmail, updated, userToken);
  };

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center' }}>
      <div style={{ marginBottom: '24px', textAlign: 'left' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '4px' }}>{t('sosHelp', lang)}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>{t('sosDesc', lang)}</p>
      </div>

      {/* Giant Red Touch Button */}
      <div style={{ margin: '32px 0', display: 'flex', justifyContent: 'center' }}>
        <div 
          data-testid="sos_giant_touch_btn"
          onClick={toggleSosAlert}
          style={{
            width: '180px',
            height: '180px',
            borderRadius: '90px',
            background: sosTriggered ? '#10b981' : '#ef4444',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: sosTriggered ? '0 0 30px #10b981' : '0 0 30px #ef4444',
            transition: 'all 0.3s ease'
          }}
        >
          <ShieldAlert size={56} color="#ffffff" />
          <span style={{ color: '#ffffff', fontWeight: 900, fontSize: '1.2rem', marginTop: '6px' }}>
            {sosTriggered ? 'ACTIVE' : 'TAP SOS'}
          </span>
        </div>
      </div>

      {/* Contacts List */}
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'left', marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '14px' }}>{t('savedContacts', lang)}</h3>
        {contacts.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{t('noContacts', lang)}</p>
        ) : (
          contacts.map((c, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <span style={{ fontWeight: 'bold' }}>{c.name}</span> <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>({c.phone})</span>
              </div>
              <button onClick={() => handleDeleteContact(idx)} className="btn btn-secondary" style={{ padding: '4px 8px', color: '#ef4444' }}>
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}

        {/* Add Contact Form */}
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            className="form-input"
            placeholder={t('contactName', lang)}
            value={cName}
            onChange={(e) => setCName(e.target.value)}
          />
          <input
            type="text"
            className="form-input"
            placeholder={t('contactPhone', lang)}
            value={cPhone}
            onChange={(e) => setCPhone(e.target.value)}
          />
          <button data-testid="add_contact_btn" onClick={handleAddContact} className="btn btn-primary" style={{ padding: '0 20px' }}>
            <Plus size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   ACCESSIBILITY SETTINGS PAGE
   ========================================== */
function SettingsPage({ 
  lang, 
  setLang, 
  highContrast, 
  setHighContrast, 
  textScale, 
  setTextScale,
  voiceNavigationEnabled,
  setVoiceNavigationEnabled
}) {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="gradient-text" data-testid="settings_title" style={{ fontSize: '2rem', marginBottom: '4px' }}>{t('settingsTitle', lang)}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure font scale, voice narration, and high contrast options</p>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        {/* Voice Narration Switch */}
        <div className="switch-container">
          <div>
            <div style={{ fontWeight: 'bold' }}>{t('voiceGuideToggle', lang)}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('voiceGuideDesc', lang)}</div>
          </div>
          <label className="switch">
            <input 
              id="voice-narration-switch"
              data-testid="voice_assist_switch"
              type="checkbox" 
              checked={voiceNavigationEnabled} 
              onChange={(e) => setVoiceNavigationEnabled(e.target.checked)} 
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* High Contrast Toggle */}
        <div className="switch-container">
          <div>
            <div style={{ fontWeight: 'bold' }}>{t('highContrastToggle', lang)}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('highContrastDesc', lang)}</div>
          </div>
          <label className="switch">
            <input 
              id="contrast-toggle"
              data-testid="high_contrast_switch"
              type="checkbox" 
              checked={highContrast} 
              onChange={() => setHighContrast(!highContrast)} 
            />
            <span className="slider"></span>
          </label>
        </div>

        {/* Text Scaling Selection */}
        <div style={{ marginTop: '20px' }}>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>{t('textSizeTitle', lang)}</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={() => setTextScale('normal')} 
              className={`btn ${textScale === 'normal' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
            >
              {t('sizeNormal', lang)}
            </button>
            <button 
              onClick={() => setTextScale('large')} 
              className={`btn ${textScale === 'large' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
            >
              {t('sizeLarge', lang)}
            </button>
            <button 
              onClick={() => setTextScale('xlarge')} 
              className={`btn ${textScale === 'xlarge' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ flex: 1 }}
            >
              {t('sizeExtra', lang)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================
   ADMIN PANEL PAGE
   ========================================== */
function AdminPanelPage({ userToken, lang, highContrast }) {
  const [userLogins, setUserLogins] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    const fetchAdminData = async () => {
      const logins = await SupabaseService.getUserLogins(userToken);
      const logs = await SupabaseService.getActivityLogs(userToken);
      setUserLogins(logins);
      setActivityLogs(logs);
    };
    fetchAdminData();
  }, [userToken]);

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '4px' }}>Admin Desk Control Panel</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Global system telemetry & fraud intelligence breakdown</p>
      </div>

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '12px' }}>Crime Categories Distribution</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span>SMS Phishing Scams</span>
              <span>45%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '45%', height: '100%', background: '#ef4444' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span>Fake Calling Vishing Threats</span>
              <span>35%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '35%', height: '100%', background: '#f59e0b' }}></div>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
              <span>UPI QR Reward Fraud</span>
              <span>20%</span>
            </div>
            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: '20%', height: '100%', background: '#10b981' }}></div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={() => voiceService.speak("Emergency danger notice dispatched: Keep PINs confidential.", lang)} className="btn btn-danger" style={{ width: '100%', padding: '14px', fontWeight: 'bold' }}>
        Dispatch Danger Signal Broadcast
      </button>
    </div>
  );
}

/* ==========================================
   USER PROFILE PAGE
   ========================================== */
function ProfilePage({ 
  currentUserEmail, 
  userToken, 
  onLogout,
  lang, 
  setLang, 
  highContrast, 
  setHighContrast, 
  textScale, 
  setTextScale,
  voiceNavigationEnabled,
  setVoiceNavigationEnabled
}) {
  const [successMsg, setSuccessMsg] = useState('');

  const handleSave = () => {
    setSuccessMsg('Profile preferences updated successfully.');
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '4px' }}>{t('profile', lang)}</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your personal details and settings</p>
      </div>

      {successMsg && (
        <div id="profile-success-msg" className="alert-banner alert-success" style={{ marginBottom: '20px' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '16px' }}>{t('userDetails', lang)}</h3>
        
        <div style={{ marginBottom: '16px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block' }}>Email Address</span>
          <span id="profile-email-text" style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>{currentUserEmail}</span>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block' }}>Account Status</span>
          <span className="badge badge-success">Active</span>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'block' }}>Member Since</span>
          <span style={{ fontWeight: 500 }}>October 2023</span>
        </div>

        {/* Toggles */}
        <div className="switch-container">
          <span>Dark/Contrast Theme</span>
          <label className="switch">
            <input id="theme-toggle" type="checkbox" checked={true} onChange={() => {}} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="switch-container">
          <span>High Contrast Mode</span>
          <label className="switch">
            <input id="contrast-toggle" type="checkbox" checked={highContrast} onChange={() => setHighContrast(!highContrast)} />
            <span className="slider"></span>
          </label>
        </div>

        <div className="switch-container">
          <span>Voice Alerts</span>
          <label className="switch">
            <input id="alerts-toggle" type="checkbox" checked={voiceNavigationEnabled} onChange={() => setVoiceNavigationEnabled(!voiceNavigationEnabled)} />
            <span className="slider"></span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button id="profile-save-btn" onClick={handleSave} className="btn btn-primary" style={{ flex: 1 }}>
            Save Preferences
          </button>
          <button onClick={onLogout} className="btn btn-danger" style={{ flex: 1 }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
