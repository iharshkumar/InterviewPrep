import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Scene from '../components/Scene';
import { ArrowRight, Video, X, ChevronRight, ChevronLeft, Layers, ShieldAlert, Mic, BarChart } from 'lucide-react';
import './LandingPage.css';

const DemoModal = ({ onClose, onProceed }) => {
  const [slide, setSlide] = useState(0);

  const slides = [
    {
      icon: <Layers size={48} color="#6366f1" />,
      title: "3-Part Sequential Flow",
      description: "Experience a seamless, full-length interview. You will progress automatically through HR, Technical, and Behavioral sections—each 20 minutes long—without ever leaving the room."
    },
    {
      icon: <ShieldAlert size={48} color="#ef4444" />,
      title: "Strict AI Proctoring",
      description: "MockPrep AI enforces academic integrity. Your webcam must remain on. Switching tabs, exiting full-screen, or using keyboard shortcuts like Copy/Paste/Save will trigger immediate violations."
    },
    {
      icon: <Mic size={48} color="#10b981" />,
      title: "Voice Dictation",
      description: "Answer naturally. Use the 'Dictate Answer' button to speak your thoughts. The AI speech-to-text engine will transcribe your answer in real-time, allowing you to focus on your technical explanation."
    },
    {
      icon: <BarChart size={48} color="#a855f7" />,
      title: "Elite AI Grading",
      description: "Expect brutal honesty. Subjective answers are weighted 4x higher than multiple-choice. Superficial answers score poorly, while deep, real-world explanations score highly."
    }
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) setSlide(prev => prev + 1);
  };
  const handlePrev = () => {
    if (slide > 0) setSlide(prev => prev - 1);
  };

  return (
    <motion.div 
      className="demo-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="demo-modal-content glass-panel"
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 20, opacity: 0 }}
      >
        <button className="demo-close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="demo-slide-container">
          <AnimatePresence mode="wait">
            <motion.div 
              key={slide}
              className="demo-slide"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -50, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="demo-icon-wrapper">
                {slides[slide].icon}
              </div>
              <h2>{slides[slide].title}</h2>
              <p>{slides[slide].description}</p>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="demo-controls">
          <div className="demo-progress">
            {slides.map((_, i) => (
              <div key={i} className={`demo-dot ${i === slide ? 'active' : ''}`} />
            ))}
          </div>
          
          <div className="demo-buttons">
            <Button variant="secondary" onClick={handlePrev} disabled={slide === 0}>
              <ChevronLeft size={18} /> Prev
            </Button>
            
            {slide === slides.length - 1 ? (
              <Button variant="primary" onClick={onProceed} style={{ background: 'linear-gradient(to right, #6366f1, #a855f7)', border: 'none' }}>
                I'm Ready! <ArrowRight size={18} />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleNext}>
                Next <ChevronRight size={18} />
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);
  
  return (
    <div className="landing-page">
      <AnimatePresence>
        {showDemo && (
          <DemoModal 
            onClose={() => setShowDemo(false)} 
            onProceed={() => {
              setShowDemo(false);
              navigate('/dashboard');
            }} 
          />
        )}
      </AnimatePresence>

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
            <Button variant="secondary" onClick={() => setShowDemo(true)}>
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
