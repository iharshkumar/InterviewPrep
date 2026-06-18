import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users as UsersIcon, Award, LogOut, Shield } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Performance from './pages/Performance';
import Preloader from './components/Preloader';

// Route protector for admin authorization
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Sidebar Layout Wrapper
const DashboardLayout = () => {
  const location = useLocation();
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/login';
  };

  const isActive = (path) => {
    return location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));
  };

  return (
    <div className="dashboard-layout">
      {/* Side Navigation Panel */}
      <aside className="sidebar">
        <div className="sidebar-title">
          <Shield size={24} color="#8B5CF6" />
          <span>MockPrep Admin</span>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ul className="nav-links">
            <li>
              <Link to="/dashboard" className={`nav-item ${isActive('/dashboard') ? 'active' : ''}`}>
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/users" className={`nav-item ${isActive('/users') ? 'active' : ''}`}>
                <UsersIcon size={18} />
                Candidates
              </Link>
            </li>
            <li>
              <Link to="/performance" className={`nav-item ${isActive('/performance') ? 'active' : ''}`}>
                <Award size={18} />
                Simulations
              </Link>
            </li>
          </ul>
          <button onClick={handleLogout} className="logout-btn" style={{ background: 'none', border: 'none', textAlign: 'left', width: '100%' }}>
            <LogOut size={18} />
            Sign Out
          </button>
        </nav>
      </aside>

      {/* Main Panel Viewport */}
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/performance" element={<Performance />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function AppContent() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </motion.div>
  );
}

function App() {
  const [loading, setLoading] = useState(true);

  return (
    <Router>
      <AnimatePresence mode="wait">
        {loading ? (
          <Preloader key="preloader" onComplete={() => setLoading(false)} />
        ) : (
          <AppContent key="content" />
        )}
      </AnimatePresence>
    </Router>
  );
}

export default App;
