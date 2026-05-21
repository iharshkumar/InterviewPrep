import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Scene from '../components/Scene';
import { ArrowRight, Video, X, ShieldAlert, Mic, BarChart, Code, Play, Pause, Volume2, VolumeX, Terminal, Cpu } from 'lucide-react';
import { dsaQuestions } from '../data/dsaQuestions';
import './LandingPage.css';

const DemoModal = ({ onClose, onProceed }) => {
  const [activePhase, setActivePhase] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [tick, setTick] = useState(0);

  const phases = [
    { id: 0, title: "1. Voice Interview Flow", icon: <Mic size={16} /> },
    { id: 1, title: "2. Coding Sandbox", icon: <Code size={16} /> },
    { id: 2, title: "3. Proctoring & Grading", icon: <BarChart size={16} /> }
  ];

  // Auto-tick simulation when playing
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setTick(prev => {
        if (prev >= 110) {
          return 110;
        }
        return prev + 1;
      });
    }, 70); // 70ms tick rate
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Handle auto-advance phase transition
  useEffect(() => {
    if (tick >= 110 && isPlaying) {
      if (activePhase < 2) {
        // Wait a short moment (1.5 seconds) to let the user see the completed state of the current phase, then advance
        const timer = setTimeout(() => {
          setActivePhase(prev => prev + 1);
          setTick(0);
        }, 1500);
        return () => clearTimeout(timer);
      } else {
        // Pause at the very end of phase 3
        const timer = setTimeout(() => {
          setIsPlaying(false);
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [tick, activePhase, isPlaying]);

  // Reset tick state when user manually switches phases
  const handlePhaseChange = (phaseId) => {
    setActivePhase(phaseId);
    setTick(0);
    setIsPlaying(true);
  };

  const progressPercent = Math.min((tick / 110) * 100, 100);
  const overallProgressPercent = ((activePhase * 110) + tick) / 330 * 100;

  // Time format helper
  const getElapsedSimTime = () => {
    const elapsedSecs = Math.round((activePhase * 60) + (progressPercent * 0.6));
    const mins = Math.floor(elapsedSecs / 60);
    const secs = elapsedSecs % 60;
    return `0${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Content for Phase 0: Voice Interview
  const aiSpeechText = "Welcome to MockPrep AI. To start, could you explain your experience with React and dynamic imports?";
  const candidateSpeechText = "Sure! I have over 3 years of fullstack experience. I use dynamic imports and lazy loading to split large bundles. In my last project, this reduced LCP load time by 35% and optimized the overall Web Vital metric...";

  // Content for Phase 1: Code editor
  const codingSample = `class Solution {
public:
    vector<int> twoSumSorted(vector<int>& numbers, int target) {
        int left = 0;
        int right = numbers.size() - 1;
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) return {left + 1, right + 1};
            else if (sum < target) left++;
            else right--;
        }
        return {};
    }
};`;

  return (
    <motion.div 
      className="demo-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="demo-modal-content glass-panel"
        initial={{ scale: 0.95, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 30, opacity: 0 }}
      >
        <button className="demo-close-btn" onClick={onClose} title="Close Demo">
          <X size={20} />
        </button>

        <div className="demo-modal-header">
          <h2 className="gradient-text">Interactive Demo Player</h2>
          <p className="demo-subtitle">See how MockPrep AI operates live in your browser</p>
        </div>

        {/* Phase selection tabs */}
        <div className="demo-tabs">
          {phases.map(p => (
            <button
              key={p.id}
              className={`demo-tab-btn ${activePhase === p.id ? 'active' : ''}`}
              onClick={() => handlePhaseChange(p.id)}
            >
              {p.icon}
              <span>{p.title}</span>
            </button>
          ))}
        </div>

        {/* Dynamic Video Player Screen */}
        <div className="demo-player-container">
          <div className="demo-player-screen">
            {/* Phase 0: Voice dictation */}
            {activePhase === 0 && (
              <div className="sim-voice-interview">
                <div className="sim-avatar-container">
                  <div className={`sim-avatar-circle ${tick < 40 ? 'speaking' : ''}`}>
                    <Cpu size={40} className="glow-icon" />
                    {tick < 40 && (
                      <>
                        <span className="wave-ring ring-1"></span>
                        <span className="wave-ring ring-2"></span>
                      </>
                    )}
                  </div>
                  <span className="sim-avatar-label">Gemini AI Interviewer</span>
                </div>

                <div className="sim-chat-bubbles">
                  {/* AI Speech Bubble */}
                  <div className="sim-bubble ai-bubble">
                    <span className="bubble-author">INTERVIEWER</span>
                    <p>
                      {tick < 40 
                        ? aiSpeechText.substring(0, Math.round(tick * (aiSpeechText.length / 35))) 
                        : aiSpeechText
                      }
                      {tick < 40 && <span className="typing-cursor">|</span>}
                    </p>
                  </div>

                  {/* Candidate Speech bubble typing */}
                  {tick >= 40 && (
                    <div className="sim-bubble user-bubble animate-slide-up">
                      <span className="bubble-author">
                        <span className="mic-dot active"></span> CANDIDATE (Voice Typing)
                      </span>
                      <p>
                        {candidateSpeechText.substring(0, Math.round((tick - 40) * (candidateSpeechText.length / 65)))}
                        {tick < 105 && <span className="typing-cursor">|</span>}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Phase 1: Coding Sandbox */}
            {activePhase === 1 && (
              <div className="sim-coding-workspace">
                <div className="sim-editor-frame">
                  <div className="editor-header">
                    <span className="editor-file">twoSumSorted.cpp (C++)</span>
                    <div className="editor-dots">
                      <span className="dot dot-r"></span>
                      <span className="dot dot-y"></span>
                      <span className="dot dot-g"></span>
                    </div>
                  </div>
                  <div className="editor-body">
                    <div className="editor-line-numbers">
                      {Array.from({ length: 13 }).map((_, i) => (
                        <span key={i}>{i + 1}</span>
                      ))}
                    </div>
                    <pre className="editor-code">
                      <code>
                        {codingSample.substring(0, Math.round(tick * (codingSample.length / 75)))}
                        {tick < 75 && <span className="typing-cursor">|</span>}
                      </code>
                    </pre>
                  </div>
                </div>

                <div className="sim-compiler-console">
                  <div className="console-header">
                    <Terminal size={14} /> Console Output
                    {tick >= 78 && tick <= 85 && <span className="console-loading">Compiling...</span>}
                  </div>
                  <div className="console-body">
                    {tick >= 82 && <p className="text-info">&gt; g++ -O3 twoSumSorted.cpp</p>}
                    {tick >= 85 && <p className="text-info">&gt; Running 3 test cases...</p>}
                    {tick >= 89 && <p className="text-success">✓ Test Case 1 Passed! [input: [2,7,11,15], target: 9]</p>}
                    {tick >= 93 && <p className="text-success">✓ Test Case 2 Passed! [input: [2,3,4], target: 6]</p>}
                    {tick >= 97 && <p className="text-success">✓ Test Case 3 Passed! [input: [-1,0], target: -1]</p>}
                    {tick >= 102 && (
                      <p className="text-highlight font-bold animate-pulse">
                        Result: SUCCESS (All 3/3 test cases passed)
                      </p>
                    )}
                  </div>
                </div>

                {/* Simulated mouse click cursor */}
                {tick >= 74 && tick <= 80 && (
                  <div className="sim-mouse-cursor animate-mouse-click">
                    ⚡ Run Code
                  </div>
                )}
              </div>
            )}

            {/* Phase 2: Proctoring Warning and Report Card */}
            {activePhase === 2 && (
              <div className="sim-evaluation-workspace">
                {/* Proctor Alert Warning shown at the beginning */}
                {tick >= 5 && tick < 40 && (
                  <div className="sim-proctor-alert animate-flash-red">
                    <div className="alert-content">
                      <ShieldAlert size={40} className="alert-icon" />
                      <h3>PROCTOR WARNING: TAB SWITCH DETECTED</h3>
                      <p>Violation 1/3 triggered. Exiting full-screen or switching tabs is penalized in the AI score evaluation.</p>
                    </div>
                  </div>
                )}

                {/* Evaluation dashboard appears at tick 40 */}
                {tick >= 40 && (
                  <div className="sim-report-card animate-scale-up">
                    <div className="report-header">
                      <h3>AI Technical Assessment Report</h3>
                      <div className="report-badge">Brutal Honesty Mode</div>
                    </div>
                    <div className="report-summary">
                      <div className="score-dial-wrapper">
                        <div className="score-dial">
                          <span className="score-number">
                            {Math.round(Math.min((tick - 40) * (88 / 60), 88))}%
                          </span>
                          <span className="score-label">Overall Score</span>
                        </div>
                      </div>
                      <div className="critique-box">
                        <h4>Interviewer Evaluation</h4>
                        <p>
                          "Candidate displayed excellent DSA logic, implementing the optimal two-pointer sum approach with O(N) complexity. Deductions were made for academic integrity violations (switching tabs)."
                        </p>
                      </div>
                    </div>
                    <div className="subscores">
                      <div className="subscore-item">
                        <span>Technical Capability</span>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: '92%' }}></div>
                        </div>
                        <span className="subscore-val">9.2/10</span>
                      </div>
                      <div className="subscore-item">
                        <span>Communication Depth</span>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: '85%' }}></div>
                        </div>
                        <span className="subscore-val">8.5/10</span>
                      </div>
                      <div className="subscore-item font-bold text-red">
                        <span>Proctor Integrity Penalty</span>
                        <div className="progress-bar-track track-red">
                          <div className="progress-bar-fill fill-red" style={{ width: '30%' }}></div>
                        </div>
                        <span className="subscore-val">-1.5 pt</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom video-like control toolbar */}
          <div className="demo-controls-bar">
            <div className="player-left">
              <button 
                className="player-btn" 
                onClick={() => {
                  if (!isPlaying && activePhase === 2 && tick >= 110) {
                    setActivePhase(0);
                    setTick(0);
                    setIsPlaying(true);
                  } else {
                    setIsPlaying(!isPlaying);
                  }
                }}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              </button>
              <span className="player-time">{getElapsedSimTime()} / 03:00</span>
            </div>

            {/* Interactive Timeline track */}
            <div className="player-timeline" onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickedPercent = Math.max(0, Math.min(1, clickX / rect.width));
              const targetTickOverall = Math.round(clickedPercent * 330);
              
              const newPhase = Math.min(2, Math.floor(targetTickOverall / 110));
              const newTick = targetTickOverall % 110;
              
              setActivePhase(newPhase);
              setTick(newTick);
              setIsPlaying(true);
            }}>
              <div className="timeline-track">
                <div className="timeline-fill" style={{ width: `${overallProgressPercent}%` }}></div>
                <div className="timeline-handle" style={{ left: `${overallProgressPercent}%` }}></div>
              </div>
            </div>

            <div className="player-right">
              <button className="player-btn" onClick={() => setIsMuted(!isMuted)}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
              <div className="player-badge">LIVE SIMULATION</div>
            </div>
          </div>
        </div>

        <div className="demo-footer-info">
          <p>
            {activePhase === 0 && "HR section evaluates career experience and records dictation inputs."}
            {activePhase === 1 && "Coding sandbox validates your algorithms against standard hidden test cases."}
            {activePhase === 2 && "Proctoring flags violations and compiles detailed metrics with constructive feedback."}
          </p>
          <div className="demo-actions">
            <Button variant="secondary" onClick={onClose}>
              Back to Home
            </Button>
            <Button variant="primary" onClick={onProceed} className="glow-btn-orange">
              Enter Interview Room <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const [showDemo, setShowDemo] = useState(false);

  const handleStartCodingTest = () => {
    const questionPool = dsaQuestions.medium;
    // Pick 3 random questions
    const shuffled = [...questionPool].sort(() => 0.5 - Math.random());
    const selectedQuestions = shuffled.slice(0, 3);

    navigate('/coding-test', {
      state: {
        questions: selectedQuestions,
        role: 'Fullstack Developer',
        difficulty: 'mid',
        resumeText: ''
      }
    });
  };
  
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
            <Button 
              variant="coding" 
              onClick={handleStartCodingTest}
            >
              Start Coding Interview (60 min) <Code size={18} style={{ marginLeft: '8px' }} />
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
