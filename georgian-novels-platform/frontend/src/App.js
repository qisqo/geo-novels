import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import AuthModal from './pages/AuthModal';
import Home from './pages/Home';
import NovelDetails from './pages/NovelDetails';
import Reader from './pages/Reader';
import AddNovel from './pages/AddNovel';
import EditNovel from './pages/EditNovel';
import Profile from './pages/Profile';
import SubscriptionPage from './pages/SubscriptionPage';

function AppContent() {
  const [darkMode, setDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState(18);
  const [user, setUser] = useState(localStorage.getItem('user'));
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.body.className = darkMode ? '' : 'light';
  }, [darkMode]);

  const handleLoginSuccess = (username, role, subscriptionStatus, subscriptionExpiresAt) => {
    setUser(username);
    localStorage.setItem('user', username);
    localStorage.setItem('role', role || 'user');
    if (subscriptionStatus) localStorage.setItem('subscriptionStatus', subscriptionStatus);
    if (subscriptionExpiresAt) localStorage.setItem('subscriptionExpiresAt', subscriptionExpiresAt);
    setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    navigate('/');
  };

  return (
    <>
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        user={user}
        onLogout={handleLogout}
        onOpenLogin={() => setShowAuth(true)}
      />
      <Routes>
        <Route path="/" element={<Home onOpenLogin={() => setShowAuth(true)} />} />
        <Route path="/novel/:id" element={<NovelDetails />} />
        <Route path="/novel/:id/reader/:chapterIndex" element={<Reader fontSize={fontSize} setFontSize={setFontSize} />} />
        <Route path="/edit/:id" element={<EditNovel />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/add" element={<AddNovel />} />
        <Route path="/subscription" element={<SubscriptionPage user={user} />} />
      </Routes>
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onLoginSuccess={handleLoginSuccess} />
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;