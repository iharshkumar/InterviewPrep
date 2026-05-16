import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Scene from '../components/Scene';
import { ArrowRight, Video } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
  const navigate = useNavigate();
  
  return (
    <div className="landing-page">
      <div className="landing-content">
        <motion.div 
          className="hero-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="badge">
            <span className="badge-dot"></span>
            AI-Powered Interviews
          </div>
          <h1 className="hero-title">
            Master Your Next <br />
            <span className="gradient-text">Tech Interview</span>
          </h1>
          <p className="hero-description">
            Experience hyper-realistic, dynamic 3D mock interviews driven by advanced AI. Get instant, actionable feedback and land your dream job.
          </p>
          <div className="hero-actions">
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Start Free Interview <ArrowRight size={18} />
            </Button>
            <Button variant="secondary">
              <Video size={18} /> Watch Demo
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="landing-3d-container">
        <motion.div 
          className="canvas-wrapper"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <Scene />
        </motion.div>
      </div>
      
      {/* Decorative background glows */}
      <div className="glow-orb orb-1"></div>
      <div className="glow-orb orb-2"></div>
    </div>
  );
};

export default LandingPage;
