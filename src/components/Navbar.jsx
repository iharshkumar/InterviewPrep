import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import Button from './Button';
import './Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  
  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Bot className="logo-icon" size={28} />
          <span className="gradient-text">MockPrep AI</span>
        </Link>
        <div className="navbar-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Button variant="primary" onClick={() => navigate('/')}>Get Started</Button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
