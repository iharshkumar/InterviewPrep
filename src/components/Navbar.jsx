import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, LogOut } from 'lucide-react';
import Button from './Button';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';
import { CgProfile } from "react-icons/cg";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Bot className="logo-icon" size={28} />
          <span className="gradient-text">MockPrep AI</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className="nav-link">Home</Link>
          {user ? (
            <>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Button variant="secondary" onClick={() => navigate('/profile')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CgProfile size={20} />
                  <span>Profile</span>
                </div>
              </Button>
              <Button variant="primary" onClick={handleLogout}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <LogOut size={16} />
                  <span>Logout</span>
                </div>
              </Button>
            </>
          ) : (
            <Button variant="primary" onClick={() => navigate('/login')}>
              Login
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
