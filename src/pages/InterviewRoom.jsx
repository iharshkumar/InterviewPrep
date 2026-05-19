import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, MessageSquare, PhoneOff, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as faceapi from 'face-api.js';
import Scene from '../components/Scene';
import Button from '../components/Button';
import './InterviewRoom.css';

const InterviewRoom = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  const { 
    questions: initialQuestions, 
    role, 
    resumeText, 
    difficulty, 
    pendingSections: initialPendingSections 
  } = location.state || { questions: [], role: 'unknown', pendingSections: [] };
  
  const [questions, setQuestions] = useState(initialQuestions || []);
  const [pendingSections, setPendingSections] = useState(initialPendingSections || []);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes (1200 seconds)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const intendedListeningRef = useRef(false);
  const isListeningStateRef = useRef(false);
  const videoRef = useRef(null);

  // Proctoring States
  const [violationCount, setViolationCount] = useState(0);
  const [violationMessage, setViolationMessage] = useState('');
  const [showViolation, setShowViolation] = useState(false);

  const handleViolation = (message) => {
    setViolationCount(prev => prev + 1);
    setViolationMessage(message);
    setShowViolation(true);
    setTimeout(() => setShowViolation(false), 5000);
  };

  // Proctoring - Copy, Paste, Right Click
  useEffect(() => {
    const blockAction = (e) => {
      // If the user is dictating, sometimes the OS triggers paste. We ignore it.
      if (isListeningStateRef.current) return;
      e.preventDefault();
      handleViolation("Copy/Paste/Right-Click is strictly prohibited during the interview.");
    };

    document.addEventListener('copy', blockAction);
    document.addEventListener('cut', blockAction);
    document.addEventListener('paste', blockAction);
    document.addEventListener('contextmenu', blockAction);

    return () => {
      document.removeEventListener('copy', blockAction);
      document.removeEventListener('cut', blockAction);
      document.removeEventListener('paste', blockAction);
      document.removeEventListener('contextmenu', blockAction);
    };
  }, []);

  // Proctoring - Block Save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const blockSave = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleViolation("Saving the page is strictly prohibited during the interview.");
      }
    };
    document.addEventListener('keydown', blockSave);
    return () => document.removeEventListener('keydown', blockSave);
  }, []);

  // Proctoring - Tab Switch & Fullscreen
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("Tab switching is prohibited! You must stay on the interview tab.");
      }
    };
    
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        handleViolation("Exiting Full-Screen is prohibited!");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Load Face API models
  useEffect(() => {
    const loadModels = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
      } catch (err) {
        console.error("Failed to load face detection models:", err);
      }
    };
    loadModels();
  }, []);

  // Setup Live Webcam
  useEffect(() => {
    let stream = null;
    
    const startCamera = async () => {
      try {
        if (camOn) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        } else {
          if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(t => t.stop());
            videoRef.current.srcObject = null;
          }
        }
      } catch (err) {
        console.error("Camera access denied or error:", err);
      }
    };
    
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [camOn]);

  const faceMissCountRef = useRef(0);
  // Face Detection Interval
  useEffect(() => {
    if (!camOn || !videoRef.current) return;
    
    const interval = setInterval(async () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        try {
          const detections = await faceapi.detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions({ scoreThreshold: 0.2 }));
          if (detections.length === 0) {
            faceMissCountRef.current += 1;
            if (faceMissCountRef.current >= 3) {
              handleViolation("No face detected! Please look at the camera.");
              faceMissCountRef.current = 0; // reset
            }
          } else {
            faceMissCountRef.current = 0; // reset if found
            if (detections.length > 1) {
              handleViolation("Multiple faces detected! You must be alone during the interview.");
            }
          }
        } catch (e) {
          console.error("Face detection error:", e);
        }
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [camOn]);

  useEffect(() => {
    if (!questions || questions.length === 0) {
      alert("No questions found. Redirecting to dashboard.");
      navigate('/dashboard');
    }
  }, [questions, navigate]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (val) => {
    setAnswers({ ...answers, [currentQuestionIndex]: val });
  };

  const handleProceedNextSection = async () => {
    if (pendingSections.length === 0) return;
    
    setIsFetchingNext(true);
    const nextSection = pendingSections[0];
    
    try {
      const response = await fetch('http://localhost:3001/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, role, difficulty, section: nextSection }),
      });
      const data = await response.json();
      
      if (data.questions) {
        setQuestions(prev => [...prev, ...data.questions]);
        setPendingSections(prev => prev.slice(1));
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeLeft(1200); // reset 20 min timer
      } else {
        alert("Failed to load next section. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching next section:", error);
      alert("Network error.");
    } finally {
      setIsFetchingNext(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const toggleListening = () => {
    if (intendedListeningRef.current) {
      intendedListeningRef.current = false;
      setIsListening(false);
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition. Please use Chrome or Edge.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      
      if (finalTranscript) {
        setAnswers(prev => ({
          ...prev,
          [currentQuestionIndex]: (prev[currentQuestionIndex] || '') + finalTranscript
        }));
      }
      
      setInterimText(interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === 'not-allowed') {
        alert("Microphone access blocked!\n\n1. Check the camera/mic icon in your browser's URL bar.\n2. On Mac: Go to System Settings -> Privacy & Security -> Microphone and ensure your browser is checked.");
        intendedListeningRef.current = false;
      } else if (event.error !== 'no-speech') {
        // Reset state on other errors like 'aborted' or 'network'
        intendedListeningRef.current = false;
        isListeningStateRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (intendedListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          intendedListeningRef.current = false;
          isListeningStateRef.current = false;
          setIsListening(false);
          setInterimText('');
        }
      } else {
        isListeningStateRef.current = false;
        setIsListening(false);
        setInterimText('');
      }
    };

    intendedListeningRef.current = true;
    isListeningStateRef.current = true;
    setIsListening(true);
    recognition.start();
    recognitionRef.current = recognition;
  };

  useEffect(() => {
    if (intendedListeningRef.current && recognitionRef.current) {
      intendedListeningRef.current = false;
      isListeningStateRef.current = false;
      setIsListening(false);
      recognitionRef.current.stop();
    }
    return () => {
      if (recognitionRef.current) {
        intendedListeningRef.current = false;
        isListeningStateRef.current = false;
        recognitionRef.current.stop();
      }
    };
  }, [currentQuestionIndex]);

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:3001/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, questions, role }),
      });
      const data = await response.json();
      navigate('/results', { state: { result: data } });
    } catch (error) {
      console.error("Evaluation failed:", error);
      alert("Failed to evaluate. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!questions || questions.length === 0) return null;

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="interview-room-fullscreen">
      
      {/* Violation Alert overlay */}
      <AnimatePresence>
        {showViolation && (
          <motion.div 
            className="violation-alert"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <AlertTriangle color="#ff4a4a" size={24} />
            <div>
              <h4>Proctoring Violation Logged</h4>
              <p>{violationMessage}</p>
            </div>
            <div className="violation-count">
              Violations: {violationCount}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header with Timer and Navigation */}
      <div className="interview-header glass-panel">
        <div className="header-left">
          <MessageSquare size={20} className="text-primary" />
          <h2 style={{ fontSize: '1.25rem' }}>Question {currentQuestionIndex + 1} of {questions.length}</h2>
          {currentQuestion.section && (
            <span className="question-type-badge" style={{ marginLeft: '10px', background: 'rgba(99, 102, 241, 0.2)' }}>
              {currentQuestion.section} Section
            </span>
          )}
          <span className="question-type-badge" style={{ marginLeft: '10px' }}>
            {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Subjective'}
          </span>
        </div>
        
        <div className="timer-badge-top">
          <Clock size={18} />
          <span className={timeLeft < 300 ? 'text-red' : ''}>{formatTime(timeLeft)}</span>
        </div>

        <div className="header-right">
           <Button variant="primary" className="end-call-btn" onClick={() => navigate('/dashboard')}>
            <PhoneOff size={16} /> Quit
          </Button>
        </div>
      </div>

      <div className="interview-body">
        {/* Main Full-Screen Question Panel */}
        <div className="main-question-panel glass-panel">
          <div className="question-container-large">
            <h3 className="question-text-large">{currentQuestion.question}</h3>
            
            <div className="answer-section-large">
              {currentQuestion.type === 'mcq' ? (
                <div className="mcq-options-large">
                  {currentQuestion.options?.map((option, idx) => (
                    <label key={idx} className={`mcq-label-large ${answers[currentQuestionIndex] === option ? 'selected' : ''}`}>
                      <input 
                        type="radio" 
                        name={`q-${currentQuestionIndex}`} 
                        value={option}
                        checked={answers[currentQuestionIndex] === option}
                        onChange={() => handleAnswerChange(option)}
                      />
                      {option}
                    </label>
                  ))}
                </div>
              ) : (
                <div className="subjective-wrapper">
                  <div className="subjective-toolbar">
                    <button 
                      className={`dictate-btn ${isListening ? 'listening' : ''}`}
                      onClick={toggleListening}
                      title={isListening ? "Stop listening" : "Start speaking"}
                    >
                      <Mic size={18} />
                      {isListening ? "Listening... (Click to stop)" : "Dictate Answer"}
                    </button>
                  </div>
                  <textarea 
                    className="subjective-input-large" 
                    placeholder="Type or dictate your detailed answer here..."
                    value={(answers[currentQuestionIndex] || '') + (isListening ? interimText : '')}
                    onChange={(e) => {
                      setAnswers(prev => ({...prev, [currentQuestionIndex]: e.target.value}));
                    }}
                    rows={10}
                  />
                </div>
              )}
            </div>
            
            <div className="question-navigation-large">
              <Button variant="secondary" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
                Previous
              </Button>
              
              {currentQuestionIndex === questions.length - 1 ? (
                pendingSections.length > 0 ? (
                  <Button variant="primary" onClick={handleProceedNextSection} disabled={isFetchingNext}>
                    {isFetchingNext ? 'Loading...' : `Proceed to ${pendingSections[0]}`}
                  </Button>
                ) : (
                  <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Evaluating...' : 'Submit Full Interview'}
                  </Button>
                )
              ) : (
                <Button variant="primary" onClick={handleNext}>
                  Next Question
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel for 3D AI and User Cam */}
        <div className="interview-side-widgets">
          <div className="ai-widget glass-panel">
            <Scene />
            <div className="widget-label pulsing">AI Interviewer</div>
          </div>
          
          <div className="user-widget glass-panel">
            {camOn ? (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                className="live-video"
                width="320"
                height="240"
              />
            ) : (
              <div className="cam-placeholder-small offline">
                <VideoOff size={24} />
              </div>
            )}
            <div className="widget-label">You</div>
          </div>

          <div className="controls-widget glass-panel">
            <button className={`control-btn-small ${!micOn ? 'muted' : ''}`} onClick={() => setMicOn(!micOn)}>
              {micOn ? <Mic size={18} /> : <MicOff size={18} />}
            </button>
            <button className={`control-btn-small ${!camOn ? 'muted' : ''}`} onClick={() => setCamOn(!camOn)}>
              {camOn ? <Video size={18} /> : <VideoOff size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoom;
