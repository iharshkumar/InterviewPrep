import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import InterviewRoom from './pages/InterviewRoom';
import ResultPage from './pages/ResultPage';
import CodingTest from './pages/CodingTest';
import CodingResult from './pages/CodingResult';
import Preloader from './components/Preloader';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Leaderboard from './pages/Leaderboard';
import { AuthProvider, useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function AppContent() {
  const location = useLocation();
  const hideNavbar = ['/coding-test', '/coding-results', '/interview', '/results'].some(path => location.pathname.toLowerCase().includes(path));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {!hideNavbar && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><InterviewRoom /></ProtectedRoute>} />
          <Route path="/results" element={<ProtectedRoute><ResultPage /></ProtectedRoute>} />
          <Route path="/coding-test" element={<ProtectedRoute><CodingTest /></ProtectedRoute>} />
          <Route path="/coding-results" element={<ProtectedRoute><CodingResult /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        </Routes>
      </AnimatePresence>
    </motion.div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <Router>
      <AuthProvider>
        <AnimatePresence mode="wait">
          {loading ? (
            <Preloader key="preloader" onComplete={() => setLoading(false)} />
          ) : (
            <AppContent key="content" />
          )}
        </AnimatePresence>
      </AuthProvider>
    </Router>
  );
}

export default App;

