import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import './Preloader.css';

const STATUS_MESSAGES = [
  { threshold: 15, text: "Initializing Administrative Core Modules..." },
  { threshold: 35, text: "Securing Database Streams..." },
  { threshold: 60, text: "Synapsing Candidate Profile Indices..." },
  { threshold: 80, text: "Syncing Streak & Performance Data..." },
  { threshold: 95, text: "Authenticating Admin Workspace..." },
  { threshold: 100, text: "Initialization Complete. Welcome." }
];

const Preloader = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing Administrative Core Modules...");

  useEffect(() => {
    let animationFrameId;
    let startTimestamp = null;
    const duration = 2400; // 2.4 seconds total simulated load time

    const animateProgress = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const computedProgress = Math.min((elapsed / duration) * 100, 100);

      setProgress(Math.floor(computedProgress));

      // Determine the active status message based on progress thresholds
      const activeStatus = STATUS_MESSAGES.find(msg => computedProgress <= msg.threshold);
      if (activeStatus) {
        setStatus(activeStatus.text);
      }

      if (elapsed < duration) {
        animationFrameId = requestAnimationFrame(animateProgress);
      } else {
        setProgress(100);
        setStatus("Initialization Complete. Welcome.");
        // Give 300ms delay at 100% so the user can see it finish before triggering completion
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 300);
      }
    };

    animationFrameId = requestAnimationFrame(animateProgress);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="preloader-container"
      initial={{ opacity: 1 }}
      exit={{ 
        opacity: 0,
        y: -20,
        transition: { duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96] }
      }}
    >
      {/* Background visual layers */}
      <div className="preloader-bg-glow" />
      <div className="preloader-grid" />
      <div className="preloader-scanline" />

      {/* Cybernetic Rings visual */}
      <div className="loader-visual-group">
        <div className="loader-ring-outer" />
        <div className="loader-ring-middle" />
        <div className="loader-orbit-dot" />
        <div className="loader-orbit-dot-2" />
        <div className="loader-core">
          <Shield className="loader-core-icon" />
        </div>
      </div>

      {/* Text logs & Progress tracking */}
      <div className="loader-content-panel">
        <h1 className="loader-title">MOCKPREP.AI</h1>
        <p className="loader-subtitle">Admin Control Panel</p>
        
        <div className="loader-percentage-container">
          <span className="loader-percentage-num">{progress}</span>
          <span className="loader-percentage-symbol">%</span>
        </div>

        <div className="loader-status-container">
          <span className="loader-status-indicator" />
          <span className="loader-status-text">{status}</span>
        </div>

        <div className="loader-progress-track">
          <div 
            className="loader-progress-bar" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Preloader;
